"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Cliente } from "@/lib/datos";
import { VARIABLES, pesos } from "@/lib/variables";

type Filtro = "Todos" | "Activo" | "Cancelado";
const FILTROS: Filtro[] = ["Todos", "Activo", "Cancelado"];
const COLORES: Record<Filtro, string> = { Todos: "#14161f", Activo: "#1f7a5c", Cancelado: "#d9341a" };

type Barra = { etiqueta: string; clientes: number; texto: string };

const fmt = (v: number) => v.toLocaleString("es-CO", { maximumFractionDigits: 1 });

function mediana(xs: number[]) {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export default function Explorador({ clientes }: { clientes: Cliente[] }) {
  const [clave, setClave] = useState("estado");
  const [filtro, setFiltro] = useState<Filtro>("Todos");

  const variable = VARIABLES.find((v) => v.clave === clave)!;
  const esPrecio = clave === "precio_mensual_cop";
  const formato = esPrecio ? pesos : fmt;

  const sub = useMemo(
    () => (filtro === "Todos" ? clientes : clientes.filter((c) => c.estado === filtro)),
    [clientes, filtro]
  );
  const valores = useMemo(
    () => sub.map(variable.valor).filter((v): v is string | number => v !== null && v !== undefined),
    [sub, variable]
  );

  // Barras del gráfico (las categorías / los intervalos se definen con todos los clientes para que el filtro sea comparable)
  const barras: Barra[] = useMemo(() => {
    const total = valores.length;
    const conTexto = (etiqueta: string, n: number): Barra => ({
      etiqueta,
      clientes: n,
      texto: `${n} (${total ? Math.round((n / total) * 100) : 0}%)`,
    });

    if (variable.tipo === "categórica") {
      const cuenta = new Map<string, number>();
      valores.forEach((v) => cuenta.set(String(v), (cuenta.get(String(v)) ?? 0) + 1));
      return [...cuenta.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => conTexto(k, n));
    }

    const todos = clientes.map(variable.valor).filter((v): v is number => typeof v === "number");
    const distintos = [...new Set(todos)].sort((a, b) => a - b);
    const nums = valores as number[];

    if (distintos.length <= 30) {
      // Pocos valores distintos: una barra por valor (se rellenan los enteros intermedios si el rango es corto)
      const entero = distintos.every(Number.isInteger);
      const rango = entero && distintos[distintos.length - 1] - distintos[0] <= 40
        ? Array.from({ length: distintos[distintos.length - 1] - distintos[0] + 1 }, (_, i) => distintos[0] + i)
        : distintos;
      return rango.map((x) => conTexto(esPrecio ? pesos(x) : String(x), nums.filter((v) => v === x).length));
    }

    const min = distintos[0];
    const max = distintos[distintos.length - 1];
    const k = 30;
    const ancho = (max - min) / k;
    const cuentas = new Array(k).fill(0);
    nums.forEach((v) => cuentas[Math.min(k - 1, Math.floor((v - min) / ancho))]++);
    return cuentas.map((n, i) =>
      conTexto(`${Math.round(min + i * ancho)}–${Math.round(min + (i + 1) * ancho)}`, n)
    );
  }, [valores, clientes, variable, esPrecio]);

  const nums = variable.tipo === "numérica" ? (valores as number[]) : [];
  const media = nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
  const desv =
    nums.length > 1 ? Math.sqrt(nums.reduce((a, b) => a + (b - media) ** 2, 0) / (nums.length - 1)) : null;

  return (
    <section>
      <div className="controles">
        <label className="campo">
          <span>Variable a explorar</span>
          <select value={clave} onChange={(e) => setClave(e.target.value)}>
            {VARIABLES.map((v) => (
              <option key={v.clave} value={v.clave}>
                {v.etiqueta}
              </option>
            ))}
          </select>
        </label>
        <div className="campo">
          <span>Filtrar por estado</span>
          <div className="segmentos" role="group" aria-label="Filtrar por estado">
            {FILTROS.map((f) => (
              <button key={f} type="button" aria-pressed={filtro === f} onClick={() => setFiltro(f)}>
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="metricas">
        <div className="metrica"><span>Clientes en la selección</span><strong>{sub.length}</strong></div>
        <div className="metrica"><span>Con dato en esta variable</span><strong>{valores.length}</strong></div>
        <div className="metrica">
          <span>% del total de clientes</span>
          <strong>{Math.round((sub.length / clientes.length) * 100)}%</strong>
        </div>
      </div>

      <h2>Distribución de: {variable.etiqueta}</h2>
      <p className="nota">Filtro: <strong>{filtro}</strong></p>

      {valores.length === 0 ? (
        <p className="aviso">
          No hay datos de esta variable para el filtro seleccionado. Por ejemplo, la duración y la inactividad
          solo existen para clientes que cancelaron.
        </p>
      ) : (
        <div className="grafico">
          <ResponsiveContainer width="100%" height={440}>
            <BarChart data={barras} margin={{ top: 24, right: 16, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="etiqueta"
                interval={0}
                angle={esPrecio || barras.length > 8 ? -45 : 0}
                textAnchor={esPrecio || barras.length > 8 ? "end" : "middle"}
                height={esPrecio || barras.length > 8 ? 96 : 56}
                label={{ value: variable.etiqueta, position: "insideBottom", offset: 0 }}
              />
              <YAxis allowDecimals={false} label={{ value: "Número de clientes", angle: -90, position: "insideLeft" }} />
              <Tooltip formatter={(v) => [`${v} clientes`, "Cantidad"]} />
              <Bar dataKey="clientes" fill={COLORES[filtro]} radius={[3, 3, 0, 0]} isAnimationActive={false}>
                {variable.tipo === "categórica" || barras.length <= 12 ? (
                  <LabelList dataKey="texto" position="top" fontSize={12} />
                ) : null}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {nums.length > 0 && (
        <>
          <h3>Estadísticas descriptivas</h3>
          <table className="tabla">
            <tbody>
              {[
                ["Clientes", String(nums.length)],
                ["Promedio", formato(media)],
                ["Mediana", formato(mediana(nums))],
                ["Mínimo", formato(Math.min(...nums))],
                ["Máximo", formato(Math.max(...nums))],
                ["Desviación estándar", desv === null ? "—" : formato(desv)],
              ].map(([k, v]) => (
                <tr key={k}><th>{k}</th><td>{v}</td></tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </section>
  );
}
