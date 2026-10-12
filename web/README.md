# Pulso: ¿por qué se van los clientes? (Next.js + Supabase)

Página web en español para explorar la distribución de las variables de los clientes de Pulso,
con filtro por estado (Todos / Activo / Cancelado). Los datos viven en Supabase y la web se despliega en Vercel.

## 1. Preparar Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. En **SQL Editor** ejecuta, en este orden, `../supabase/schema.sql` y `../supabase/seed.sql`.
   (El seed se regenera con `python generar_seed.py` desde la carpeta raíz si cambia la limpieza de datos.)
3. En **Project Settings > API** copia la *Project URL* y la llave *publishable* (o *anon*).

## 2. Probar en local

```bash
cp .env.example .env.local   # completa la URL y la llave anon
npm install
npm run dev                  # http://localhost:3000
```

## 3. Desplegar en Vercel

1. Importa el repositorio en Vercel y define **Root Directory = `web`**.
2. Agrega las variables de entorno `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
3. Despliega. Los datos se guardan en caché una hora (`lib/datos.ts`).

Seguridad: las tablas tienen RLS activado y solo permiten `SELECT` al rol `anon`; la llave anon es pública por diseño.
Nunca uses la llave `service_role` en esta app.
