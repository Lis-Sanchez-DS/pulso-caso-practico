import { Suspense } from "react";
import { obtenerClientes, obtenerComentarios } from "@/lib/datos";
import { construirPlan, type PlanDeAccion } from "@/lib/acciones";
import Plan from "./Plan";

async function Datos() {
  let plan: PlanDeAccion | null = null;
  let error = "";
  try {
    const [clientes, comentarios] = await Promise.all([obtenerClientes(), obtenerComentarios()]);
    plan = construirPlan(clientes, comentarios);
  } catch (e) {
    error = e instanceof Error ? e.message : "error desconocido";
  }
  if (!plan) {
    return <p className="aviso">No se pudieron cargar los datos desde Supabase: {error}</p>;
  }
  return <Plan plan={plan} />;
}

export default function Page() {
  return (
    <main className="contenedor">
      <p className="kicker">Plan de acción</p>
      <h1>¿Qué hacemos para retenerlos?</h1>
      <p className="intro">
        Las acciones propuestas para reducir las cancelaciones, cómo se mediría si funcionan y el dato y el
        comentario de clientes que respaldan cada una.
      </p>
      <Suspense fallback={<p className="aviso">Cargando plan de acción…</p>}>
        <Datos />
      </Suspense>
    </main>
  );
}
