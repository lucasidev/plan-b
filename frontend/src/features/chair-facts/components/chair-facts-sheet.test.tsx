import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ChairFacts } from '../types';
import { ChairFactsSheet } from './chair-facts-sheet';

function facts(over: Partial<ChairFacts> = {}): ChairFacts {
  return {
    chairId: 'chair-1',
    chairName: 'Pérez',
    subjectId: 'subject-1',
    subjectName: 'Análisis Matemático II',
    subjectCode: '211',
    leadTeacherName: null,
    leadTeacherId: null,
    isPublished: true,
    reviewCount: 37,
    reviewsMissingToPublish: 0,
    span: { fromYear: 2023, toYear: 2026, lastReviewedAt: null },
    fame: {
      itemsAgreeing: 3,
      items: [
        {
          code: 'CHAIR_CLASSES_HELD',
          text: '¿Se dictaron las clases?',
          negativeLabel: 'Faltaron muchas',
          percent: 80,
          total: 37,
        },
        {
          code: 'CHAIR_ANSWERS_IN_CLASS',
          text: '¿Contestaba las preguntas que le hacían en clase?',
          negativeLabel: 'Casi nunca',
          percent: 85,
          total: 37,
        },
        {
          code: 'CHAIR_PRACTICE_MATCHES_THEORY',
          text: '¿El práctico daba lo mismo que el teórico?',
          negativeLabel: 'Eran dos materias distintas',
          percent: 90,
          total: 37,
        },
      ],
    },
    chairConduct: [],
    studentExperience: [],
    completion: null,
    contrasts: [],
    hasDemoCorpusVoices: false,
    ...over,
  };
}

