import type { Cliente, Comentario } from "./datos";
import { pesos } from "./variables";

export type Dato = { valor: string; texto: string };

export type Accion = {
  clave: string;
  titulo: string;
  propuesta: string;
  medicion: string; // cómo se mediría su efectividad
  linea_base: Dato[]; // dónde estamos hoy en esa métrica
  dato: Dato; // dato que respalda la acción
  impacto?: { valor: string; texto: string }; // estimación económica
  comentarios: Comentario[]; // comentarios de clientes que la respaldan
  nota?: string;
};

export type PlanDeAccion = {
  norte: { valor: string; texto: string; detalle: string };
  acciones: Accion[];
  llm: { propuesta: string; datos: Dato[]; comentarios: Comentario[] };
};

const UMBRAL_INACTIVIDAD = 7; // días sin sesión para disparar la alerta
const FECHA_CORTE = new Date("2026-09-30T00:00:00");
const pct = (n: number, d: number) => (d ? `${Math.round((n / d) * 100)}%` : "—");
const tasa = (xs: Cliente[]) => (xs.length ? xs.filter((c) => c.estado === "Cancelado").length / xs.length : 0);
const pctTasa = (xs: Cliente[]) => `${Math.round(tasa(xs) * 100)}%`;
const dias = (f: string) => Math.round((FECHA_CORTE.getTime() - new Date(f + "T00:00:00").getTime()) / 86_400_000);

