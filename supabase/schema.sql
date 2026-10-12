-- Esquema de Pulso para Supabase (Postgres). Ejecutar primero en el SQL Editor.

create table if not exists public.clientes (
  id_cliente            text primary key,
  fecha_registro        date not null,
  ciudad                text not null,
  edad                  integer,
  plan                  text not null,
  canal_adquisicion     text not null,
  precio_mensual_cop    integer not null,
  dispositivo           text not null,
  completo_onboarding   text not null,
  sesiones_primer_mes   integer not null,
  sesiones_ultimos_30d  integer,
  fecha_ultima_sesion   date not null,
  tickets_soporte       integer not null,
  nps                   numeric,
  nps_completo          boolean not null,
  estado                text not null check (estado in ('Activo', 'Cancelado')),
  fecha_cancelacion     date,
  duracion_dias         integer,
  inactividad_dias      integer
);

create table if not exists public.comentarios (
  id_comentario  text primary key,
  fecha          date not null,
  id_cliente     text,
  canal          text not null,
  calificacion   integer,
  comentario     text not null,
  sentimiento    text not null check (sentimiento in ('Positivo', 'Negativo', 'No aplica')),
  subcategoria   text not null
);

-- Los datos son de solo lectura para la web: se habilita RLS y solo se permite SELECT.
alter table public.clientes    enable row level security;
alter table public.comentarios enable row level security;

drop policy if exists "lectura publica clientes"    on public.clientes;
drop policy if exists "lectura publica comentarios" on public.comentarios;
create policy "lectura publica clientes"    on public.clientes    for select to anon using (true);
create policy "lectura publica comentarios" on public.comentarios for select to anon using (true);
