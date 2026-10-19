import { supabase } from '@/lib/supabase';
import type { Contribuyente, Documento } from '@/types';
import { blobABase64, crearJSONBlob, crearPDFBlob } from '@/utils/fileExport';
import { formatFechaHora, formatMoneda } from '@/utils/format';

export async function enviarCorreoDocumento(
  documento: Documento,
  contribuyente: Contribuyente,
  destinatario: string,
  tipo: 'emision' | 'invalidacion' | 'reenvio' = 'emision',
) {
  if (!supabase) return { ok: false, error: 'Supabase no está configurado.' };

  const [json, pdf] = await Promise.all([
    blobABase64(crearJSONBlob(documento, contribuyente)),
    blobABase64(crearPDFBlob(documento, contribuyente)),
  ]);
  const { error } = await supabase.functions.invoke('send-document', {
    body: {
      to: destinatario,
      subject: `${documento.tipo} ${documento.numeroGeneracion} - FactuSys`,
      html: `
        <div style="font-family:Arial,sans-serif;color:#1f2937;max-width:640px">
          <h1 style="color:#0f766e">FactuSys</h1>
          <h2>Documento tributario electrónico</h2>
          <p>Estimado/a <strong>${documento.clienteNombre}</strong>,</p>
          <p>Adjuntamos su ${documento.tipo} en formatos PDF y JSON.</p>
          <table style="border-collapse:collapse;width:100%">
            <tr><td style="padding:6px;border-bottom:1px solid #ddd">Número de generación</td><td style="padding:6px;border-bottom:1px solid #ddd"><strong>${documento.numeroGeneracion}</strong></td></tr>
            <tr><td style="padding:6px;border-bottom:1px solid #ddd">Fecha</td><td style="padding:6px;border-bottom:1px solid #ddd">${formatFechaHora(documento.fechaEmision)}</td></tr>
            <tr><td style="padding:6px;border-bottom:1px solid #ddd">Subtotal</td><td style="padding:6px;border-bottom:1px solid #ddd">${formatMoneda(documento.subtotal)}</td></tr>
            <tr><td style="padding:6px;border-bottom:1px solid #ddd">IVA</td><td style="padding:6px;border-bottom:1px solid #ddd">${formatMoneda(documento.iva)}</td></tr>
            <tr><td style="padding:6px"><strong>Total a pagar</strong></td><td style="padding:6px"><strong>${formatMoneda(documento.total)}</strong></td></tr>
          </table>
          <p>Gracias por su compra.</p>
        </div>
      `,
      attachments: [
        { filename: `${documento.numeroGeneracion}.json`, content: json, contentType: 'application/json' },
        { filename: `${documento.numeroGeneracion}.pdf`, content: pdf, contentType: 'application/pdf' },
      ],
      tipo,
    },
  });

  return error ? { ok: false, error: error.message } : { ok: true };
}
