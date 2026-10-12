"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Comentario } from "@/lib/datos";

type Sentimiento = "Positivo" | "Negativo";
const SENTIMIENTOS: Sentimiento[] = ["Positivo", "Negativo"];
const COLORES: Record<Sentimiento, string> = { Positivo: "#1f7a5c", Negativo: "#d9341a" };
const POR_PAGINA = 4;

const estrellas = (n: number | null) => (n === null ? null : "★".repeat(n) + "☆".repeat(5 - n));
const fechaLarga = (f: string) =>
  new Date(f + "T00:00:00").toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });

export default function ExploradorComentarios({ comentarios }: { comentarios: Comentario[] }) {
  // Solo comentarios con sentimiento definido (se excluyen spam o comentarios no relacionados)
  const validos = useMemo(
    () => comentarios.filter((c): c is Comentario & { sentimiento: Sentimiento } => c.sentimiento !== "No aplica"),
    [comentarios]
  );

  const [sentimiento, setSentimiento] = useState<Sentimiento>("Negativo");
  const [subcategoria, setSubcategoria] = useState("Todas");
  const [visibles, setVisibles] = useState(POR_PAGINA);

  // Datos del gráfico: una fila por subcategoría con el conteo de cada sentimiento
  const grafico = useMemo(() => {
    const mapa = new Map<string, { subcategoria: string; Positivo: number; Negativo: number; total: number }>();
    validos.forEach((c) => {
      const f = mapa.get(c.subcategoria) ?? { subcategoria: c.subcategoria, Positivo: 0, Negativo: 0, total: 0 };
      f[c.sentimiento]++;
      f.total++;
      mapa.set(c.subcategoria, f);
    });
    return [...mapa.values()].sort((a, b) => b.total - a.total);
  }, [validos]);

  const totales = { Positivo: 0, Negativo: 0 };
  validos.forEach((c) => totales[c.sentimiento]++);

  // Subcategorías disponibles para el sentimiento elegido (con su número de comentarios)
  const opciones = useMemo(
    () =>
      grafico
        .filter((f) => f[sentimiento] > 0)
        .map((f) => ({ nombre: f.subcategoria, n: f[sentimiento] }))
        .sort((a, b) => b.n - a.n),
    [grafico, sentimiento]
  );

  // Comentarios a mostrar (los textos idénticos se agrupan)
  const lista = useMemo(() => {
    const filtrados = validos.filter(
      (c) => c.sentimiento === sentimiento && (subcategoria === "Todas" || c.subcategoria === subcategoria)
    );
    const grupos = new Map<string, { c: Comentario; veces: number }>();
    filtrados.forEach((c) => {
      const g = grupos.get(c.comentario);
      if (g) g.veces++;
      else grupos.set(c.comentario, { c, veces: 1 });
    });
    return [...grupos.values()];
  }, [validos, sentimiento, subcategoria]);

  const cambiarSentimiento = (s: Sentimiento) => {
    setSentimiento(s);
    setSubcategoria("Todas");
    setVisibles(POR_PAGINA);
  };

  return (
    <section>
      <div className="metricas">
        <div className="metrica"><span>Comentarios analizados</span><strong>{validos.length}</strong></div>
        <div className="metrica">
          <span>Negativos</span>
          <strong style={{ color: COLORES.Negativo }}>
            {totales.Negativo} ({Math.round((totales.Negativo / validos.length) * 100)}%)
          </strong>
        </div>
        <div className="metrica">
          <span>Positivos</span>
          <strong style={{ color: COLORES.Positivo }}>
            {totales.Positivo} ({Math.round((totales.Positivo / validos.length) * 100)}%)
          </strong>
        </div>
      </div>

      <h2>Sentimiento por subcategoría</h2>
      <p className="nota">Número de comentarios positivos y negativos en cada tema.</p>
      <div className="grafico">
        <ResponsiveContainer width="100%" height={Math.max(320, grafico.length * 44 + 80)}>
          <BarChart data={grafico} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 24 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis
              type="number"
              allowDecimals={false}
              label={{ value: "Número de comentarios", position: "insideBottom", offset: -10 }}
            />
            <YAxis type="category" dataKey="subcategoria" width={190} tick={{ fontSize: 13 }} />
            <Tooltip formatter={(v, nombre) => [`${v} comentarios`, String(nombre)]} />
            <Legend verticalAlign="top" height={32} />
            {SENTIMIENTOS.map((s) => (
              <Bar key={s} dataKey={s} stackId="a" fill={COLORES[s]} isAnimationActive={false}>
                <LabelList
                  dataKey={s}
                  fill="#fff"
                  fontSize={12}
                  fontWeight={700}
                  formatter={(v: unknown) => (Number(v) > 0 ? String(v) : "")}
                />
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <h2>Lee los comentarios</h2>
      <div className="controles">
        <label className="campo">
          <span>Sentimiento</span>
          <select value={sentimiento} onChange={(e) => cambiarSentimiento(e.target.value as Sentimiento)}>
            {SENTIMIENTOS.map((s) => (
              <option key={s} value={s}>{s} ({totales[s]})</option>
            ))}
          </select>
        </label>
        <label className="campo">
          <span>Subcategoría</span>
          <select
            value={subcategoria}
            onChange={(e) => {
              setSubcategoria(e.target.value);
              setVisibles(POR_PAGINA);
            }}
          >
            <option value="Todas">Todas ({totales[sentimiento]})</option>
            {opciones.map((o) => (
              <option key={o.nombre} value={o.nombre}>{o.nombre} ({o.n})</option>
            ))}
          </select>
        </label>
      </div>

      <ul className="comentarios">
        {lista.slice(0, visibles).map(({ c, veces }) => (
          <li key={c.id_comentario} className="comentario" style={{ borderLeftColor: COLORES[sentimiento] }}>
            <p>“{c.comentario}”</p>
            <div className="meta">
              <span>{c.canal}</span>
              <span>{fechaLarga(c.fecha)}</span>
              {c.calificacion !== null && <span title={`${c.calificacion} de 5`}>{estrellas(c.calificacion)}</span>}
              {c.id_cliente && <span>Cliente {c.id_cliente}</span>}
              {subcategoria === "Todas" && <span className="etiqueta">{c.subcategoria}</span>}
              {veces > 1 && <span className="etiqueta">Repetido ×{veces}</span>}
            </div>
          </li>
        ))}
      </ul>
      {lista.length > visibles && (
        <button type="button" className="boton" onClick={() => setVisibles((v) => v + POR_PAGINA)}>
          Ver más ({lista.length - visibles} restantes)
        </button>
      )}
    </section>
  );
}
