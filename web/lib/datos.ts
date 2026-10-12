import { cacheLife } from "next/cache";
import { crearClienteSupabase } from "./supabase";

export type Cliente = {
  id_cliente: string;
  ciudad: string;
  edad: number | null;
  plan: string;
  canal_adquisicion: string;
  precio_mensual_cop: number;
  dispositivo: string;
  completo_onboarding: string;
  sesiones_primer_mes: number;
  sesiones_ultimos_30d: number | null;
  tickets_soporte: number;
  nps_completo: boolean;
  estado: "Activo" | "Cancelado";
  fecha_ultima_sesion: string;
  fecha_cancelacion: string | null;
  duracion_dias: number | null;
  inactividad_dias: number | null;
};

const COLUMNAS =
  "id_cliente, ciudad, edad, plan, canal_adquisicion, precio_mensual_cop, dispositivo, completo_onboarding, " +
  "sesiones_primer_mes, sesiones_ultimos_30d, tickets_soporte, nps_completo, estado, fecha_ultima_sesion, fecha_cancelacion, duracion_dias, inactividad_dias";

// Los datos cambian muy poco: se guardan en caché una hora.
export async function obtenerClientes(): Promise<Cliente[]> {
  "use cache";
  cacheLife("hours");

  const { data, error } = await crearClienteSupabase()
    .from("clientes")
    .select(COLUMNAS)
    .order("id_cliente")
    .range(0, 4999);
  if (error) throw new Error(error.message);
  return data as unknown as Cliente[];
}

export type Comentario = {
  id_comentario: string;
  fecha: string;
  id_cliente: string | null;
  canal: string;
  calificacion: number | null;
  comentario: string;
  sentimiento: "Positivo" | "Negativo" | "No aplica";
  subcategoria: string;
};

export async function obtenerComentarios(): Promise<Comentario[]> {
  "use cache";
  cacheLife("hours");

  const { data, error } = await crearClienteSupabase()
    .from("comentarios")
    .select("id_comentario, fecha, id_cliente, canal, calificacion, comentario, sentimiento, subcategoria")
    .order("id_comentario")
    .range(0, 4999);
  if (error) throw new Error(error.message);
  return data as unknown as Comentario[];
}
