import { Suspense } from "react";
import { obtenerComentarios, type Comentario } from "@/lib/datos";
import ExploradorComentarios from "./ExploradorComentarios";

async function Datos() {
  let comentarios: Comentario[] | null = null;
  let error = "";
  try {
    comentarios = await obtenerComentarios();
  } catch (e) {
    error = e instanceof Error ? e.message : "error desconocido";
  }
  if (!comentarios) {
    return <p className="aviso">No se pudieron cargar los comentarios desde Supabase: {error}</p>;
  }
  return <ExploradorComentarios comentarios={comentarios} />;
}

export default function Page() {
  return (
    <main className="contenedor">
      <p className="kicker">Voz del cliente</p>
      <h1>Lo que dicen los clientes</h1>
      <p className="intro">
        Resumen de los comentarios de tiendas de aplicaciones, chat de soporte, encuesta de cancelación y redes
        sociales. Cada comentario fue clasificado como positivo o negativo y asignado a un tema (subcategoría).
      </p>
      <Suspense fallback={<p className="aviso">Cargando comentarios…</p>}>
        <Datos />
      </Suspense>
    </main>
  );
}
