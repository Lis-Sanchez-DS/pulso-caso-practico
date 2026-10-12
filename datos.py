"""Carga y limpieza de los datos de Pulso (misma lógica que el cuaderno "Revisión inicial")."""
import unicodedata
from pathlib import Path

import pandas as pd

RUTA = Path(__file__).parent
FECHA_CORTE = pd.Timestamp("2026-09-30")
EDAD_MAXIMA = 100
SESIONES_MAXIMAS_30D = 100

CIUDADES_VALIDAS = {"bogota": "Bogotá", "medellin": "Medellín", "cali": "Cali",
                    "barranquilla": "Barranquilla", "bucaramanga": "Bucaramanga"}


def _clave_ciudad(texto):
    texto = unicodedata.normalize("NFKD", str(texto)).encode("ascii", "ignore").decode()
    return texto.lower().replace("d.c.", "").strip()


def _normalizar_estado(valor):
    valor = str(valor).strip().lower()
    if valor.startswith("activ"):
        return "Activo"
    if valor.startswith("cancel"):
        return "Cancelado"
    return None


def cargar_clientes() -> pd.DataFrame:
    df = pd.read_excel(RUTA / "Pulso_clientes.xlsx", sheet_name="clientes")
    df["nps_completo"] = df["nps"].notna().astype(int)
    df["fecha_registro"] = pd.to_datetime(df["fecha_registro"])

    # estado y ciudad
    df["estado"] = df["estado"].map(_normalizar_estado)
    ciudad_norm = df["ciudad"].map(lambda c: CIUDADES_VALIDAS.get(_clave_ciudad(c)))
    df["ciudad"] = ciudad_norm.fillna(df["ciudad"])

    # valores ilógicos -> nulos
    df.loc[df["edad"] > EDAD_MAXIMA, "edad"] = None
    df.loc[df["sesiones_ultimos_30d"] > SESIONES_MAXIMAS_30D, "sesiones_ultimos_30d"] = None

    # duplicados
    df = df.drop_duplicates(subset="id_cliente", keep="first").reset_index(drop=True)

    # activos con fecha de cancelación -> cancelados
    df.loc[(df["estado"] == "Activo") & df["fecha_cancelacion"].notna(), "estado"] = "Cancelado"
    df["estado_binario"] = (df["estado"] == "Cancelado").astype(int)

    # última sesión posterior al corte -> se limita al corte
    df.loc[df["fecha_ultima_sesion"] > FECHA_CORTE, "fecha_ultima_sesion"] = FECHA_CORTE

    # fecha de cancelación anterior al registro o a la última sesión:
    # última sesión + promedio de días entre última sesión y cancelación de los casos válidos
    invalidos = (df["fecha_cancelacion"] < df["fecha_registro"]) | (df["fecha_cancelacion"] < df["fecha_ultima_sesion"])
    validos = df["fecha_cancelacion"].notna() & ~invalidos
    prom = (df["fecha_cancelacion"] - df["fecha_ultima_sesion"])[validos].dt.days.groupby(df["estado"]).mean()
    dias = df.loc[invalidos, "estado"].map(prom).round().astype(int)
    df.loc[invalidos, "fecha_cancelacion"] = df.loc[invalidos, "fecha_ultima_sesion"] + pd.to_timedelta(dias, unit="D")

    # variables derivadas
    df["duración"] = df["fecha_cancelacion"] - df["fecha_registro"]
    df["duración_dias"] = df["duración"].dt.days
    df["inactividad_dias"] = (df["fecha_cancelacion"] - df["fecha_ultima_sesion"]).dt.days
    return df
