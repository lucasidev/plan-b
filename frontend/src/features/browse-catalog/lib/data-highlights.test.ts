import { describe, expect, it } from 'vitest';
import type { SubjectOfficialFacts } from '@/components/facts/official-facts.server';
import type { OfficialFact } from '@/components/facts/types';
import type { CareerCoverage, University } from '../types';
import {
  computeDataHighlights,
  type DataHighlight,
  type DataHighlightsInput,
  parseNumericValue,
} from './data-highlights';

/**
 * ADR-0096: Explorar interpreta los datos oficiales por institución y por carrera, un hecho de un
 * solo dato con su fuente, nunca un compuesto. Cada test mira el hecho que le corresponde por su
 * `id`, no toda la lista, para no acoplarse al orden de las otras cuatro líneas.
 */

function university(overrides: Partial<University>): University {
  return { id: 'uni-id', name: 'Universidad', slug: 'universidad', ...overrides };
}

function career(overrides: Partial<CareerCoverage>): CareerCoverage {
  return {
    careerId: 'career-id',
    careerName: 'Carrera',
    universityId: 'uni-id',
    universityName: 'Universidad',
    isOfficial: true,
    hasOfficialData: false,
    voiceCount: 0,
    hasReviewsBelowFloor: false,
    totalSubjects: 0,
    coveredSubjects: 0,
    canonicalGroupName: null,
    ...overrides,
  };
}

function fact(overrides: Partial<OfficialFact>): OfficialFact {
  return {
    id: 'fact-id',
    subjectId: 'uni-id',
    field: 'students',
    status: 'Published',
    value: '100',
    unit: 'count',
    period: '2023',
    sourceName: 'Fuente',
    sourceUrl: 'https://example.edu.ar',
    derivationRuleId: null,
    note: null,
    relievedAt: '2026-09-01T00:00:00Z',
    ...overrides,
  };
}

function subjectFacts(subjectId: string, facts: OfficialFact[]): SubjectOfficialFacts {
  return { subjectId, facts };
}

const EMPTY_INPUT: DataHighlightsInput = {
  universities: [],
  careers: [],
  institutionFacts: [],
  offeringFacts: [],
};

/** El hecho con ese id, o un error si `computeDataHighlights` no lo trajo (nunca debería pasar: son cinco fijos). */
function pick(input: Partial<DataHighlightsInput>, id: string): DataHighlight {
  const found = computeDataHighlights({ ...EMPTY_INPUT, ...input }).find((h) => h.id === id);
  if (!found) throw new Error(`highlight no encontrado: ${id}`);
  return found;
}

describe('parseNumericValue', () => {
  it('separador de miles es-AR: "108.986" es 108986, no 108,986', () => {
    expect(parseNumericValue('108.986')).toBe(108986);
  });

  it('miles y decimales juntos: "1.234,5" es 1234.5', () => {
    expect(parseNumericValue('1.234,5')).toBe(1234.5);
  });

  it('porcentaje con coma decimal: "53,7 %" es 53.7', () => {
    expect(parseNumericValue('53,7 %')).toBe(53.7);
  });

  it('un entero sin separadores parsea igual', () => {
    expect(parseNumericValue('21')).toBe(21);
  });

  it('null no parsea', () => {
    expect(parseNumericValue(null)).toBeNull();
  });

  it('texto no numérico no parsea', () => {
    expect(parseNumericValue('no informado')).toBeNull();
  });
});

