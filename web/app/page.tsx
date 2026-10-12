import { Suspense } from "react";
import { obtenerClientes, type Cliente } from "@/lib/datos";
import Explorador from "./Explorador";

async function Datos() {
  let clientes: Cliente[] | null = null;
  let error = "";
  try {
    clientes = await obtenerClientes();
  } catch (e) {
    error = e instanceof Error ? e.message : "error desconocido";
  }
  if (!clientes) {
    return <p className="aviso">No se pudieron cargar los datos desde Supabase: {error}</p>;
  }
  return <Explorador clientes={clientes} />;
}

export default function Page() {
  return (
    <main className="contenedor">
      <p className="kicker">Exploración de datos</p>
      <h1>¿Por qué se van los clientes de Pulso?</h1>
      <p className="intro">
        Caso práctico de Keyrus. <strong>Pulso</strong> es una app colombiana de entrenamiento en casa por
        suscripción y cada mes cancelan más clientes. Esta página es el punto de partida: explora cómo se
        distribuye cada variable de los clientes y compara a quienes siguen <strong>activos</strong> con
        quienes <strong>cancelaron</strong>.
      </p>
      <Suspense fallback={<p className="aviso">Cargando datos…</p>}>
        <Datos />
      </Suspense>
    </main>
  );
}