describe('ChairFactsSheet', () => {
  /**
   * SC-002: la línea de sustento cuenta reseñas (no voces) y dice el rango de años, con
   * "hace cuánto es la última" al final. Sin eso, una cátedra con titular cambiado en 2025 y
   * última reseña de 2023 se lee igual que una activa.
   */
  it('SC-002: con rango de años, la identidad dice "N reseñas, de X a Y · lo último es de..."', () => {
    render(
      <ChairFactsSheet
        facts={facts({
          reviewCount: 37,
          span: {
            fromYear: 2023,
            toYear: 2026,
            lastReviewedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          },
        })}
      />,
    );

    expect(
      screen.getByText('37 reseñas, de 2023 a 2026 · lo último es de hace 2 meses'),
    ).toBeInTheDocument();
    expect(screen.queryByText(/\bvoces\b/i)).not.toBeInTheDocument();
  });

  /** Con un solo año, dice "de {año}" una sola vez, sin "a {año}" repetido. */
  it('SC-002: con un solo año, dice "de X" sin repetirlo como rango', () => {
    render(
      <ChairFactsSheet
        facts={facts({
          reviewCount: 12,
          span: { fromYear: 2026, toYear: 2026, lastReviewedAt: null },
        })}
      />,
    );

    expect(screen.getByText('12 reseñas, de 2026')).toBeInTheDocument();
  });

  /**
   * US-131 N2: ninguna proporción se publica sin su "de N" al lado. La fama enuncia el porcentaje
   * de cada frase que converge ("el 80 %"); tiene que poder verificarse sin bajar al detalle, y
   * eso incluye saber sobre cuántas voces sale ese porcentaje ahí mismo, no en otro bloque de la
   * misma ficha.
   */
  it('cada hecho de la fama dice sobre cuántas voces sale, no solo el porcentaje', () => {
    render(<ChairFactsSheet facts={facts()} />);

    const heading = screen.getByText('Los hechos que la marcan');
    const section = heading.closest('section');
    expect(section).not.toBeNull();

    // Pegado al mismo porcentaje, no en cualquier parte de la sección: las tres frases traen su
    // propio "de N" en su propio <li>, así que un regex separado para "de \d+" matchea a las tres
    // a la vez y le rompe a getByText la unicidad que pide.
    expect(within(section as HTMLElement).getByText(/80 % de \d+/)).toBeInTheDocument();
  });

  /**
   * SC-002, estado "cargada, sin voces" (US-136 E1): sin reseñas, la ficha dice que arranca vacía
   * y que se puede ser la primera persona en reseñarla. Nunca un 0 %: con `isPublished` en false
   * ninguno de los bloques de conteos se monta.
   */
  it('US-136 E1: sin voces, la ficha dice que arranca vacía y nunca un 0 %', () => {
    render(
      <ChairFactsSheet
        facts={facts({ isPublished: false, reviewCount: 0, reviewsMissingToPublish: 10 })}
      />,
    );

    expect(screen.getByText('Todavía nadie reseñó cómo es cursar acá.')).toBeInTheDocument();
    expect(screen.getByText('Podés ser la primera persona en hacerlo.')).toBeInTheDocument();
    expect(screen.queryByText(/0 %/)).not.toBeInTheDocument();
  });

  /**
   * SC-002, estado "bajo el piso" (US-136 E2, US-138 E3): tiene reseñas pero no llega a 10, la
   * ficha dice cuántas junta y cuántas faltan, sin adelantar moda ni distribución.
   */
  it('US-136 E2: bajo el piso, dice cuántas junta y cuántas faltan sin adelantar conteos', () => {
    render(
      <ChairFactsSheet
        facts={facts({ isPublished: false, reviewCount: 3, reviewsMissingToPublish: 7 })}
      />,
    );

    expect(screen.getByText('Junta 3 reseñas: con 7 más se publica.')).toBeInTheDocument();
    expect(screen.getByText(/hasta las 10 no se muestran los conteos/i)).toBeInTheDocument();
    expect(screen.queryByText(/qué hizo la cátedra/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/de cada 10 que la cursan/i)).not.toBeInTheDocument();
  });

  /**
   * US-131 N1 y US-129 E1: "qué hizo la cátedra" (conducta, atribuible a esta cátedra puntual) y
   * "qué les pasó a los que cursaron" (vivencia) son bloques separados, cada uno con su propio
   * "de N"; el denominador de una frase no se completa con las voces de otra frase de la misma
   * cursada.
   */
  it('US-131 N1: cada bloque lleva su propio "de N", uno no se completa con el otro', () => {
    render(
      <ChairFactsSheet
        facts={facts({
          chairConduct: [
            {
              code: 'CHAIR_CLASSES_HELD',
              text: '¿Se dictaron las clases?',
              modeLabel: 'Faltaron muchas',
              modePercent: 41,
              modeIsNegative: true,
              total: 37,
              distribution: [
                { label: 'Casi todas', percent: 27, isNegative: false },
                { label: 'Faltaron algunas', percent: 32, isNegative: false },
                { label: 'Faltaron muchas', percent: 41, isNegative: true },
              ],
            },
          ],
          studentExperience: [
            {
              code: 'STUDENT_COULD_ASK',
              text: '¿Podías preguntar sin quedar mal?',
              modeLabel: 'No',
              modePercent: 66,
              modeIsNegative: true,
              total: 34,
              distribution: [
                { label: 'Sí', percent: 34, isNegative: false },
                { label: 'No', percent: 66, isNegative: true },
              ],
            },
          ],
        })}
      />,
    );

    const conduct = screen.getByText('Qué hizo la cátedra').closest('section');
    const experience = screen.getByText('Qué les pasó a los que cursaron').closest('section');
    expect(conduct).not.toBeNull();
    expect(experience).not.toBeNull();

    expect(within(conduct as HTMLElement).getByText(/de 37/)).toBeInTheDocument();
    expect(within(experience as HTMLElement).getByText(/de 34/)).toBeInTheDocument();
    // El "de N" de una frase no aparece adentro del bloque de la otra.
    expect(within(conduct as HTMLElement).queryByText(/de 34/)).not.toBeInTheDocument();
    expect(within(experience as HTMLElement).queryByText(/de 37/)).not.toBeInTheDocument();
  });

  /**
   * SC-002, estado "sin base para comparar": si es la única cátedra de su materia, no hay
   * contraste que mostrar contra hermanas.
   */
  it('ficha SC-002, "sin base para comparar": sin hermanas, no hay contraste', () => {
    render(<ChairFactsSheet facts={facts({ contrasts: [] })} />);

    expect(screen.queryByText(/comparada con las otras cátedras de/i)).not.toBeInTheDocument();
  });

  /**
   * US-131: el contraste contra las cátedras hermanas también lleva su propio "de N" en cada
   * lado (acá y en las otras), nunca un porcentaje solo.
   */
  it('US-131: el contraste contra hermanas lleva su "de N" en cada lado', () => {
    render(
      <ChairFactsSheet
        facts={facts({
          contrasts: [
            {
              itemCode: 'CHAIR_CLASSES_HELD',
              itemText: '¿Se dictaron las clases?',
              negativeLabel: 'Faltaron muchas',
              herePercent: 56,
              hereTotal: 37,
              siblingsPercent: 14,
              siblingsTotal: 61,
            },
          ],
        })}
      />,
    );

    expect(screen.getByText(/comparada con las otras cátedras de/i)).toBeInTheDocument();
    expect(screen.getByText(/de 37 y 61/)).toBeInTheDocument();
  });

  /**
   * V06 (recorrido de Valentina): el nombre del titular lleva a su ficha de docente, no queda
   * como texto muerto.
   */
  it('V06: el nombre del titular es un link a su ficha de docente', () => {
    render(
      <ChairFactsSheet
        facts={facts({ leadTeacherName: 'Martín Pérez', leadTeacherId: 'teacher-1' })}
      />,
    );

    const link = screen.getByRole('link', { name: 'Martín Pérez' });
    expect(link).toHaveAttribute('href', '/teachers/teacher-1');
  });

  /**
   * V06, caso defensivo: un titular sin id cargado (no debería pasar en régimen normal, la
   * cátedra siempre resuelve el id junto con el nombre) se sigue leyendo como texto, sin un link
   * roto a `/teachers/null`.
   */
  it('V06: sin id de titular, el nombre se lee como texto y no arma un link roto', () => {
    render(
      <ChairFactsSheet facts={facts({ leadTeacherName: 'Martín Pérez', leadTeacherId: null })} />,
    );

    expect(screen.getByText(/a cargo de martín pérez/i)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Martín Pérez' })).not.toBeInTheDocument();
  });

  /**
   * Auditoría R6: la ficha no puede publicar voces del corpus de demostración sin decirlo, colgadas
   * de una cátedra e institución con nombre real.
   */
  it('avisa cuando las voces contadas son del corpus de demostración', () => {
    render(<ChairFactsSheet facts={facts({ hasDemoCorpusVoices: true })} />);

    expect(screen.getByText(/estas voces son de prueba/i)).toBeInTheDocument();
  });

  it('no avisa nada cuando las voces contadas no son del corpus de demostración', () => {
    render(<ChairFactsSheet facts={facts({ hasDemoCorpusVoices: false })} />);

    expect(screen.queryByText(/son de prueba/i)).not.toBeInTheDocument();
  });

  /**
   * US-148 E1: la tasa de finalización es agregada; ninguna reseña muestra cómo terminó nadie.
   */
  it('US-148 E1: la finalización es agregada, nunca el desenlace de una persona', () => {
    render(
      <ChairFactsSheet facts={facts({ completion: { outOfTen: 7, reaching: 7, total: 10 } })} />,
    );

    expect(screen.getByText(/de cada 10 que la cursan, llegan 7/i)).toBeInTheDocument();
    expect(
      screen.getByText(/ninguna reseña muestra cómo terminó nadie: esto es el conteo/i),
    ).toBeInTheDocument();
  });
});