describe('computeDataHighlights: la universidad más elegida', () => {
  const unsta = university({ id: 'unsta', name: 'UNSTA', slug: 'unsta' });
  const unt = university({ id: 'unt', name: 'UNT', slug: 'unt' });
  const uspt = university({ id: 'uspt', name: 'San Pablo-T', slug: 'san-pablo-t' });

  it('elige la de mayor students Published, con link a su ficha, su fuente y su período', () => {
    const result = pick(
      {
        universities: [unsta, unt],
        institutionFacts: [
          subjectFacts('unsta', [fact({ subjectId: 'unsta', value: '7660', period: '2023' })]),
          subjectFacts('unt', [
            fact({ subjectId: 'unt', value: '78964', period: '2023', sourceName: 'SPU, Anuario' }),
          ]),
        ],
      },
      'most-chosen-university',
    );

    expect(result.facts[0]).toEqual({
      text: 'UNT: 78.964 estudiantes',
      href: '/universities/unt/careers',
      tier: 'primary',
      sourceName: 'SPU, Anuario',
      period: '2023',
    });
  });

  /** Distingue "no informa" (NotPublished, con nota) de "no lo relevamos" (sin ningún hecho): silencio para la segunda. */
  it('una universidad sin ningún hecho de students no aparece ni como ganadora ni como quien no informa', () => {
    const result = pick(
      {
        universities: [unsta, unt, uspt],
        institutionFacts: [
          subjectFacts('unsta', [fact({ subjectId: 'unsta', value: '7660' })]),
          subjectFacts('unt', [fact({ subjectId: 'unt', value: '78964' })]),
          // uspt: sin ningún hecho de "students" en absoluto (no cargado todavía, no NotPublished).
        ],
      },
      'most-chosen-university',
    );

    expect(result.facts.some((f) => f.text.includes('San Pablo-T'))).toBe(false);
  });

  it('quien no informa (NotPublished) aparece debajo, con su nota tal cual, sin link, con su fuente', () => {
    const result = pick(
      {
        universities: [unsta, unt],
        institutionFacts: [
          subjectFacts('unsta', [fact({ subjectId: 'unsta', value: '7660' })]),
          subjectFacts('unt', [
            fact({
              subjectId: 'unt',
              status: 'NotPublished',
              value: null,
              sourceName: 'SPU, Anuario',
              note: 'El anuario no abre por Facultad Regional: toda la UTN tiene 108986 estudiantes en 2023.',
            }),
          ]),
        ],
      },
      'most-chosen-university',
    );

    expect(result.facts).toContainEqual({
      text: 'UNT: El anuario no abre por Facultad Regional: toda la UTN tiene 108986 estudiantes en 2023.',
      href: null,
      tier: 'secondary',
      sourceName: 'SPU, Anuario',
      period: '2023',
    });
  });

  it('sin ninguna institución con students Published, lo dice sin fabricar una fuente', () => {
    const result = pick(
      {
        universities: [unsta],
        institutionFacts: [
          subjectFacts('unsta', [
            fact({ subjectId: 'unsta', status: 'NotPublished', value: null, note: 'No informó.' }),
          ]),
        ],
      },
      'most-chosen-university',
    );

    expect(result.facts[0]).toEqual({
      text: 'Ninguna institución publica cuántos estudiantes tiene.',
      href: null,
      tier: 'primary',
    });
    expect(result.facts[1].text).toBe('UNSTA: No informó.');
  });

  /** El estado no puede ni romper ni desaparecer en silencio: cae al mismo mensaje que "nadie publica". */
  it('un Published con value null (dato roto) no rompe y no desaparece en silencio', () => {
    const result = pick(
      {
        universities: [unsta],
        institutionFacts: [subjectFacts('unsta', [fact({ subjectId: 'unsta', value: null })])],
      },
      'most-chosen-university',
    );

    expect(result.facts[0].text).toBe('Ninguna institución publica cuántos estudiantes tiene.');
  });

  it('un Published con texto no numérico ("no informado") no rompe y no desaparece en silencio', () => {
    const result = pick(
      {
        universities: [unsta],
        institutionFacts: [
          subjectFacts('unsta', [fact({ subjectId: 'unsta', value: 'no informado' })]),
        ],
      },
      'most-chosen-university',
    );

    expect(result.facts[0].text).toBe('Ninguna institución publica cuántos estudiantes tiene.');
  });

  it('dos instituciones empatadas en students: las dos son tier primary, alfabético', () => {
    const result = pick(
      {
        universities: [unt, unsta],
        institutionFacts: [
          subjectFacts('unsta', [fact({ subjectId: 'unsta', value: '10000' })]),
          subjectFacts('unt', [fact({ subjectId: 'unt', value: '10000' })]),
        ],
      },
      'most-chosen-university',
    );

    expect(result.facts.map((f) => f.text)).toEqual([
      'UNSTA: 10.000 estudiantes',
      'UNT: 10.000 estudiantes',
    ]);
    expect(result.facts.every((f) => f.tier === 'primary')).toBe(true);
  });
});