export function construirPlan(clientes: Cliente[], comentarios: Comentario[]): PlanDeAccion {
  const total = clientes.length;
  const cancelados = clientes.filter((c) => c.estado === "Cancelado");
  const activos = clientes.filter((c) => c.estado === "Activo");
  const validos = comentarios.filter((c) => c.sentimiento !== "No aplica");
  const cuenta = (sub: string, sent: string) => validos.filter((c) => c.subcategoria === sub && c.sentimiento === sent).length;
  const buscar = (patron: RegExp) => comentarios.find((c) => patron.test(c.comentario));
  const lista = (...cs: (Comentario | undefined)[]) => cs.filter((c): c is Comentario => !!c);

  // 1. Plan anual en lugar de la promo de 3 meses
  const anual = clientes.filter((c) => c.plan === "Anual");
  const mensual = clientes.filter((c) => c.plan === "Mensual");
  const promo = clientes.filter((c) => c.canal_adquisicion === "Promo 3 meses");
  const precioAnual = anual[0]?.precio_mensual_cop ?? 19900;
  const precioPromo = Math.min(...promo.map((c) => c.precio_mensual_cop));
  const gananciaPorCliente = precioAnual * 12 - precioPromo * 3;

  // 2. Onboarding obligatorio
  const conDato = clientes.filter((c) => c.sesiones_primer_mes !== null);
  const muchasPrimer = conDato.filter((c) => c.sesiones_primer_mes > 10);
  const pocasPrimer = conDato.filter((c) => c.sesiones_primer_mes <= 10);
  const sinOnb = clientes.filter((c) => c.completo_onboarding === "No");
  const conOnb = clientes.filter((c) => c.completo_onboarding === "Sí");

  // 3. Soporte técnico
  const android = clientes.filter((c) => c.dispositivo === "Android");
  const ios = clientes.filter((c) => c.dispositivo === "iOS");
  const brecha = Math.round((tasa(android) - tasa(ios)) * 100);

  // 4. Incentivos por constancia
  const act30 = activos.filter((c) => c.sesiones_ultimos_30d !== null);
  const act30Muchas = act30.filter((c) => (c.sesiones_ultimos_30d ?? 0) > 10);
  const pocas5 = clientes.filter((c) => c.sesiones_primer_mes <= 5);
  const mas5 = clientes.filter((c) => c.sesiones_primer_mes > 5);

  // 5. Alertas de inactividad
  const silenciosos = activos.filter((c) => dias(c.fecha_ultima_sesion) > UMBRAL_INACTIVIDAD);
  const silenciososMensual = silenciosos.filter((c) => c.plan === "Mensual");
  const promSilencio = silenciosos.length
    ? silenciosos.reduce((a, c) => a + dias(c.fecha_ultima_sesion), 0) / silenciosos.length
    : 0;
  const inact = cancelados.map((c) => c.inactividad_dias).filter((v): v is number => v !== null);
  const alcance = (umbral: number) => pct(inact.filter((v) => v >= umbral).length, inact.length);

  // LLM
  const sinEstrellas = comentarios.filter((c) => c.calificacion === null).length;
  const contradictorios = comentarios.filter((c) => (c.calificacion ?? 0) >= 4 && c.sentimiento === "Negativo").length;
  const noRelacionados = comentarios.filter((c) => c.sentimiento === "No aplica").length;

  const acciones: Accion[] = [
    {
      clave: "anual",
      titulo: "Promover el plan anual en lugar de la promo de 3 meses",
      propuesta:
        "Dejar de promocionar el descuento de tres meses e incentivar el plan anual, para ganar constancia y satisfacción en los clientes.",
      medicion:
        "Que suba la cantidad de clientes en el plan anual y que bajen las quejas y los comentarios negativos relacionados con el precio.",
      linea_base: [
        { valor: pct(anual.length, total), texto: "de los clientes está hoy en el plan Anual" },
        { valor: `${cuenta("Precio y promoción", "Negativo")}`, texto: "comentarios negativos sobre precio o promoción hoy" },
      ],
      dato: {
        valor: `${pctTasa(anual)} vs ${pctTasa(mensual)}`,
        texto: "de cancelación en el plan Anual frente al Mensual; además, el " + pctTasa(promo) + " de quienes llegaron por la promo cancelaron",
      },
      impacto: {
        valor: pesos(gananciaPorCliente),
        texto: `de ganancia adicional por cada cliente que pase de los 3 meses de promo al plan anual de 12 meses: (${pesos(precioAnual)} × 12) − (${pesos(precioPromo)} × 3)`,
      },
      comentarios: lista(buscar(/engañada/), buscar(/plan anual y ha sido/)),
      nota: `Por ejemplo, por cada 10 clientes que migren serían ${pesos(gananciaPorCliente * 10)} adicionales. La estimación supone que el cliente de la promo se habría ido tras los 3 meses, algo que los datos respaldan: el ${pct(
        promo.filter((c) => c.estado === "Cancelado").length,
        promo.length
      )} de esos clientes cancela.`,
    },
    {
      clave: "onboarding",
      titulo: "Hacer el onboarding obligatorio y que incentive a crear una rutina",
      propuesta:
        "Dejar de tratar el onboarding como una función opcional: que sea obligatorio y que busque motivar a la persona a entrenar muchos días desde el inicio.",
      medicion: "Que cambie (suba) la cantidad de personas con más de 10 sesiones en el primer mes.",
      linea_base: [
        { valor: pct(muchasPrimer.length, conDato.length), texto: `de los clientes ya tiene más de 10 sesiones en el primer mes (${muchasPrimer.length} de ${conDato.length})` },
        { valor: pct(sinOnb.length, total), texto: "de los clientes no completa el onboarding hoy" },
      ],
      dato: {
        valor: `${pctTasa(sinOnb)} vs ${pctTasa(conOnb)}`,
        texto: `de cancelación entre quienes no completaron el onboarding y quienes sí; con más de 10 sesiones en el primer mes cancela el ${pctTasa(muchasPrimer)} (vs ${pctTasa(pocasPrimer)} con 10 o menos)`,
      },
      comentarios: lista(buscar(/no supe por dónde empezar/), buscar(/armen a uno un plan/)),
    },
    {
      clave: "tecnico",
      titulo: "Un sistema más robusto de solución de problemas técnicos",
      propuesta: "Implementar un proceso más sólido para detectar y resolver las fallas técnicas, empezando por las de Android.",
      medicion:
        "Que baje el número de personas que reportan problemas técnicos y que se reduzca la diferencia en cancelaciones entre sistemas operativos.",
      linea_base: [
        { valor: `${cuenta("Estabilidad técnica", "Negativo")}`, texto: "comentarios negativos sobre fallas técnicas hoy" },
        { valor: `${brecha} puntos`, texto: `de diferencia en la tasa de cancelación entre Android (${pctTasa(android)}) e iOS (${pctTasa(ios)})` },
      ],
      dato: {
        valor: pct(
          cancelados.filter((c) => c.dispositivo === "Android" && c.fecha_cancelacion?.startsWith("2026-07")).length,
          cancelados.filter((c) => c.fecha_cancelacion?.startsWith("2026-07")).length
        ),
        texto: "de las cancelaciones de julio de 2026 fueron de usuarios Android, el mes de la actualización problemática",
      },
      comentarios: lista(buscar(/Samsung/), buscar(/Motorola/)),
    },
    {
      clave: "constancia",
      titulo: "Un sistema de incentivos por constancia",
      propuesta: "Premiar a quienes mantienen una rutina para reforzar el hábito de entrenar con frecuencia.",
      medicion: "Que aumente la cantidad de personas con varias rutinas (más de 10) en los últimos 30 días.",
      linea_base: [
        { valor: pct(act30Muchas.length, act30.length), texto: `de los clientes activos tiene más de 10 sesiones en los últimos 30 días (${act30Muchas.length} de ${act30.length})` },
      ],
      dato: {
        valor: `${pctTasa(pocas5)} vs ${pctTasa(mas5)}`,
        texto: "de cancelación entre quienes hicieron 5 sesiones o menos en su primer mes y quienes hicieron 6 o más: la constancia se nota desde el inicio",
      },
      comentarios: lista(buscar(/racha diaria/), buscar(/mi racha de 60 días/)),
    },
    {
      clave: "alertas",
      titulo: "Alertas de inactividad para readquirir al cliente",
      propuesta: `Detectar a quienes llevan más de ${UMBRAL_INACTIVIDAD} días sin una sesión y, desde la app, invitarlos a llenar la encuesta de satisfacción para conocer su problema a fondo y ofrecerles el plan anual si están en el mensual.`,
      medicion: "Que baje la cantidad de personas que cancelan después de un periodo largo de inactividad.",
      linea_base: [
        {
          valor: `${silenciosos.length}`,
          texto: `clientes marcados como activos llevan más de ${UMBRAL_INACTIVIDAD} días sin sesión al corte (en promedio ${Math.round(promSilencio)} días); ${silenciososMensual.length} están en el plan Mensual`,
        },
      ],
      dato: {
        valor: alcance(UMBRAL_INACTIVIDAD),
        texto: `de las cancelaciones ocurren ${UMBRAL_INACTIVIDAD} días o más después de la última sesión, así que una alerta a los ${UMBRAL_INACTIVIDAD} días llega a tiempo a la mayoría de quienes terminan cancelando`,
      },
      comentarios: lista(buscar(/ningún recordatorio/), buscar(/tampoco me motivó/)),
      nota: `El umbral de ${UMBRAL_INACTIVIDAD} días es más temprano que uno de 10: con 10 días solo se alcanzaría al ${alcance(10)} de quienes cancelan.`,
    },
  ];

  return {
    norte: {
      valor: pct(cancelados.length, total),
      texto: "de los clientes de la muestra canceló",
      detalle: `${cancelados.length} de ${total} clientes. La métrica más importante: que la cantidad de personas que cancelan disminuya después de estas implementaciones.`,
    },
    acciones,
    llm: {
      propuesta:
        "Poner a un modelo LLM a clasificar las reseñas y comentarios de los clientes en las categorías establecidas, para ver cómo evoluciona el sentimiento y cuáles son los problemas particulares que tienen.",
      datos: [
        { valor: `${sinEstrellas} de ${comentarios.length}`, texto: "comentarios no traen calificación (chat de soporte e Instagram): solo se pueden entender leyendo el texto" },
        { valor: `${contradictorios}`, texto: "comentarios con 4 o 5 estrellas son en realidad negativos, así que la calificación sola engaña" },
        { valor: `${noRelacionados}`, texto: "comentarios eran spam o no tenían relación con la app y también hay que filtrarlos" },
      ],
      comentarios: lista(buscar(/Excelente actualización/)),
    },
  };
}
