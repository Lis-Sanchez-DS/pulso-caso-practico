type Cambio = { ia: string; consultora: string };
type Seccion = { titulo: string; uso: string; limitaciones: string; cambios?: Cambio[] };

// Textos redactados por la consultora
const SECCIONES: Seccion[] = [
  {
    titulo: "Calidad y limpieza de los datos",
    uso: "La IA se utilizó para apoyar la limpieza de datos, identificando valores erróneos o ilógicos. La decisión sobre el tratamiento o la imputación de dichos datos siempre recayó sobre la consultora. También se utilizó la IA para crear el código de limpieza una vez se sabía cómo se iba a limpiar.",
    limitaciones:
      "No todas las inconsistencias fueron agarradas al mismo tiempo y tomó múltiples versiones llegar a una versión de los datos que se consideraba limpia.",
  },
  {
    titulo: "Datos y análisis",
    uso: "La IA se utilizó de apoyo para la creación del código para entender y empezar a analizar los datos. No se le preguntó por ninguna conclusión y toda decisión de limpieza, graficación y conclusión salieron de la consultora.",
    limitaciones:
      "Se tuvo cuidado de siempre revisar que hacía el código que creaba la IA y se corregía si se desviaba de lo indicado.",
  },
  {
    titulo: "Análisis de comentarios",
    uso: "La IA se utilizó para categorizar los distintos comentarios y para graficar la distribución de dichas categorías, se revisó de manera manual que las categorías tuviesen sentido con los comentarios que clasificó y todas las conclusiones que se sacaron fueron, de nuevo, por parte de la consultora al analizar y contrastar los comentarios y sus categorías.",
    limitaciones:
      "Se hizo una auditoría sencilla de las clasificaciones que hizo la IA pero no cometió ningún error significativo.",
  },
  {
    titulo: "Creación de la página web y visualización",
    uso: "Se utilizó la IA para la creación de la página web, haciendo que esta maneje todo lo relacionado al código y que el diseño sea el especificado por la consultora. Todas las conclusiones, planes de acciones y decisiones de cómo mostrar los datos fueron hechos por la consultora. Adicionalmente se utilizó otra IA para la creación del logo de la empresa ficticia y una paleta de colores consistente para propósitos del ejercicio. En la publicación de la página, la IA escribió el esquema de la base de datos en Supabase y el script que genera los datos ya limpios para cargarlos, y configuró el despliegue en Vercel. La consultora creó el proyecto de Supabase, aportó las llaves públicas y autorizó cada publicación.",
    limitaciones:
      "Las conclusiones y mayoría de los textos fueron escritos por la consultora, la IA solo los incorporó en la página. Además, se necesitó constantemente hacer revisiones de diseño y mejoras hasta llegar a la versión actual de la página, con las mejoras de diseño siempre siendo particulares bajo la visión de la consultora. Otra limitación es que el flujo de datos funciona hoy de forma estática: la página solo toma los datos del archivo ya limpio que se cargó a Supabase, por lo que no se actualiza si llegan datos nuevos.",
  },
  {
    titulo: "Hipótesis y recorrido del cliente",
    uso: "La consultora planteó las etapas del recorrido y sus aciertos y fallas. La IA se utilizó para contrastar cada afirmación con los datos y los comentarios, calculando las cifras que aparecen en la página, y para proponer dos etapas adicionales. La consultora no las adoptó tal cual: las evaluó y las reconstruyó con su propio criterio, y el resultado final cambió el enfoque de lo propuesto (ver abajo). La IA también creó las ilustraciones de cada etapa con la paleta de la marca.",
    cambios: [
      {
        ia: "Etapa «Cobro y renovación»: cobros sin aviso y salto de precio al terminar la promoción.",
        consultora: "Se descartó: decía lo mismo que el Onboarding, así que no se incluyó.",
      },
      {
        ia: "Etapa «Cancelación»: una señal previa de inactividad como punto positivo y las quejas por lo difícil que era cancelar.",
        consultora:
          "Se eliminó el punto positivo porque no es una buena práctica actual y se renombró «Cancelación y flexibilidad» para incluir los comentarios de quienes querían pausar el plan y no podían.",
      },
      {
        ia: "Enfoque inicial: el proceso de cancelar.",
        consultora: "Enfoque final: la falta de flexibilidad del servicio, por ejemplo no poder pausar en lugar de cancelar.",
      },
    ],
    limitaciones:
      "Las cifras muestran asociaciones, no causas: por ejemplo, quien paga el plan anual también tiene más difícil irse, y quien usa poco la app podría estar ya a punto de irse. El bug de Android se infiere de los comentarios y de las cancelaciones de julio, pero no se verificó técnicamente. Las muestras son pequeñas (300 clientes y 61 comentarios con sentimiento definido). Las ilustraciones son representaciones ilustrativas, no capturas de la app real, y fue necesario ajustar textos que se salían de los recuadros.",
  },
  {
    titulo: "Plan de acción",
    uso: "Las acciones, sus textos y la forma de medirlas fueron definidos por la consultora. La IA se utilizó para buscar, para cada acción, un dato y comentarios de clientes que la respaldaran, para calcular la ganancia estimada con la fórmula de la consultora (plan anual × 12 − plan de promoción × 3) y para sugerir adelantar la alerta de inactividad a 7 días tras ver que con 10 días solo se alcanzaba a la mitad de quienes cancelan.",
    limitaciones:
      "Un dato que la IA propuso al inicio para el sistema de incentivos se descartó porque no demostraba nada (quienes ya cancelaron no pueden tener sesiones después). La ganancia estimada supone que el cliente de la promoción se habría ido a los 3 meses, y como la muestra es pequeña las cifras son orientativas. Todas las sugerencias, datos y fórmulas de la IA fueron revisados por la consultora para asegurar que tuvieran sentido y estuvieran bien implementados: nada se dejó en manos de la IA por sí sola.",
  },
];

export default function Page() {
  return (
    <main className="contenedor">
      <p className="kicker">Uso de IA</p>
      <h1>Cómo se usó la inteligencia artificial</h1>
      <p className="intro">
        Para cada parte del trabajo: qué se le pidió a la IA y qué correcciones y limitaciones fue necesario tener
        en cuenta.
      </p>

      <ol className="acciones">
        {SECCIONES.map((s, i) => (
          <li key={s.titulo} className="accion">
            <header>
              <span className="numero">{i + 1}</span>
              <div>
                <h2>{s.titulo}</h2>
              </div>
            </header>
            <div className="accion-cuerpo">
              <div className="bloque">
                <h3>Cómo se usó</h3>
                <p>{s.uso}</p>
              </div>
              <div className="bloque">
                <h3>Correcciones y limitaciones necesarias</h3>
                <p>{s.limitaciones}</p>
              </div>
            </div>
            {s.cambios && (
              <div className="cambios">
                <h3>Cómo cambió la propuesta de la IA hasta la versión final</h3>
                <div className="cambio-cabecera">
                  <span>Propuesta de la IA</span>
                  <span />
                  <span>Decisión de la consultora</span>
                </div>
                {s.cambios.map((c) => (
                  <div key={c.ia} className="cambio">
                    <p className="cambio-ia">{c.ia}</p>
                    <span className="cambio-flecha" aria-hidden="true">→</span>
                    <p className="cambio-consultora">{c.consultora}</p>
                  </div>
                ))}
              </div>
            )}
          </li>
        ))}
      </ol>
    </main>
  );
}