describe('computeDataHighlights: la carrera más ofrecida', () => {
  it('empate: lista todos los grupos con el máximo de instituciones distintas, todos tier primary, alfabético', () => {
    const careers = [
      career({
        careerId: 'a1',
        universityId: 'u1',
        universityName: 'UNSTA',
        canonicalGroupName: 'Zoología',
      }),
      career({
        careerId: 'a2',
        universityId: 'u2',
        universityName: 'UNT',
        canonicalGroupName: 'Zoología',
      }),
      career({
        careerId: 'b1',
        universityId: 'u1',
        universityName: 'UNSTA',
        canonicalGroupName: 'Agronomía',
      }),
      career({
        careerId: 'b2',
        universityId: 'u3',
        universityName: 'UTN',
        canonicalGroupName: 'Agronomía',
      }),
      // Tercer grupo, con una sola institución: no debe entrar al empate.
      career({
        careerId: 'c1',
        universityId: 'u1',
        universityName: 'UNSTA',
        canonicalGroupName: 'Solitaria',
      }),
    ];

    const result = pick({ careers }, 'most-offered-career');

    expect(result.facts.map((f) => f.text)).toEqual(['Agronomía: en', 'Zoología: en']);
    expect(result.facts.every((f) => f.tier === 'primary')).toBe(true);
    expect(
      result.facts.every((f) => f.sourceName === 'Guía de carreras universitarias (SIU)'),
    ).toBe(true);
    expect(result.facts[0].links).toEqual([
      { label: 'UNSTA', href: '/careers/b1' },
      { label: 'UTN', href: '/careers/b2' },
    ]);
  });

  /**
   * Empate real del catálogo (CanonicalCareerGroupings.cs): Abogacía, Medicina y "Tecnicatura o
   * técnico en programación" están en tres instituciones cada una; Contador Público solo en dos,
   * no entra al empate.
   */
  it('el empate real del seed: Abogacía, Medicina y la Tecnicatura empatan en 3 instituciones', () => {
    function offering(
      group: string,
      universityId: string,
      universityName: string,
      careerId: string,
    ): CareerCoverage {
      return career({ careerId, universityId, universityName, canonicalGroupName: group });
    }

    const careers = [
      offering('Abogacía', 'unsta', 'UNSTA', 'abogacia-unsta'),
      offering('Abogacía', 'unt', 'UNT', 'abogacia-unt'),
      offering('Abogacía', 'uspt', 'San Pablo-T', 'abogacia-uspt'),
      offering('Medicina', 'unsta', 'UNSTA', 'medicina-unsta'),
      offering('Medicina', 'unt', 'UNT', 'medicina-unt'),
      offering('Medicina', 'uspt', 'San Pablo-T', 'medicina-uspt'),
      offering('Tecnicatura o técnico en programación', 'unsta', 'UNSTA', 'tecnicatura-unsta'),
      offering('Tecnicatura o técnico en programación', 'unt', 'UNT', 'tecnicatura-unt'),
      offering('Tecnicatura o técnico en programación', 'utn-frt', 'UTN-FRT', 'tecnicatura-utnfrt'),
      offering('Contador Público', 'unsta', 'UNSTA', 'cp-unsta'),
      offering('Contador Público', 'unt', 'UNT', 'cp-unt'),
    ];

    const result = pick({ careers }, 'most-offered-career');

    expect(result.facts.map((f) => f.text)).toEqual([
      'Abogacía: en',
      'Medicina: en',
      'Tecnicatura o técnico en programación: en',
    ]);
    expect(result.facts[0].links?.map((l) => l.label)).toEqual(['San Pablo-T', 'UNSTA', 'UNT']);
  });

  it('sin ninguna carrera dictada en más de una institución, lo dice sin inventar un link', () => {
    const careers = [career({ careerId: 'sola', canonicalGroupName: null })];

    const result = pick({ careers }, 'most-offered-career');

    expect(result.facts).toEqual([
      {
        text: 'Todavía ninguna carrera se dicta en más de una institución.',
        href: null,
        tier: 'primary',
        sourceName: 'Guía de carreras universitarias (SIU)',
      },
    ]);
  });
});

