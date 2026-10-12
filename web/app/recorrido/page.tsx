import { Suspense } from "react";
import { obtenerClientes, obtenerComentarios } from "@/lib/datos";
import { construirRecorrido, type Paso } from "@/lib/recorrido";
import Recorrido from "./Recorrido";

async function Datos() {
  let pasos: Paso[] | null = null;
  let error = "";
  try {
    const [clientes, comentarios] = await Promise.all([obtenerClientes(), obtenerComentarios()]);
    pasos = construirRecorrido(clientes, comentarios);
  } catch (e) {
    error = e instanceof Error ? e.message : "error desconocido";
  }
  if (!pasos) {
    return <p className="aviso">No se pudieron cargar los datos desde Supabase: {error}</p>;
  }
  return <Recorrido pasos={pasos} />;
}

export default function Page() {
  return (
    <main className="contenedor">
      <p className="kicker">Recorrido del cliente</p>
      <h1>¿Dónde se rompe la relación?</h1>
      <p className="intro">
        Las etapas por las que pasa un cliente de Pulso, desde que considera unirse hasta que decide irse.
        Selecciona una etapa para ver qué está pasando, qué funciona, qué falla y la evidencia en los datos.
      </p>
      <Suspense fallback={<p className="aviso">Cargando recorrido…</p>}>
        <Datos />
      </Suspense>
    </main>
  );
}
