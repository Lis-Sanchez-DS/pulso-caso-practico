import type { Comentario } from "@/lib/datos";
import type { PlanDeAccion } from "@/lib/acciones";

function Citas({ comentarios }: { comentarios: Comentario[] }) {
  return (
    <ul className="comentarios">
      {comentarios.map((c) => (
        <li
          key={c.id_comentario}
          className="comentario"
          style={{ borderLeftColor: c.sentimiento === "Positivo" ? "#1f7a5c" : "#d9341a" }}
        >
          <p>“{c.comentario}”</p>
          <div className="meta">
            <span className="etiqueta">{c.sentimiento}</span>
            <span>{c.canal}</span>
            {c.calificacion !== null && (
              <span title={`${c.calificacion} de 5`}>{"★".repeat(c.calificacion) + "☆".repeat(5 - c.calificacion)}</span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

function Tarjeta({ a, numero }: { a: PlanDeAccion["acciones"][number]; numero: number }) {
  return (
    <li className={`accion${a.complementaria ? " suplementaria" : ""}`}>
      <header>
        <span className="numero">{numero}</span>
        <div>
          <p className={`prioridad${a.complementaria ? " comp" : ""}`}>
            {a.complementaria ? "Complementaria" : `Prioridad ${a.prioridad}`}
          </p>
          <h2>{a.titulo}</h2>
          <p className="propuesta">{a.propuesta}</p>
          <p className="motivo">
            <strong>Por qué esta prioridad:</strong> {a.motivo}
          </p>
        </div>
      </header>

      <div className="accion-cuerpo">
        <div className="bloque">
          <h3>Cómo se mediría</h3>
          <p>{a.medicion}</p>
          <div className="bases">
            {a.linea_base.map((b) => (
              <div key={b.texto} className="base">
                <strong>{b.valor}</strong>
                <span>{b.texto}</span>
              </div>
            ))}
          </div>
          <p className="nota">Punto de partida actual de la métrica.</p>
        </div>

        <div className="bloque">
          <h3>Dato que lo respalda</h3>
          <div className="evidencia bien">
            <strong>{a.dato.valor}</strong>
            <span>{a.dato.texto}</span>
          </div>
          {a.impacto && (
            <div className="impacto">
              <strong>{a.impacto.valor}</strong>
              <span>{a.impacto.texto}</span>
            </div>
          )}
          {a.nota && <p className="nota">{a.nota}</p>}
        </div>
      </div>

      <h3>Meta basada en datos reales</h3>
      <div className="meta-tabla" role="table" aria-label={`Metas de ${a.titulo}`}>
        <div className="meta-fila meta-cabecera" role="row">
          <span role="columnheader">Métrica</span>
          <span role="columnheader">Hoy</span>
          <span role="columnheader">Meta intermedia</span>
          <span role="columnheader">Meta final</span>
        </div>
        {a.meta.filas.map((f) => (
          <div key={f.metrica} className="meta-fila" role="row">
            <span role="cell" className="meta-nombre">{f.metrica}</span>
            <span role="cell" data-etiqueta="Hoy">{f.hoy}</span>
            <span role="cell" data-etiqueta="Meta intermedia">{f.intermedia ?? "—"}</span>
            <span role="cell" data-etiqueta="Meta final" className="meta-final">{f.final}</span>
          </div>
        ))}
      </div>
      <p className="nota">{a.meta.origen}</p>

      {a.comentarios.length > 0 && (
        <>
          <h3>Lo que dicen los clientes</h3>
          <Citas comentarios={a.comentarios} />
        </>
      )}
    </li>
  );
}

export default function Plan({ plan }: { plan: PlanDeAccion }) {
  const prioritarias = plan.acciones.filter((a) => !a.complementaria);
  const complementarias = plan.acciones.filter((a) => a.complementaria);
  return (
    <section>
      <div className="norte">
        <div>
          <p className="norte-etiqueta">La métrica más importante</p>
          <p className="norte-titulo">Que disminuya la cantidad de personas que cancelan</p>
          <p className="norte-detalle">{plan.norte.detalle}</p>
        </div>
        <div className="norte-cifra">
          <strong>{plan.norte.valor}</strong>
          <span>{plan.norte.texto}</span>
        </div>
      </div>

      <div className="metodo">
        <h2>{plan.metodo.titulo}</h2>
        <ol>
          {plan.metodo.pasos.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ol>
      </div>

      <h2 className="grupo">Acciones prioritarias</h2>
      <ol className="acciones">
        {prioritarias.map((a, i) => (
          <Tarjeta key={a.clave} a={a} numero={i + 1} />
        ))}
      </ol>

      <h2 className="grupo">Acciones complementarias</h2>
      <ol className="acciones">
        {complementarias.map((a, i) => (
          <Tarjeta key={a.clave} a={a} numero={prioritarias.length + i + 1} />
        ))}
      </ol>

      <article className="accion complemento">
        <header>
          <span className="numero">+</span>
          <div>
            <h2>Complemento: un LLM que clasifique los comentarios</h2>
            <p className="propuesta">{plan.llm.propuesta}</p>
          </div>
        </header>
        <div className="bases">
          {plan.llm.datos.map((d) => (
            <div key={d.texto} className="base">
              <strong>{d.valor}</strong>
              <span>{d.texto}</span>
            </div>
          ))}
        </div>
        {plan.llm.comentarios.length > 0 && (
          <>
            <h3>Un ejemplo de por qué hace falta</h3>
            <Citas comentarios={plan.llm.comentarios} />
          </>
        )}
      </article>
    </section>
  );
}
