const FAQ_ITEMS = [
  {
    question: '¿plan-b está afiliada con mi universidad?',
    answer:
      'No. Es un proyecto independiente hecho por alumnos. Las universidades no lo operan ni deciden qué se publica.',
  },
  {
    question: '¿Por qué no hay estrellas ni puntaje?',
    answer:
      'Porque un puntaje se discute y un conteo no. «3,8 sobre 5» no dice nada verificable; «ocho de cada diez marcaron que faltaron muchas clases, sobre 31 cursadas» sí, y se puede desarmar hasta la opción que cada uno eligió.',
  },
  {
    question: '¿Cualquiera puede escribir sobre una cátedra?',
    answer:
      'Hace falta cuenta, y va una sola voz por cuenta, materia y período: la misma cursada no se cuenta dos veces. Hacia afuera nada lleva tu nombre, y nunca se muestra una reseña sola.',
  },
  {
    question: '¿Por qué algunas cátedras no muestran nada?',
    answer:
      'Porque todavía no juntaron diez reseñas. Con menos, un conteo diría más de quién se acordó de escribir que de cómo se cursa ahí, y además haría reconocible a quien escribió.',
  },
  {
    question: '¿Puedo borrar mi reseña?',
    answer:
      'Sí, en Mis aportes, y también corregirlo. Lo que saques deja de contar y los conteos de la ficha se mueven hacia atrás.',
  },
] as const;

/**
 * Las preguntas de la entrada. Se muestran siempre expandidas: son cinco, y esconderlas detrás de
 * un acordeón le pediría a alguien que ya desconfía que haga clic para enterarse de lo que le
 * importa.
 *
 * Dos contestan lo que el producto decidió **no** hacer (no hay puntaje, no se publica bajo el
 * piso). Están acá además de en Método porque son
 * exactamente las dos que hacen dudar a quien llega.
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
