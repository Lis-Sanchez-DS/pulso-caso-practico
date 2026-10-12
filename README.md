# Pulso: ¿por qué se van los clientes?

Caso práctico de Keyrus. Análisis de la base de clientes y los comentarios de **Pulso** (empresa ficticia) y
una página web con las conclusiones.

**Página publicada:** https://pulso-clientes.vercel.app

## Contenido

| Ruta | Qué es |
|---|---|
| `Revisión inicial.ipynb` | Cuaderno con la revisión, limpieza y gráficas de los datos |
| `Pulso_clientes.xlsx`, `Pulso_comentarios.xlsx` | Datos del caso (los comentarios incluyen las columnas `sentimiento` y `subcategoria`) |
| `datos.py` | Limpieza de los datos de clientes (misma lógica que el cuaderno) |
| `generar_seed.py` | Genera `supabase/seed.sql` con los datos ya limpios |
| `supabase/` | Esquema (`schema.sql`) y datos (`seed.sql`) para la base de datos en Supabase |
| `web/` | Página web (Next.js): exploración de clientes, comentarios, recorrido del cliente, plan de acción y uso de IA |

## Cuaderno

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
jupyter lab "Revisión inicial.ipynb"
```

## Página web

Las instrucciones para ejecutarla en local y publicarla (Supabase + Vercel) están en [`web/README.md`](web/README.md).
Las llaves de Supabase no se incluyen en el repositorio: se configuran en `web/.env.local` (ver `web/.env.example`).