describe('computeDataHighlights: la carrera con mejor tiempo de salida', () => {
  it('ninguna oferta con cohort_graduation: lo dice, sin fuente que citar', () => {
    const result = pick(
      {
        careers: [career({ careerId: 'x' })],
        offeringFacts: [subjectFacts('x', [fact({ subjectId: 'x', field: 'paper_duration' })])],
      },
      'best-graduation-rate',
    );

    expect(result.facts).toEqual([
      {
        text: 'Ninguna fuente publica el egreso por cohorte de ninguna carrera.',
        href: null,
        tier: 'primary',
      },
    ]);
  });

  it('elige la mayor entre Published y Derived, dice que es derivado de la institución entera y linkea a la regla, con el período visible', () => {
    const unsta = career({
      careerId: 'unsta-tudcs',
      careerName: 'Tecnicatura en Desarrollo y Calidad de Software',
      universityName: 'UNSTA',
      canonicalGroupName: 'Tecnicatura o técnico en programación',
    });
    const unt = career({
      careerId: 'unt-prog',
      careerName: 'Programador Universitario',
      universityName: 'UNT',
      canonicalGroupName: 'Tecnicatura o técnico en programación',
    });
    const utnFrt = career({
      careerId: 'utn-frt-prog',
      careerName: 'Tecnicatura en Programación',
      universityName: 'UTN-FRT',
      canonicalGroupName: 'Tecnicatura o técnico en programación',
    });
    const cohortPeriod =
      'egresados 2022 sobre nuevos inscriptos 2019 (d = 3 años, institución entera)';

    const result = pick(
      {
        careers: [unsta, unt, utnFrt],
        offeringFacts: [
          subjectFacts('unsta-tudcs', [
            fact({
              subjectId: 'unsta-tudcs',
              field: 'cohort_graduation',
              status: 'Derived',
              value: '21,4 %',
              period: cohortPeriod,
              sourceName: 'SPU, Anuario de Estadísticas Universitarias 2022',
              derivationRuleId: 'graduation-flow-proxy',
            }),
          ]),
          subjectFacts('unt-prog', [
            fact({
              subjectId: 'unt-prog',
              field: 'cohort_graduation',
              status: 'Derived',
              value: '15,4 %',
              period: cohortPeriod,
              derivationRuleId: 'graduation-flow-proxy',
            }),
          ]),
          subjectFacts('utn-frt-prog', [
            fact({
              subjectId: 'utn-frt-prog',
              field: 'cohort_graduation',
              status: 'Derived',
              value: '16,1 %',
              period: cohortPeriod,
              derivationRuleId: 'graduation-flow-proxy',
            }),
          ]),
        ],
      },
      'best-graduation-rate',
    );

    expect(result.facts[0]).toEqual({
      text: 'Tecnicatura en Desarrollo y Calidad de Software, UNSTA: egresan 21 de cada 100',
      href: '/careers/unsta-tudcs',
      tier: 'primary',
      sourceName: 'SPU, Anuario de Estadísticas Universitarias 2022',
      period: cohortPeriod,
      derivedTag: {
        label: 'egreso por cohorte, derivado de la institución entera',
        href: '/method#graduation-flow-proxy',
      },
    });
    expect(result.facts[1]).toEqual({
      text: 'Entre las 3 ofertas con el dato.',
      href: null,
      tier: 'secondary',
    });
    // Las otras del mismo grupo, ordenadas de mayor a menor: UTN-FRT (16) antes que UNT (15).
    expect(result.facts[2]).toMatchObject({
      text: '16 de cada 100 en UTN-FRT',
      href: '/careers/utn-frt-prog',
      tier: 'secondary',
      derivedTag: {
        label: 'egreso por cohorte, derivado de la institución entera',
        href: '/method#graduation-flow-proxy',
      },
    });
    expect(result.facts[3]).toMatchObject({ text: '15 de cada 100 en UNT', tier: 'secondary' });
  });
});

