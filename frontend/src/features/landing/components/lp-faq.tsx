const FAQ_ITEMS = [
  {
    question: '¿plan-b está afiliada con mi universidad?',
    answer:
      'No. Es un proyecto independiente hecho por alumnos. Las universidades no operan ni moderan el contenido: el equipo de plan-b cura los datos académicos.',
  },
  {
    question: '¿Pueden los profesores ver quién los reseñó?',
    answer:
      'No. Las reseñas son anónimas hacia afuera. Internamente verificamos que cursaste, pero esa data no sale del backend.',
  },
  {
    question: '¿Tengo que cargar todo mi historial?',
    answer:
      'Sí, esa es la base. Sin historial no podés reseñar ni armar simulador útil. Tarda 2 minutos.',
  },
  {
    question: '¿Qué pasa con las reseñas viejas si cambia el profesor?',
    answer:
      'Quedan asociadas al docente y al cuatrimestre en el que se cursó. Una reseña de 2021 con otro profe es eso, no se mezcla.',
  },
] as const;

/**
 * Sección FAQ de la landing pública (US-054-f). Port de la sección `#faq` de
 * `Landing` (docs/design/reference/canvas-mocks/landing.jsx, líneas 542-575).
 * Las 4 preguntas se muestran siempre expandidas (el mock no usa acordeón).
 */
export function LpFaq() {
  return (
    <section id="faq" style={{ padding: '56px 48px', maxWidth: 920, margin: '0 auto' }}>
      <div
        className="font-mono uppercase text-accent-ink"
        style={{ fontSize: 11, letterSpacing: '0.08em', marginBottom: 12 }}
      >
        04 · preguntas
      </div>
      <h2 style={{ margin: '0 0 28px', fontSize: 30, fontWeight: 600, letterSpacing: '-0.022em' }}>
        Lo que probablemente te estés preguntando.
      </h2>

      {FAQ_ITEMS.map((item) => (
        <div key={item.question} className="border-t border-line" style={{ padding: '18px 0' }}>
          <div className="text-ink" style={{ fontSize: 15, fontWeight: 500, marginBottom: 6 }}>
            {item.question}
          </div>
          <div className="text-ink-2" style={{ fontSize: 13.5, lineHeight: 1.55 }}>
            {item.answer}
          </div>
        </div>
      ))}
    </section>
  );
}
