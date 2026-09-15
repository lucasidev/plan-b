import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { SubjectChair, SubjectFacts } from '../types';
import { SubjectFactsSheet } from './subject-facts-sheet';

function facts(over: Partial<SubjectFacts> = {}): SubjectFacts {
  return {
    subjectId: 'subject-1',
    subjectCode: '211',
    subjectName: 'Análisis Matemático II',
    yearInPlan: 2,
    careerPlanId: 'plan-1',
    careerId: 'career-1',
    careerName: 'Ingeniería en Sistemas',
    universityName: 'UNT',
    isPublished: true,
    totalVoices: 111,
    publishingChairs: 3,
    chairsBelowFloor: 0,
    span: { fromYear: 2023, toYear: 2026 },
    completion: null,
    enablesCount: 4,
    spread: [],
    shared: [],
    takenWith: [],
    chairs: [],
    ...over,
  };
}

function chair(over: Partial<SubjectChair> = {}): SubjectChair {
  return {
    chairId: 'c1',
    chairName: 'Pérez',
    reviewCount: 42,
    isPublished: true,
    reviewsMissingToPublish: 0,
    lastReviewedAt: null,
    leadTeacherName: null,
    headline: null,
    ...over,
  };
}

function renderSheet(f: SubjectFacts) {
  render(<SubjectFactsSheet facts={f} />);
}

