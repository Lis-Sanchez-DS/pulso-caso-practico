"""Genera supabase/seed.sql con los datos ya limpios (clientes) y los comentarios clasificados."""
import pandas as pd

from datos import RUTA, cargar_clientes


def sql(v):
    if pd.isna(v):
        return "null"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, pd.Timestamp):
        return f"'{v.date()}'"
    if isinstance(v, (int, float)) or hasattr(v, "item"):
        v = v.item() if hasattr(v, "item") else v
        return str(int(v)) if float(v).is_integer() else str(v)
    return "'" + str(v).replace("'", "''") + "'"


def insertar(tabla, df, cols):
    filas = ",\n".join("  (" + ", ".join(sql(r[c]) for c in cols) + ")" for _, r in df.iterrows())
    return f"insert into public.{tabla} ({', '.join(cols)}) values\n{filas}\non conflict do nothing;\n"


cli = cargar_clientes()
cli = cli.rename(columns={"duración_dias": "duracion_dias"})
cli["nps_completo"] = cli["nps_completo"].astype(bool)
cols_cli = ["id_cliente", "fecha_registro", "ciudad", "edad", "plan", "canal_adquisicion", "precio_mensual_cop",
            "dispositivo", "completo_onboarding", "sesiones_primer_mes", "sesiones_ultimos_30d",
            "fecha_ultima_sesion", "tickets_soporte", "nps", "nps_completo", "estado", "fecha_cancelacion",
            "duracion_dias", "inactividad_dias"]

com = pd.read_excel(RUTA / "Pulso_comentarios.xlsx", sheet_name="comentarios")
cols_com = ["id_comentario", "fecha", "id_cliente", "canal", "calificacion", "comentario", "sentimiento", "subcategoria"]

salida = ("-- Datos de Pulso (generado con generar_seed.py). Ejecutar después de schema.sql.\n"
          "truncate public.clientes, public.comentarios;\n\n"
          + insertar("clientes", cli, cols_cli) + "\n" + insertar("comentarios", com, cols_com))
(RUTA / "supabase" / "seed.sql").write_text(salida, encoding="utf-8")
print(f"clientes: {len(cli)} filas · comentarios: {len(com)} filas -> supabase/seed.sql")
