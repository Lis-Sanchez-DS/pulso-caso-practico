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
  prioridad?: number; // 1 = la más prioritaria; vacío en las complementarias
  complementaria?: boolean;
  motivo: string; // por qué tiene esta prioridad
  meta: Meta; // meta numérica basada en datos reales
};

export type FilaMeta = { metrica: string; hoy: string; intermedia?: string; final: string };
export type Meta = { filas: FilaMeta[]; origen: string };

export type PlanDeAccion = {
  metodo: { titulo: string; pasos: string[] };
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

  // ---------- Metas basadas en referencias internas ----------
  // Meta final = lo que ya se logra hoy en el mejor segmento o antes de la actualización de julio.
  // Meta intermedia = cerrar la mitad de la brecha (supuesto prudente).
  const p0 = (x: number) => `${Math.round(x * 100)}%`;
  const medio = (a: number, b: number) => (a + b) / 2;

  // Plan anual: si los clientes de la promo adoptaran el anual como los demás canales
  const noPromo = clientes.filter((c) => c.canal_adquisicion !== "Promo 3 meses");
  const anualHoy = anual.length / total;
  const refAnual = noPromo.filter((c) => c.plan === "Anual").length / noPromo.length;
  const anualFinal = (anual.length + refAnual * promo.length) / total;
  const quejasPrecio = cuenta("Precio y promoción", "Negativo");
  const quejasPromo = validos.filter(
    (c) => c.subcategoria === "Precio y promoción" && c.sentimiento === "Negativo" && /promo|3 meses|engañ/i.test(c.comentario)
  ).length;

  // Técnico: relación de cancelaciones Android / iOS antes y después de la actualización de julio
  const ACTUALIZACION = "2026-07-01";
  const canc = (so: string, post: boolean) =>
    cancelados.filter(
      (c) => c.dispositivo === so && c.fecha_cancelacion !== null && (c.fecha_cancelacion >= ACTUALIZACION) === post
    ).length;
  const razonPre = canc("Android", false) / Math.max(1, canc("iOS", false));
  const razonPost = canc("Android", true) / Math.max(1, canc("iOS", true));
  const fmtRazon = (x: number) => `${x.toFixed(1).replace(".", ",")}×`;
  const tecnicos = validos.filter((c) => c.subcategoria === "Estabilidad técnica" && c.sentimiento === "Negativo");
  const mesesPost = new Set(tecnicos.filter((c) => c.fecha >= ACTUALIZACION).map((c) => c.fecha.slice(0, 7)));
  const tecPost = tecnicos.filter((c) => c.fecha >= ACTUALIZACION).length / Math.max(1, mesesPost.size);
  const tecPre = tecnicos.filter((c) => c.fecha < ACTUALIZACION).length / 7; // diciembre a junio
  const fmtMes = (x: number) => `${x.toFixed(1).replace(".", ",")} al mes`;
  const act30Android = act30.filter((c) => c.dispositivo === "Android");
  const act30Ios = act30.filter((c) => c.dispositivo === "iOS");
  const muchas30 = (xs: Cliente[]) => xs.filter((c) => (c.sesiones_ultimos_30d ?? 0) > 10).length / Math.max(1, xs.length);

  // Onboarding: finalización según el mejor canal y efecto en las sesiones del primer mes
  const canales = [...new Set(clientes.map((c) => c.canal_adquisicion))];
  const finalizacion = (xs: Cliente[]) => xs.filter((c) => c.completo_onboarding === "Sí").length / Math.max(1, xs.length);
  const mejorCanal = canales
    .map((k) => ({ k, v: finalizacion(clientes.filter((c) => c.canal_adquisicion === k)) }))
    .sort((a, b) => b.v - a.v)[0];
  const onbHoy = conOnb.length / total;
  const sesionesConOnb = conOnb.filter((c) => c.sesiones_primer_mes > 10).length / Math.max(1, conOnb.length);
  const muchasHoy = muchasPrimer.length / Math.max(1, conDato.length);
  const muchasFinal = mejorCanal.v * sesionesConOnb;
  const cancelEsperada = mejorCanal.v * tasa(conOnb) + (1 - mejorCanal.v) * tasa(sinOnb);

  // Constancia: lo que ya logran los clientes activos de iOS
  const constHoy = act30Muchas.length / Math.max(1, act30.length);
  const constFinal = muchas30(act30Ios);

  // Alertas: de quienes pasan el umbral sin sesión, cuántos terminan cancelando
  const cancelTrasUmbral = inact.filter((v) => v >= UMBRAL_INACTIVIDAD).length;
  const trasUmbral = cancelTrasUmbral + silenciosos.length;

  const metas: Record<string, Meta> = {
    anual: {
      filas: [
        { metrica: "Clientes en el plan anual", hoy: p0(anualHoy), intermedia: p0(medio(anualHoy, anualFinal)), final: p0(anualFinal) },
        { metrica: "Quejas sobre precio o promoción", hoy: `${quejasPrecio}`, intermedia: `${Math.round(medio(quejasPrecio, quejasPrecio - quejasPromo))}`, final: `${quejasPrecio - quejasPromo}` },
      ],
      origen: `Hoy el ${p0(refAnual)} de los clientes que no llegan por la promo elige el plan anual, y ninguno de los ${promo.length} de la promo lo hace. La meta final supone que los clientes de la promo se comportan como los demás canales. De las ${quejasPrecio} quejas de precio, ${quejasPromo} hablan directamente de la promoción y deberían desaparecer al retirarla.`,
    },
    tecnico: {
      filas: [
        { metrica: "Cancelaciones Android frente a iOS", hoy: fmtRazon(razonPost), intermedia: fmtRazon(medio(razonPost, razonPre)), final: fmtRazon(razonPre) },
        { metrica: "Comentarios sobre fallas técnicas", hoy: fmtMes(tecPost), intermedia: fmtMes(medio(tecPost, tecPre)), final: fmtMes(tecPre) },
      ],
      origen: `La referencia es el periodo anterior a la actualización de julio: entonces Android tenía ${fmtRazon(razonPre)} las cancelaciones de iOS (hoy ${fmtRazon(razonPost)}) y casi no había comentarios de fallas. Además, solo el ${p0(muchas30(act30Android))} de los clientes activos en Android supera las 10 sesiones al mes, frente al ${p0(muchas30(act30Ios))} en iOS.`,
    },
    onboarding: {
      filas: [
        { metrica: "Clientes que completan el onboarding", hoy: p0(onbHoy), intermedia: p0(medio(onbHoy, mejorCanal.v)), final: p0(mejorCanal.v) },
        { metrica: "Clientes con más de 10 sesiones en el primer mes", hoy: p0(muchasHoy), intermedia: p0(medio(muchasHoy, muchasFinal)), final: p0(muchasFinal) },
      ],
      origen: `El canal con mejor finalización hoy es ${mejorCanal.k} (${p0(mejorCanal.v)}). Entre quienes completan el onboarding, el ${p0(sesionesConOnb)} supera las 10 sesiones del primer mes; entre quienes no lo completan, ${p0(sinOnb.filter((c) => c.sesiones_primer_mes > 10).length / Math.max(1, sinOnb.length))}. Con esa finalización, la cancelación esperada bajaría de ${p0(cancelados.length / total)} a ${p0(cancelEsperada)}, suponiendo que la relación se mantenga.`,
    },
    constancia: {
      filas: [
        { metrica: "Clientes activos con más de 10 sesiones en 30 días", hoy: p0(constHoy), intermedia: p0(medio(constHoy, constFinal)), final: p0(constFinal) },
      ],
      origen: `La referencia es lo que ya logran los clientes activos de iOS (${p0(constFinal)}). Esta meta depende de resolver antes los problemas técnicos en Android: con la app fallando, un incentivo por constancia no puede funcionar.`,
    },
    alertas: {
      filas: [
        { metrica: `Clientes que cancelan tras ${UMBRAL_INACTIVIDAD} días sin sesión`, hoy: `${pct(cancelTrasUmbral, trasUmbral)} (${cancelTrasUmbral} de ${trasUmbral})`, final: "A definir con un piloto" },
      ],
      origen: `No hay una referencia interna: hoy nadie recibe una alerta. La meta se fijaría con un piloto: alertar a una mitad de los clientes que lleguen a ${UMBRAL_INACTIVIDAD} días sin sesión, comparar cuántos cancelan en los siguientes 30 días contra la otra mitad y ajustar. Con ${trasUmbral} clientes en esta situación, la muestra es muy pequeña para prometer un número.`,
    },
  };

  const motivos: Record<string, string> = {
    anual: "La mayor cantidad de quejas constantes se da por el precio y la confusión. Lograr tener una mayor cantidad de clientes en el plan anual termina dando una ganancia medible.",
    tecnico: "La última falla técnica fuerte llevó a una cantidad significativa de usuarios a cancelar y salirse, por lo que prevenir y prepararse para una situación similar es crucial.",
    onboarding: "La mayoría de los comentarios negativos restantes se basan en la confusión y la experiencia de usuario. Esta termina siendo crucial al considerar que una porción de los clientes vienen de referidos, siendo estos los clientes que demuestran mayor fidelidad.",
    constancia: "Complementaria: depende de resolver antes los problemas técnicos, porque en Android casi nadie supera las 10 sesiones al mes.",
    alertas: "Complementaria: ayuda a rescatar clientes en riesgo, pero hoy alcanzaría a pocos y su efecto aún es incierto.",
  };

  const base: Omit<Accion, "meta" | "motivo" | "prioridad" | "complementaria">[] = [
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

  // Orden de prioridad definido por la consultora; las dos últimas son complementarias
  const orden = ["anual", "tecnico", "onboarding", "constancia", "alertas"];
  const acciones: Accion[] = orden.map((clave, i) => {
    const a = base.find((x) => x.clave === clave)!;
    return { ...a, meta: metas[clave], motivo: motivos[clave], prioridad: i < 3 ? i + 1 : undefined, complementaria: i >= 3 };
  });

  return {
    metodo: {
      titulo: "¿Cómo se fija una meta basada en la realidad?",
      pasos: [
        "Punto de partida: se mide hoy la métrica con los datos que ya existen.",
        "Referencia interna: se busca lo que ya se logra en el mejor segmento (un canal, un sistema operativo) o en el periodo anterior al problema.",
        "Meta intermedia: cerrar la mitad de la brecha hacia esa referencia, un supuesto prudente para el primer periodo. Meta final: igualar la referencia.",
        "Validación: probar con un grupo piloto y recalibrar. Como la muestra es de 300 clientes, todas las metas son orientativas.",
      ],
    },
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
