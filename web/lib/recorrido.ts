import type { Cliente, Comentario } from "./datos";

// apoya: "bien" respalda lo que va bien (borde verde), "mal" respalda lo que va mal (borde rojo)
export type Evidencia = { valor: string; texto: string; apoya: "bien" | "mal" | "neutro" };

export type Paso = {
  clave: string;
  titulo: string;
  momento: string; // qué está pasando en esta etapa
  bien: string[];
  mal: string[];
  evidencia: Evidencia[];
  comentarios: Comentario[]; // comentarios de clientes relevantes para la etapa
  nota?: string;
  sugerido?: boolean;
};

const pct = (n: number, d: number) => (d ? `${Math.round((n / d) * 100)}%` : "—");
const tasa = (xs: Cliente[]) => (xs.length ? xs.filter((c) => c.estado === "Cancelado").length / xs.length : 0);
const pctTasa = (xs: Cliente[]) => `${Math.round(tasa(xs) * 100)}%`;

export function construirRecorrido(clientes: Cliente[], comentarios: Comentario[]): Paso[] {
  const total = clientes.length;
  const cancelados = clientes.filter((c) => c.estado === "Cancelado");

  // Adquisición
  const anual = clientes.filter((c) => c.plan === "Anual");
  const mensual = clientes.filter((c) => c.plan === "Mensual");
  const promo = clientes.filter((c) => c.canal_adquisicion === "Promo 3 meses");
  const otrosCanales = clientes.filter((c) => c.canal_adquisicion !== "Promo 3 meses");
  const promoCancelados = promo.filter((c) => c.estado === "Cancelado" && c.duracion_dias !== null);
  const promoTrasDia90 = promoCancelados.filter((c) => (c.duracion_dias ?? 0) > 90).length;

  // Onboarding
  const conOnb = clientes.filter((c) => c.completo_onboarding === "Sí");
  const sinOnb = clientes.filter((c) => c.completo_onboarding === "No");

  // Nurturing
  const android = clientes.filter((c) => c.dispositivo === "Android");
  const ios = clientes.filter((c) => c.dispositivo === "iOS");
  const julio = (so: string) =>
    cancelados.filter((c) => c.dispositivo === so && c.fecha_cancelacion?.startsWith("2026-07")).length;
  const pocas = clientes.filter((c) => c.sesiones_primer_mes <= 5);
  const muchas = clientes.filter((c) => c.sesiones_primer_mes > 5);

  // Cancelación
  const inact = cancelados.map((c) => c.inactividad_dias).filter((v): v is number => v !== null);
  const inactProm = inact.length ? inact.reduce((a, b) => a + b, 0) / inact.length : 0;

  // Comentarios
  const validos = comentarios.filter((c) => c.sentimiento !== "No aplica");
  const cuenta = (sub: string, sent?: string) =>
    validos.filter((c) => c.subcategoria === sub && (!sent || c.sentimiento === sent)).length;
  const positivos = validos.filter((c) => c.sentimiento === "Positivo");
  const posContenido = positivos.filter((c) =>
    ["Contenido y funcionalidades", "Resultados y hábito"].includes(c.subcategoria)
  ).length;

  const pasos: Omit<Paso, "comentarios">[] = [
    {
      clave: "adquisicion",
      titulo: "Adquisición",
      momento: "El cliente está considerando unirse a la app.",
      bien: [
        "El plan anual es una buena oferta para los pocos que lo compran, y quienes lo hacen se quedan mucho más tiempo.",
      ],
      mal: [
        "La promo de 3 meses está mal comunicada: la gente se inscribe con otras expectativas, se siente engañada cuando sube el precio y cancela después de los 3 meses.",
      ],
      evidencia: [
        { valor: pctTasa(anual), texto: `de los clientes del plan Anual cancelaron (vs ${pctTasa(mensual)} en el Mensual)`, apoya: "bien" },
        { valor: pct(anual.length, total), texto: "de los clientes eligió el plan Anual", apoya: "neutro" },
        { valor: pctTasa(promo), texto: `de los clientes que llegaron por la Promo 3 meses cancelaron (vs ${pctTasa(otrosCanales)} en los demás canales)`, apoya: "mal" },
        { valor: pct(promoTrasDia90, promoCancelados.length), texto: "de las cancelaciones de la promo ocurren después del día 90, cuando el precio sube de $9.900 a $29.900", apoya: "mal" },
      ],
      nota: "Ojo: quien paga el año completo también tiene menos facilidad para irse, así que no toda la diferencia se debe a satisfacción.",
    },
    {
      clave: "onboarding",
      titulo: "Onboarding",
      momento: "El cliente empieza a usar la app.",
      bien: [
        "Completar el onboarding es la palanca de retención más clara de esta etapa: quien lo termina tiene muchas más probabilidades de quedarse.",
      ],
      mal: [
        "Muchos clientes entran perdidos y sin una forma intuitiva de configurar su modo de onboarding. Se ve en los comentarios y en los datos: quien completa el onboarding tiene más probabilidades de quedarse.",
      ],
      evidencia: [
        { valor: pctTasa(sinOnb), texto: `de quienes NO completaron el onboarding cancelaron (vs ${pctTasa(conOnb)} de quienes sí)`, apoya: "mal" },
        { valor: pct(sinOnb.length, total), texto: "de los clientes no completa el onboarding", apoya: "mal" },
        { valor: `${cuenta("Onboarding y acompañamiento", "Negativo")}`, texto: "comentarios negativos sobre no saber por dónde empezar, y ninguno positivo", apoya: "mal" },
      ],
    },
    {
      clave: "nurturing",
      titulo: "Nurturing",
      momento: "El cliente usa la app de forma continua.",
      bien: ["El contenido vale la pena para quienes se quedan."],
      mal: [
        "Hay una multitud de problemas técnicos, sobre todo un bug muy específico en Android que hace que quienes usan ese sistema cancelen mucho más.",
        "Quienes no logran una rutina constante tienen muchas probabilidades de abandonar el servicio.",
      ],
      evidencia: [
        { valor: pctTasa(android), texto: `de los clientes Android cancelaron (vs ${pctTasa(ios)} en iOS)`, apoya: "mal" },
        { valor: `${julio("Android")} vs ${julio("iOS")}`, texto: "cancelaciones de Android frente a iOS en julio de 2026, el mes de la actualización problemática", apoya: "mal" },
        { valor: pctTasa(pocas), texto: `de quienes hicieron 5 sesiones o menos en el primer mes cancelaron (vs ${pctTasa(muchas)} con 6 o más)`, apoya: "mal" },
        { valor: `${cuenta("Estabilidad técnica", "Negativo")}`, texto: "comentarios negativos sobre fallas técnicas, el tema más frecuente", apoya: "mal" },
        { valor: `${posContenido} de ${positivos.length}`, texto: "comentarios positivos hablan del contenido, los instructores y los resultados", apoya: "bien" },
      ],
    },
    {
      clave: "cancelacion",
      titulo: "Cancelación y flexibilidad",
      momento: "El cliente decide irse o quiere pausar su suscripción.",
      bien: [],
      mal: [
        "Cancelar es difícil: no hay un botón claro y hay que escribir a soporte y esperar.",
        "No existe la opción de pausar: quien solo quería un descanso (un viaje, el trabajo) no tiene más remedio que cancelar todo.",
        "Las ofertas de retención llegan tarde, cuando el cliente ya canceló.",
      ],
      evidencia: [
        { valor: `${cuenta("Cancelación y pausa", "Negativo")}`, texto: "comentarios negativos sobre lo difícil que es cancelar o la falta de una opción de pausa, y ninguno positivo", apoya: "mal" },
        { valor: `${cancelados.length}`, texto: `clientes cancelaron (${pct(cancelados.length, total)} del total)`, apoya: "mal" },
        { valor: `${inactProm.toFixed(1).replace(".", ",")} días`, texto: "pasan en promedio entre la última sesión y la cancelación: una ventana para actuar que hoy no se usa", apoya: "neutro" },
      ],
    },
  ];

  // Comentarios relevantes por etapa: subcategoría + sentimiento (+ patrón en el texto para afinar)
  type Regla = { sub: string; sent: Comentario["sentimiento"]; patron?: RegExp };
  const reglas: Record<string, Regla[]> = {
    adquisicion: [
      { sub: "Precio y promoción", sent: "Negativo", patron: /promo|3 meses|engañ/i },
      { sub: "Precio y promoción", sent: "Positivo", patron: /anual/i },
    ],
    onboarding: [
      { sub: "Onboarding y acompañamiento", sent: "Negativo" },
      { sub: "Resultados y hábito", sent: "Positivo", patron: /plan guiado/i },
    ],
    nurturing: [
      { sub: "Estabilidad técnica", sent: "Negativo", patron: /android|samsung|xiaomi|motorola/i },
      { sub: "Estabilidad técnica", sent: "Negativo" },
      { sub: "Contenido y funcionalidades", sent: "Positivo" },
      { sub: "Resultados y hábito", sent: "Positivo" },
    ],
    cancelacion: [
      { sub: "Cancelación y pausa", sent: "Negativo" },
      { sub: "Precio y promoción", sent: "Negativo", patron: /cancel/i },
    ],
  };

  // Se alternan las reglas (negativo, positivo, ...) para que los primeros comentarios muestren ambos lados
  const MAX_COMENTARIOS = 8;
  const elegir = (rs: Regla[]): Comentario[] => {
    const colas = rs.map((r) =>
      validos.filter(
        (c) => c.subcategoria === r.sub && c.sentimiento === r.sent && (!r.patron || r.patron.test(c.comentario))
      )
    );
    const vistos = new Set<string>(); // los textos idénticos se muestran una sola vez
    const salida: Comentario[] = [];
    while (salida.length < MAX_COMENTARIOS && colas.some((q) => q.length)) {
      for (const q of colas) {
        let c = q.shift();
        while (c && vistos.has(c.comentario)) c = q.shift();
        if (c && salida.length < MAX_COMENTARIOS) {
          vistos.add(c.comentario);
          salida.push(c);
        }
      }
    }
    return salida;
  };

  return pasos.map((p) => ({ ...p, comentarios: elegir(reglas[p.clave] ?? []) }));
}