describe('computeDataHighlights: la universidad donde más alumnos avanzan', () => {
  const unsta = university({ id: 'unsta', name: 'UNSTA', slug: 'unsta' });
  const unt = university({ id: 'unt', name: 'UNT', slug: 'unt' });
  const utnFrt = university({ id: 'utn-frt', name: 'UTN-FRT', slug: 'utn-frt' });

  it('el período "toda la UTN" se muestra tal cual, y la atribución aplica también a la línea del máximo', () => {
    const result = pick(
      {
        universities: [unsta, unt, utnFrt],
        institutionFacts: [
          subjectFacts('unsta', [
            fact({
              subjectId: 'unsta',
              field: 'advancing_share',
              value: '53,7 %',
              unit: 'percent',
              period: '2023',
            }),
          ]),
          subjectFacts('unt', [
            fact({
              subjectId: 'unt',
              field: 'advancing_share',
              value: '36,2 %',
              unit: 'percent',
              period: '2023',
            }),
          ]),
          subjectFacts('utn-frt', [
            fact({
              subjectId: 'utn-frt',
              field: 'advancing_share',
              value: '45,4 %',
              unit: 'percent',
              period: '2023, toda la UTN',
              note: 'Toda la UTN: el anuario no abre por Facultad Regional.',
            }),
          ]),
        ],
      },
      'most-advancing-university',
    );

    expect(result.facts[0]).toEqual({
      text: 'UNSTA: 53,7 % de reinscriptos con dos o más materias aprobadas',
      href: '/universities/unsta/careers',
      tier: 'primary',
      sourceName: 'Fuente',
      period: '2023',
    });
    // Orden descendente por valor: UTN-FRT (45,4) antes que UNT (36,2). La atribución usa el
    // período tal cual porque el hecho trae nota (no es solo de esa institución).
    expect(result.facts[1]).toEqual({
      text: '45,4 % en 2023, toda la UTN',
      href: '/universities/utn-frt/careers',
      tier: 'secondary',
      sourceName: 'Fuente',
      period: '2023, toda la UTN',
    });
    expect(result.facts[2]).toEqual({
      text: '36,2 % en UNT',
      href: '/universities/unt/careers',
      tier: 'secondary',
      sourceName: 'Fuente',
      period: '2023',
    });
  });

  it('cuando la ganadora es la que trae la nota, la línea del máximo también usa la atribución del período', () => {
    const result = pick(
      {
        universities: [unsta, utnFrt],
        institutionFacts: [
          subjectFacts('unsta', [
            fact({ subjectId: 'unsta', field: 'advancing_share', value: '10 %', unit: 'percent' }),
          ]),
          subjectFacts('utn-frt', [
            fact({
              subjectId: 'utn-frt',
              field: 'advancing_share',
              value: '90 %',
              unit: 'percent',
              period: '2023, toda la UTN',
              note: 'Toda la UTN: el anuario no abre por Facultad Regional.',
            }),
          ]),
        ],
      },
      'most-advancing-university',
    );

    expect(result.facts[0].text).toBe(
      '2023, toda la UTN: 90 % de reinscriptos con dos o más materias aprobadas',
    );
    expect(result.facts[0].href).toBe('/universities/utn-frt/careers');
  });

  it('una nota sin período no se pierde: se muestra en el lugar del período', () => {
    const result = pick(
      {
        universities: [unsta],
        institutionFacts: [
          subjectFacts('unsta', [
            fact({
              subjectId: 'unsta',
              field: 'advancing_share',
              value: '53,7 %',
              unit: 'percent',
              period: null,
              note: 'Cifra provisoria: el anuario todavía no cerró el ciclo lectivo.',
            }),
          ]),
        ],
      },
      'most-advancing-university',
    );

    // Sin período, la atribución sigue siendo el nombre (la nota no reemplaza al período: solo lo
    // hace cuando los dos existen), pero la nota no desaparece: viaja en el lugar del período.
    expect(result.facts[0].text).toBe(
      'UNSTA: 53,7 % de reinscriptos con dos o más materias aprobadas',
    );
    expect(result.facts[0].period).toBe(
      'Cifra provisoria: el anuario todavía no cerró el ciclo lectivo.',
    );
  });

  it('sin ninguna institución con advancing_share Published, lo dice sin fuente que citar', () => {
    const result = pick({ universities: [unsta] }, 'most-advancing-university');

    expect(result.facts).toEqual([
      {
        text: 'Ninguna institución publica su proporción de reinscriptos con dos o más materias aprobadas.',
        href: null,
        tier: 'primary',
      },
    ]);
  });
});

