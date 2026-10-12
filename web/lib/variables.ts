import type { Cliente } from "./datos";

export type Variable = {
  clave: string;
  etiqueta: string;
  tipo: "categórica" | "numérica";
  valor: (c: Cliente) => string | number | null;
};

export const VARIABLES: Variable[] = [
  { clave: "estado", etiqueta: "Estado de la suscripción", tipo: "categórica", valor: (c) => c.estado },
  { clave: "ciudad", etiqueta: "Ciudad", tipo: "categórica", valor: (c) => c.ciudad },
  { clave: "plan", etiqueta: "Plan", tipo: "categórica", valor: (c) => c.plan },
  { clave: "canal_adquisicion", etiqueta: "Canal de adquisición", tipo: "categórica", valor: (c) => c.canal_adquisicion },
  { clave: "dispositivo", etiqueta: "Dispositivo", tipo: "categórica", valor: (c) => c.dispositivo },
  { clave: "completo_onboarding", etiqueta: "Completó el onboarding", tipo: "categórica", valor: (c) => c.completo_onboarding },
  { clave: "nps_completo", etiqueta: "Respondió el NPS", tipo: "categórica", valor: (c) => (c.nps_completo ? "Sí" : "No") },
  { clave: "edad", etiqueta: "Edad (años)", tipo: "numérica", valor: (c) => c.edad },
  { clave: "precio_mensual_cop", etiqueta: "Precio mensual (COP)", tipo: "numérica", valor: (c) => c.precio_mensual_cop },
  { clave: "sesiones_primer_mes", etiqueta: "Sesiones en el primer mes", tipo: "numérica", valor: (c) => c.sesiones_primer_mes },
  { clave: "sesiones_ultimos_30d", etiqueta: "Sesiones en los últimos 30 días", tipo: "numérica", valor: (c) => c.sesiones_ultimos_30d },
  { clave: "tickets_soporte", etiqueta: "Tickets de soporte", tipo: "numérica", valor: (c) => c.tickets_soporte },
  { clave: "duracion_dias", etiqueta: "Duración (días entre registro y cancelación)", tipo: "numérica", valor: (c) => c.duracion_dias },
  { clave: "inactividad_dias", etiqueta: "Inactividad (días entre última sesión y cancelación)", tipo: "numérica", valor: (c) => c.inactividad_dias },
];

export const pesos = (v: number) => "$" + Math.round(v).toLocaleString("es-CO");
