"use client";

import Image from "next/image";
import { useState } from "react";
import type { Paso } from "@/lib/recorrido";

const POR_DEFECTO = 3;
const COLORES = { Positivo: "#1f7a5c", Negativo: "#d9341a" } as const;

// Ilustración de cada etapa (archivos en /public/recorrido) y su texto alternativo
const IMAGENES: Record<string, string> = {
  adquisicion: "Un teléfono mostrando los planes Promo, Anual y Mensual, con la duda de qué pasa después de 3 meses",
  onboarding: "Un teléfono con una lista de pasos iniciales y una persona preguntando por dónde empezar",
  nurturing: "Un teléfono con una clase en video y una racha semanal, junto a una alerta de que la app se cerró en Android",
  cancelacion: "Un teléfono con el botón de pausar no disponible y el de cancelar activo",
};

export default function Recorrido({ pasos }: { pasos: Paso[] }) {
  const [activo, setActivo] = useState(0);
  const [verMas, setVerMas] = useState(false);
  const paso = pasos[activo];
  const elegir = (i: number) => {
    setActivo(i);
    setVerMas(false);
  };
  const mostrados = verMas ? paso.comentarios : paso.comentarios.slice(0, POR_DEFECTO);
  const imagen = (clave: string, ancho: number, clase: string) => (
    <Image
      src={`/recorrido/${clave}.svg`}
      alt={IMAGENES[clave] ?? ""}
      width={ancho}
      height={Math.round(ancho * (2 / 3))}
      className={clase}
      unoptimized
    />
  );

  return (
    <section>
      <ol className="linea" aria-label="Etapas del recorrido del cliente">
        {pasos.map((p, i) => (
          <li key={p.clave} className={i < activo ? "hecho" : undefined}>
            <button
              type="button"
              className="nodo"
              aria-pressed={i === activo}
              aria-label={`Etapa ${i + 1}: ${p.titulo}`}
              onClick={() => elegir(i)}
              onFocus={() => elegir(i)}
            >
              <span className="punto">{i + 1}</span>
              {imagen(p.clave, 180, "miniatura")}
              <span className="nombre">{p.titulo}</span>
            </button>
          </li>
        ))}
      </ol>

      <article className="detalle" aria-live="polite">
        <header>
          <div>
            <p className="etapa">Etapa {activo + 1} de {pasos.length}</p>
            <h2>{paso.titulo}</h2>
            <p className="momento">{paso.momento}</p>
          </div>
          {imagen(paso.clave, 360, "ilustracion")}
        </header>

        <div className="balance">
          {paso.bien.length > 0 && (
            <div className="bien">
              <h3>Lo que va bien</h3>
              <ul>{paso.bien.map((t) => <li key={t}>{t}</li>)}</ul>
            </div>
          )}
          <div className="mal">
            <h3>Lo que va mal</h3>
            <ul>{paso.mal.map((t) => <li key={t}>{t}</li>)}</ul>
          </div>
        </div>

        <h3>Evidencia en los datos</h3>
        <p className="leyenda">
          <span className="ley bien">Respalda lo que va bien</span>
          <span className="ley mal">Respalda lo que va mal</span>
          <span className="ley neutro">Contexto</span>
        </p>
        <div className="evidencias">
          {paso.evidencia.map((e) => (
            <div key={e.texto} className={`evidencia ${e.apoya}`}>
              <strong>{e.valor}</strong>
              <span>{e.texto}</span>
            </div>
          ))}
        </div>
        {paso.nota && <p className="nota">{paso.nota}</p>}

        {paso.comentarios.length > 0 && (
          <>
            <h3>Lo que dicen los clientes</h3>
            <ul className="comentarios">
              {mostrados.map((c) => (
                <li key={c.id_comentario} className="comentario" style={{ borderLeftColor: COLORES[c.sentimiento as "Positivo" | "Negativo"] }}>
                  <p>“{c.comentario}”</p>
                  <div className="meta">
                    <span className="etiqueta">{c.sentimiento}</span>
                    <span>{c.canal}</span>
                    {c.calificacion !== null && <span title={`${c.calificacion} de 5`}>{"★".repeat(c.calificacion) + "☆".repeat(5 - c.calificacion)}</span>}
                  </div>
                </li>
              ))}
            </ul>
            {paso.comentarios.length > POR_DEFECTO && (
              <button type="button" className="boton" onClick={() => setVerMas(!verMas)}>
                {verMas ? "Ver menos" : `Ver más (${paso.comentarios.length - POR_DEFECTO} restantes)`}
              </button>
            )}
          </>
        )}
      </article>

      <div className="navegar">
        <button type="button" className="boton" disabled={activo === 0} onClick={() => elegir(activo - 1)}>
          ← Etapa anterior
        </button>
        <button type="button" className="boton" disabled={activo === pasos.length - 1} onClick={() => elegir(activo + 1)}>
          Etapa siguiente →
        </button>
      </div>
    </section>
  );
}