describe('computeDataHighlights: la evaluación de la entidad auditora', () => {
  it('con una sola institución evaluada, dice que es la única y cita la fuente real del hecho', () => {
    const unt = university({ id: 'unt', name: 'UNT', slug: 'unt' });

    const result = pick(
      {
        universities: [unt],
        institutionFacts: [
          subjectFacts('unt', [
            fact({
              subjectId: 'unt',
              field: 'institutional_evaluation',
              value: 'Evaluación externa CONEAU 2021',
              unit: null,
              period: '2021',
              sourceName: 'Portal de transparencia UNT',
            }),
          ]),
        ],
      },
      'institutional-evaluation',
    );

    expect(result.facts).toEqual([
      {
        text: 'La única con evaluación institucional de CONEAU publicada: UNT (2021)',
        href: '/universities/unt/careers',
        tier: 'primary',
        sourceName: 'Portal de transparencia UNT',
      },
    ]);
  });

  it('con varias instituciones evaluadas, todas son tier primary (sin "mejor"), cada una con su propia fuente', () => {
    const unt = university({ id: 'unt', name: 'UNT', slug: 'unt' });
    const unsta = university({ id: 'unsta', name: 'UNSTA', slug: 'unsta' });

    const result = pick(
      {
        universities: [unt, unsta],
        institutionFacts: [
          subjectFacts('unt', [
            fact({
              subjectId: 'unt',
              field: 'institutional_evaluation',
              value: 'CONEAU 2021',
              period: '2021',
              sourceName: 'Portal de transparencia UNT',
            }),
          ]),
          subjectFacts('unsta', [
            fact({
              subjectId: 'unsta',
              field: 'institutional_evaluation',
              value: 'CONEAU 2020',
              period: '2020',
              sourceName: 'Portal de transparencia UNSTA',
            }),
          ]),
        ],
      },
      'institutional-evaluation',
    );

    expect(result.facts.map((f) => f.text)).toEqual(['UNSTA (2020)', 'UNT (2021)']);
    expect(result.facts.every((f) => f.tier === 'primary')).toBe(true);
    expect(result.facts.map((f) => f.sourceName)).toEqual([
      'Portal de transparencia UNSTA',
      'Portal de transparencia UNT',
    ]);
    expect(result.facts.every((f) => !f.text.toLowerCase().includes('mejor'))).toBe(true);
  });

  it('sin ninguna institución evaluada, lo dice sin fuente que citar', () => {
    const result = pick(
      { universities: [university({ id: 'unsta' })] },
      'institutional-evaluation',
    );

    expect(result.facts).toEqual([
      {
        text: 'Ninguna institución tiene evaluación institucional de CONEAU publicada.',
        href: null,
        tier: 'primary',
      },
    ]);
  });
});

/**
 * ADR-0096, maqueta aprobada: `summary` arma la tira compacta (nombre corto + aclaración + fuente
 * ya unida) a partir de lo que cada función ya calculó para `facts`, sin tocar su lógica de
 * ganador/empate (con sus propios tests arriba, intactos).
 */
