import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

interface RequestBody {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{ filename: string; content: string; contentType?: string }>;
  tipo?: 'emision' | 'invalidacion' | 'reenvio';
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
  if (request.method !== 'POST') return jsonResponse({ error: 'Método no permitido' }, 405);

  const authorization = request.headers.get('Authorization');
  if (!authorization) return jsonResponse({ error: 'Autenticación requerida' }, 401);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { authorization } } },
  );
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return jsonResponse({ error: 'Sesión inválida' }, 401);

  const body = await request.json() as RequestBody;
  if (!body.to || !body.subject || !body.html) {
    return jsonResponse({ error: 'to, subject y html son obligatorios' }, 400);
  }

  const resendKey = Deno.env.get('RESEND_API_KEY');
  const from = Deno.env.get('RESEND_FROM');
  if (!resendKey || !from) {
    return jsonResponse({ error: 'Resend no está configurado en la Edge Function' }, 503);
  }

  const resendResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authorization: ['Bearer', resendKey].join(' '),
    },
    body: JSON.stringify({
      from,
      to: [body.to],
      subject: body.subject,
      html: body.html,
      attachments: body.attachments?.map(({ filename, content }) => ({ filename, content })),
    }),
  });
  const result = await resendResponse.json();
  if (!resendResponse.ok) {
    return jsonResponse({ error: result.message ?? 'Resend rechazó el envío' }, 502);
  }

  return jsonResponse({ id: result.id, userId: user.id, tipo: body.tipo });
});