describe('SubjectFactsSheet', () => {
  /**
   * SC-007, estado "vacía" (US-136 aplicado a la ficha de materia): sin ninguna cátedra cargada,
   * la ficha dice que no hay nada publicado y por qué (no hay cátedras, no que la materia esté
   * rota), y la línea de sustento dice "sin reseñas" en vez de un cero.
   */
  it('estado "vacía": sin cátedras cargadas, dice que no hay nada publicado', () => {
    renderSheet(facts({ isPublished: false, totalVoices: 0, publishingChairs: 0, chairs: [] }));

    expect(screen.getByText('Todavía no hay nada publicado de esta materia.')).toBeInTheDocument();
    expect(screen.getByText('No tiene cátedras cargadas todavía.')).toBeInTheDocument();
    expect(screen.getByText('Todavía sin reseñas.')).toBeInTheDocument();
  });

  /**
   * US-138 E3: la materia sigue vacía si tiene cátedras cargadas pero ninguna pasó el piso; el
   * dato existe (las reseñas están guardadas) pero no se publica todavía.
   */
  it('US-138 E3: vacía igual con cátedras bajo el piso, hasta que alguna publique', () => {
    renderSheet(
      facts({
        isPublished: false,
        totalVoices: 0,
        publishingChairs: 0,
        chairsBelowFloor: 1,
        chairs: [
          chair({
            chairId: 'chair-paz',
            chairName: 'Paz',
            reviewCount: 3,
            isPublished: false,
            reviewsMissingToPublish: 7,
          }),
        ],
      }),
    );

    expect(screen.getByText('Todavía no hay nada publicado de esta materia.')).toBeInTheDocument();
    expect(
      screen.getByText(/una cátedra publica sus conteos recién a las 10 reseñas/i),
    ).toBeInTheDocument();
  });

  /**
   * SC-007, estado "una sola cátedra": sin otra cátedra con qué contrastar, la sección "¿es la
   * materia o es una cátedra?" no tiene sentido y no aparece.
   */
  it('estado "una sola cátedra": sin otra con qué contrastar, no hay sección de dispersión', () => {
    renderSheet(facts({ spread: [], shared: [] }));

    expect(screen.queryByText('¿Es la materia o es una cátedra?')).not.toBeInTheDocument();
  });

  /**
   * Con una sola cátedra reseñada y sin spread no hay con qué comparar, así que la línea de
   * sustento no promete un contraste que la ficha no tiene: termina en el rango de años, sin
   * "Depende de cuál te toque."
   */
  it('con una sola cátedra reseñada, la línea de sustento no dice "depende de cuál te toque"', () => {
    renderSheet(
      facts({
        spread: [],
        chairs: [chair({ chairId: 'c1', chairName: 'Pérez', reviewCount: 15 })],
      }),
    );

    expect(screen.getByText('15 reseñas en 1 cátedra, de 2023 a 2026.')).toBeInTheDocument();
    expect(screen.queryByText(/depende de cuál te toque/i)).not.toBeInTheDocument();
  });

  /**
   * Con spread publicado sí hay con qué contrastar, aunque una sola cátedra haya juntado reseñas:
   * la diferencia entre cátedras ya está probada, no hace falta esperar a la segunda.
   */
  it('con spread publicado, la línea de sustento dice "depende de cuál te toque" con una sola cátedra', () => {
    renderSheet(
      facts({
        spread: [
          {
            itemCode: 'CHAIR_CLASSES_HELD',
            itemText: '¿Se dictaron las clases?',
            negativeLabel: 'Faltaron muchas',
            byChair: [{ chairId: 'c1', chairName: 'Pérez', percent: 56, total: 16 }],
          },
        ],
        chairs: [chair({ chairId: 'c1', chairName: 'Pérez', reviewCount: 15 })],
      }),
    );

    expect(screen.getByText(/depende de cuál te toque/i)).toBeInTheDocument();
  });

  /**
   * US-131 (cada dato deriva de voces contables): la línea de sustento dice cuántas reseñas y en
   * cuántas cátedras, sobre TODAS las cátedras (no solo las que publican), y la cátedra bajo el
   * piso se lista igual, sin "faltan N" ni "voces".
   */
  it('la línea de sustento cuenta reseñas y cátedras sobre todas, y la que falta al piso no dice "faltan"', () => {
    renderSheet(
      facts({
        chairs: [
          chair({ chairId: 'c1', chairName: 'Pérez', reviewCount: 50 }),
          chair({
            chairId: 'c4',
            chairName: 'Paz',
            reviewCount: 3,
            isPublished: false,
            reviewsMissingToPublish: 7,
          }),
        ],
      }),
    );

    expect(screen.getByText(/53 reseñas en 2 cátedras, de 2023 a 2026/i)).toBeInTheDocument();
    expect(screen.getByText(/3 reseñas, todavía sin conclusiones\./i)).toBeInTheDocument();
    expect(screen.queryByText(/faltan 7/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/\bvoces\b/i)).not.toBeInTheDocument();
  });

  /**
   * US-154 (de cada 10 que la cursan, cuántas llegan) y ficha SC-007 (cuánto habilita): los dos
   * números derivan de las cursadas reseñadas y del plan de la carrera, uno en la tarjeta de
   * finalización (con su fuente al lado) y el otro en la tira de stats de la cabecera.
   */
  it('US-154: la tasa de finalización y cuánto habilita, cada una con su fuente', () => {
    renderSheet(
      facts({
        completion: { outOfTen: 6, reaching: 62, total: 120 },
        enablesCount: 9,
      }),
    );

    expect(screen.getByText('6 de 10')).toBeInTheDocument();
    expect(screen.getByText(/62 de 120 cursadas reseñadas/i)).toBeInTheDocument();
    expect(screen.getByText('9')).toBeInTheDocument();
    expect(screen.getByText('materias habilita')).toBeInTheDocument();
  });

  /**
   * Eyebrow "Materia · Nº año del plan {año}" (US-129): el año del plan es un pedido aparte del de
   * la ficha, así que si ese pedido falla, el eyebrow se queda sin "del plan {año}" en vez de
   * inventar un año o tirar abajo la ficha entera.
   */
  it('el eyebrow dice el año del plan cuando llega, y lo omite si no', () => {
    const { container, rerender } = render(<SubjectFactsSheet facts={facts()} planYear={2018} />);
    const eyebrow = () => container.querySelector('.pb-eyebrow');
    expect(eyebrow()?.textContent).toMatch(/materia · 2º año del plan 2018 ·/i);

    rerender(<SubjectFactsSheet facts={facts()} />);
    expect(eyebrow()?.textContent).toMatch(/materia · 2º año ·/i);
    expect(eyebrow()?.textContent).not.toMatch(/del plan/i);
  });

  /**
   * SC-007, "¿es la materia o es una cátedra?" (la propuesta aprobada sobre la ficha de materia):
   * una frase donde las cátedras difieren lista la moda negativa de cada una con su "de N".
   */
  it('spread publicado: cada cátedra que difiere lista su moda con su bar y su "de N"', () => {
    renderSheet(
      facts({
        spread: [
          {
            itemCode: 'CHAIR_CLASSES_HELD',
            itemText: '¿Se dictaron las clases?',
            negativeLabel: 'Faltaron muchas',
            byChair: [
              { chairId: 'c1', chairName: 'Pérez', percent: 56, total: 16 },
              { chairId: 'c2', chairName: 'González', percent: 19, total: 12 },
            ],
          },
        ],
      }),
    );

    expect(screen.getByText('¿Es la materia o es una cátedra?')).toBeInTheDocument();
    expect(screen.getByText('¿Se dictaron las clases?')).toBeInTheDocument();
    expect(screen.getByText('Depende de la cátedra: «faltaron muchas»')).toBeInTheDocument();
    expect(screen.getByText('Pérez')).toBeInTheDocument();
    expect(screen.getByText('56 % de 16')).toBeInTheDocument();
    expect(screen.getByText('González')).toBeInTheDocument();
    expect(screen.getByText('19 % de 12')).toBeInTheDocument();
  });

  /** Lo que todas las cátedras marcan parejo se publica aparte, como un rasgo de la materia. */
  it('shared publicado: la frase pareja se lee como un rasgo de la materia, con su rango', () => {
    renderSheet(
      facts({
        shared: [
          {
            itemCode: 'STUDENT_COULD_ASK',
            itemText: '¿Podías preguntar sin quedar mal?',
            negativeLabel: 'No',
            lowestPercent: 61,
            highestPercent: 74,
            chairCount: 3,
          },
        ],
      }),
    );

    expect(screen.getByText('Lo que sí es de la materia')).toBeInTheDocument();
    expect(
      screen.getByText(
        /¿podías preguntar sin quedar mal\? «no» lo marcan entre el 61 % y el 74 % en las 3 cátedras\./i,
      ),
    ).toBeInTheDocument();
  });

  /**
   * US-143 E1: con qué otra materia se llevó esta, publicada con cuántos la llevaron juntas y
   * cuántos dejaron alguna de las dos.
   */
  it('US-143 E1: co-cursada publicada, con sus voces y cuántos dejaron alguna', () => {
    renderSheet(
      facts({
        takenWith: [
          {
            subjectId: 'subject-2',
            subjectName: 'Álgebra I',
            subjectCode: '111',
            togetherCount: 23,
            droppedCount: 6,
            isPublished: true,
            missingToPublish: 0,
          },
        ],
      }),
    );

    expect(screen.getByText('Co-cursada · sale solo de las reseñas')).toBeInTheDocument();
    expect(screen.getByText(/23 la llevaron junto con esta/i)).toBeInTheDocument();
    expect(screen.getByText(/6 dejaron alguna de las dos/i)).toBeInTheDocument();
  });

  /**
   * US-143 N1: el par bajo su propio piso (10 por par y período) dice cuánto le falta, sin
   * publicar ningún conteo todavía.
   */
  it('US-143 N1: el par bajo su propio piso dice cuánto le falta, sin publicar el conteo', () => {
    renderSheet(
      facts({
        takenWith: [
          {
            subjectId: 'subject-3',
            subjectName: 'Física I',
            subjectCode: '131',
            togetherCount: 7,
            droppedCount: 0,
            isPublished: false,
            missingToPublish: 3,
          },
        ],
      }),
    );

    // El nombre está en el div interno (título + código); el <p> del conteo es hermano de ese div,
    // adentro del contenedor de la fila entera, un nivel más arriba.
    const row = screen.getByRole('link', { name: /física i/i }).closest('div')?.parentElement;
    expect(row).not.toBeNull();
    expect(
      within(row as HTMLElement).getByText(/7 la llevaron junto con esta: con 3 más se publica/i),
    ).toBeInTheDocument();
    expect(within(row as HTMLElement).queryByText(/dejaron/)).not.toBeInTheDocument();
  });

  /**
   * SC-007, "sus cátedras": con headline, la fila arma "La cátedra {nombre} {frase}: lo dice el
   * {percent} % de sus {respondents} reseñas.", con el docente a cargo y la última reseña.
   */
  it('ChairRow con headline: la conclusión cita la frase, el docente y la última reseña', () => {
    renderSheet(
      facts({
        chairs: [
          chair({
            chairId: 'c1',
            chairName: 'Pérez',
            reviewCount: 42,
            leadTeacherName: 'Martín Pérez',
            lastReviewedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
            headline: {
              itemCode: 'CHAIR_CLASSES_HELD',
              optionValue: 1,
              percent: 88,
              respondents: 42,
            },
          }),
        ],
      }),
    );

    expect(
      screen.getByText(
        'La cátedra Pérez dictó casi todas sus clases: lo dice el 88 % de sus 42 reseñas.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/a cargo de Martín Pérez · última reseña hace 2 meses/i),
    ).toBeInTheDocument();
  });

  /**
   * US-138 E1: sin headline (bajo el piso, o publicada sin respuestas de conducta), la fila dice
   * cuántas reseñas junta y que todavía no hay conclusión, nunca "publica" ni "piso".
   */
  it('US-138 E1: ChairRow sin headline dice cuántas reseñas junta y que todavía no hay conclusión', () => {
    renderSheet(
      facts({
        chairs: [chair({ chairId: 'c2', chairName: 'Paz', reviewCount: 3, isPublished: false })],
      }),
    );

    expect(screen.getByText('3 reseñas, todavía sin conclusiones.')).toBeInTheDocument();
    expect(screen.queryByText(/publica|piso/i)).not.toBeInTheDocument();
  });

  /** El denominador de la conclusión pluraliza: "1 reseña" y no "1 reseñas". */
  it('la conclusión pluraliza el denominador: "1 reseña" cuando respondents es 1', () => {
    renderSheet(
      facts({
        chairs: [
          chair({
            chairId: 'c5',
            chairName: 'Ibáñez',
            reviewCount: 10,
            headline: {
              itemCode: 'CHAIR_ANSWERS_OUTSIDE_CLASS',
              optionValue: 1,
              percent: 100,
              respondents: 1,
            },
          }),
        ],
      }),
    );

    expect(screen.getByText(/de sus 1 reseña\.$/)).toBeInTheDocument();
  });

  /** Sin docente a cargo, la fila dice solo la fecha de la última reseña. */
  it('ChairRow sin docente: la fila dice solo la fecha, sin "a cargo de"', () => {
    renderSheet(
      facts({
        chairs: [
          chair({
            chairId: 'c3',
            chairName: 'Ruiz',
            reviewCount: 15,
            leadTeacherName: null,
            lastReviewedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          }),
        ],
      }),
    );

    expect(screen.getByText(/^última reseña hace 1 mes$/i)).toBeInTheDocument();
    expect(screen.queryByText(/a cargo de/i)).not.toBeInTheDocument();
  });

  /**
   * Las cátedras sin ninguna reseña se pliegan en una sola línea, en vez de listar veinte filas
   * idénticas de "sin reseñas todavía".
   */
  it('las cátedras sin ninguna reseña se pliegan en una sola línea al final', () => {
    renderSheet(
      facts({
        chairs: [
          chair({ chairId: 'c1', chairName: 'Pérez', reviewCount: 50 }),
          chair({ chairId: 'c2', chairName: 'Sin Voces 1', reviewCount: 0, isPublished: false }),
          chair({ chairId: 'c3', chairName: 'Sin Voces 2', reviewCount: 0, isPublished: false }),
          chair({ chairId: 'c4', chairName: 'Sin Voces 3', reviewCount: 0, isPublished: false }),
        ],
      }),
    );

    expect(screen.getByRole('link', { name: /pérez/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /sin voces/i })).not.toBeInTheDocument();
    expect(screen.getByText('3 cátedras más')).toBeInTheDocument();
    expect(screen.getByText('sin reseñas todavía')).toBeInTheDocument();
  });

  it('el plegado usa el singular cuando es una sola cátedra sin reseñas', () => {
    renderSheet(
      facts({
        chairs: [
          chair({ chairId: 'c1', chairName: 'Pérez', reviewCount: 50 }),
          chair({ chairId: 'c2', chairName: 'Sin Voces', reviewCount: 0, isPublished: false }),
        ],
      }),
    );

    expect(screen.getByText('1 cátedra más')).toBeInTheDocument();
  });

  /**
   * Ficha SC-007, "lo que no muestra nunca": ninguna cátedra se remarca como "mejor" entre las que
   * se comparan; solo se ordenan por voces.
   */
  it('ninguna cátedra se remarca como "mejor" entre las que se comparan', () => {
    const { container } = render(
      <SubjectFactsSheet
        facts={facts({
          chairs: [
            chair({ chairId: 'c1', chairName: 'Pérez', reviewCount: 80 }),
            chair({ chairId: 'c2', chairName: 'Ruiz', reviewCount: 31 }),
          ],
        })}
      />,
    );

    expect(container.textContent).not.toMatch(/mejor|recomendad|top|★/i);
  });
});