describe('computeDataHighlights: summary (la tira compacta de Explorar)', () => {
  const unsta = university({
    id: 'unsta',
    name: 'Universidad del Norte Santo Tomás de Aquino',
    slug: 'unsta',
  });
  const unt = university({ id: 'unt', name: 'Universidad Nacional de Tucumán', slug: 'unt' });
  const utnFrt = university({
    id: 'utn-frt',
    name: 'Universidad Tecnológica Nacional - Facultad Regional Tucumán',
    slug: 'utn-frt',
  });

  it('la universidad más elegida: nombre corto (por slug) como link, con el número y el período en la aclaración', () => {
    const result = pick(
      {
        universities: [unsta, unt],
        institutionFacts: [
          subjectFacts('unsta', [fact({ subjectId: 'unsta', value: '7660', period: '2023' })]),
          subjectFacts('unt', [
            fact({ subjectId: 'unt', value: '78964', period: '2023', sourceName: 'SPU, Anuario' }),
          ]),
        ],
      },
      'most-chosen-university',
    );

    expect(result.summary).toEqual({
      name: 'UNT',
      href: '/universities/unt/careers',
      annotation: '78.964 estudiantes en 2023',
      source: 'SPU, Anuario · 2023',
    });
  });

  it('empate: el nombre corto une las ganadoras en español y no hay un único link', () => {
    const result = pick(
      {
        universities: [unt, unsta],
        institutionFacts: [
          subjectFacts('unsta', [fact({ subjectId: 'unsta', value: '10000' })]),
          subjectFacts('unt', [fact({ subjectId: 'unt', value: '10000' })]),
        ],
      },
      'most-chosen-university',
    );

    expect(result.summary.name).toBe('UNSTA y UNT');
    expect(result.summary.href).toBeNull();
  });

  it('sin ninguna institución con el dato: el nombre repite el mensaje del vacío, sin aclaración', () => {
    const result = pick({ universities: [unsta] }, 'most-chosen-university');

    expect(result.summary).toEqual({
      name: 'Ninguna institución publica cuántos estudiantes tiene.',
      href: null,
      annotation: '',
      source: '',
    });
  });

  it('la carrera más ofrecida: el empate real del seed junta los tres nombres y cuenta las instituciones', () => {
    function offering(
      group: string,
      universityId: string,
      universityName: string,
      careerId: string,
    ): CareerCoverage {
      return career({ careerId, universityId, universityName, canonicalGroupName: group });
    }

    const careers = [
      offering('Abogacía', 'unsta', 'UNSTA', 'abogacia-unsta'),
      offering('Abogacía', 'unt', 'UNT', 'abogacia-unt'),
      offering('Abogacía', 'uspt', 'San Pablo-T', 'abogacia-uspt'),
      offering('Medicina', 'unsta', 'UNSTA', 'medicina-unsta'),
      offering('Medicina', 'unt', 'UNT', 'medicina-unt'),
      offering('Medicina', 'uspt', 'San Pablo-T', 'medicina-uspt'),
      offering('Tecnicatura o técnico en programación', 'unsta', 'UNSTA', 'tecnicatura-unsta'),
      offering('Tecnicatura o técnico en programación', 'unt', 'UNT', 'tecnicatura-unt'),
      offering('Tecnicatura o técnico en programación', 'utn-frt', 'UTN-FRT', 'tecnicatura-utnfrt'),
      offering('Contador Público', 'unsta', 'UNSTA', 'cp-unsta'),
      offering('Contador Público', 'unt', 'UNT', 'cp-unt'),
    ];

    const result = pick({ careers }, 'most-offered-career');

    expect(result.summary).toEqual({
      name: 'Abogacía, Medicina y Tecnicatura o técnico en programación',
      href: null,
      annotation: 'en 3 instituciones cada una',
      source: 'Guía de carreras universitarias (SIU)',
    });
  });

  it('la carrera con mejor tiempo de salida: usa el nombre corto de la institución cuando la tenemos en `universities`', () => {
    const tudcs = career({
      careerId: 'unsta-tudcs',
      careerName: 'Tecnicatura en Desarrollo y Calidad de Software',
      universityId: 'unsta',
      universityName: 'Universidad del Norte Santo Tomás de Aquino',
    });

    const result = pick(
      {
        universities: [unsta],
        careers: [tudcs],
        offeringFacts: [
          subjectFacts('unsta-tudcs', [
            fact({
              subjectId: 'unsta-tudcs',
              field: 'cohort_graduation',
              status: 'Derived',
              value: '21,4 %',
              sourceName: 'SPU, Anuario 2022',
            }),
          ]),
        ],
      },
      'best-graduation-rate',
    );

    expect(result.summary.name).toBe('Tecnicatura en Desarrollo y Calidad de Software, UNSTA');
    expect(result.summary.annotation).toBe('egresan 21 de cada 100');
  });

  it('la carrera con mejor tiempo de salida: sin la universidad en `universities`, cae al nombre tal cual llegó', () => {
    const tudcs = career({
      careerId: 'unsta-tudcs',
      careerName: 'Tecnicatura en Desarrollo y Calidad de Software',
      universityId: 'unsta',
      universityName: 'UNSTA',
    });

    const result = pick(
      {
        careers: [tudcs],
        offeringFacts: [
          subjectFacts('unsta-tudcs', [
            fact({ subjectId: 'unsta-tudcs', field: 'cohort_graduation', value: '21,4 %' }),
          ]),
        ],
      },
      'best-graduation-rate',
    );

    expect(result.summary.name).toBe('Tecnicatura en Desarrollo y Calidad de Software, UNSTA');
  });

  it('la universidad donde más alumnos avanzan: la aclaración dice "avanza dos materias o más por año"', () => {
    const result = pick(
      {
        universities: [unsta],
        institutionFacts: [
          subjectFacts('unsta', [
            fact({
              subjectId: 'unsta',
              field: 'advancing_share',
              value: '53,7 %',
              unit: 'percent',
            }),
          ]),
        ],
      },
      'most-advancing-university',
    );

    expect(result.summary.annotation).toBe('53,7 % avanza dos materias o más por año');
    expect(result.summary.name).toBe('UNSTA');
  });

  it('la universidad donde más alumnos avanzan: con nota "toda la UTN", el nombre usa el período, no el nombre corto', () => {
    const result = pick(
      {
        universities: [utnFrt],
        institutionFacts: [
          subjectFacts('utn-frt', [
            fact({
              subjectId: 'utn-frt',
              field: 'advancing_share',
              value: '45,4 %',
              unit: 'percent',
              period: '2023, toda la UTN',
              note: 'Toda la UTN: el anuario no abre por Facultad Regional.',
            }),
          ]),
        ],
      },
      'most-advancing-university',
    );

    expect(result.summary.name).toBe('2023, toda la UTN');
  });

  it('la evaluación de la entidad auditora: con una sola, la aclaración es fija ("acreditaciones al día")', () => {
    const result = pick(
      {
        universities: [unt],
        institutionFacts: [
          subjectFacts('unt', [
            fact({
              subjectId: 'unt',
              field: 'institutional_evaluation',
              value: 'Evaluación externa CONEAU 2021',
              unit: null,
              period: '2021',
              sourceName: 'Portal de transparencia UNT',
            }),
          ]),
        ],
      },
      'institutional-evaluation',
    );

    expect(result.summary).toEqual({
      name: 'UNT',
      href: '/universities/unt/careers',
      annotation: 'acreditaciones al día',
      source: 'Portal de transparencia UNT · 2021',
    });
  });

  it('la evaluación de la entidad auditora: con varias, el nombre las une y no hay un único link', () => {
    const result = pick(
      {
        universities: [unt, unsta],
        institutionFacts: [
          subjectFacts('unt', [
            fact({ subjectId: 'unt', field: 'institutional_evaluation', value: 'CONEAU 2021' }),
          ]),
          subjectFacts('unsta', [
            fact({ subjectId: 'unsta', field: 'institutional_evaluation', value: 'CONEAU 2020' }),
          ]),
        ],
      },
      'institutional-evaluation',
    );

    expect(result.summary.name).toBe('UNSTA y UNT');
    expect(result.summary.href).toBeNull();
  });
});
