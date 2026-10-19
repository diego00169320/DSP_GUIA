create extension if not exists pgcrypto;

create table if not exists public.contribuyentes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  datos jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.productos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  datos jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  datos jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.documentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null check (tipo in ('FCF', 'CCF', 'NC')),
  numero_generacion text not null,
  estado text not null,
  fecha_emision timestamptz not null,
  datos jsonb not null,
  created_at timestamptz not null default now(),
  unique (user_id, numero_generacion)
);

create table if not exists public.envios_correo (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  documento_id uuid not null references public.documentos(id) on delete cascade,
  destinatario text not null,
  tipo text not null check (tipo in ('emision', 'invalidacion', 'reenvio')),
  estado text not null check (estado in ('Pendiente', 'Enviado', 'Fallido')),
  error text,
  enviado_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.contingencias (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  datos jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.respaldos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nombre text not null,
  storage_path text,
  tamano_bytes bigint not null default 0,
  created_at timestamptz not null default now()
);

alter table public.contribuyentes enable row level security;
alter table public.productos enable row level security;
alter table public.clientes enable row level security;
alter table public.documentos enable row level security;
alter table public.envios_correo enable row level security;
alter table public.contingencias enable row level security;
alter table public.respaldos enable row level security;

create policy "users manage own contribuyente" on public.contribuyentes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users manage own productos" on public.productos for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users manage own clientes" on public.clientes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users manage own documentos" on public.documentos for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users manage own envios" on public.envios_correo for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users manage own contingencias" on public.contingencias for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users manage own respaldos" on public.respaldos for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('factusys-files', 'factusys-files', false)
on conflict (id) do nothing;

create policy "users access own factusys files"
on storage.objects for all
using (bucket_id = 'factusys-files' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'factusys-files' and (storage.foldername(name))[1] = auth.uid()::text);
