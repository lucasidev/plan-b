import { describe, expect, it } from 'vitest';
import type { OfficialFact } from '@/components/facts/types';
import {
  careerReviewsState,
  describeCareerCoverage,
  describeSubjectCoverage,
  describeUniversityCareerCount,
  describeUniversityReviewsPill,
  hasReviews,
  hasSomethingToRead,
  institutionTypeLabel,
  numberInWords,
  universityShortName,
} from './describe-career-coverage';

/**
 * US-222 (browse-catalog/stories/US-222-browse-what-there-is-to-study/scenarios.md) y la ficha de
 * SC-003: lo que cada entrada del catálogo dice antes del clic, sin que se lea como puntaje.
 */

describe('describeCareerCoverage', () => {
  /** US-222 E2: cada entrada trae sus voces y su cobertura, ninguna un puntaje ni una escala 1 a 5. */
  it('E2: con voces y cobertura, dice ambas separadas por punto medio, sin porcentaje', () => {
    const text = describeCareerCoverage({
      hasOfficialData: false,
      voiceCount: 412,
      hasReviewsBelowFloor: false,
      totalSubjects: 51,
      coveredSubjects: 23,
    });

    expect(text).toBe('412 voces · 23 de 51 materias');
    expect(text).not.toContain('%');
  });

  it('E2: la segunda entrada del ejemplo (96 voces, menor cobertura) no compara contra la primera', () => {
    const text = describeCareerCoverage({
      hasOfficialData: false,
      voiceCount: 96,
      hasReviewsBelowFloor: false,
      totalSubjects: 44,
      coveredSubjects: 10,
    });

    expect(text).toBe('96 voces · 10 de 44 materias');
  });

  it('una sola voz usa el singular, no "1 voces"', () => {
    expect(
      describeCareerCoverage({
        hasOfficialData: false,
        voiceCount: 1,
        hasReviewsBelowFloor: false,
        totalSubjects: 5,
        coveredSubjects: 1,
      }),
    ).toBe('1 voz · 1 de 5 materias');
  });

  /**
   * "Si tiene datos oficiales y si tiene voces" (Qué entra del hallazgo) son las dos señales de
   * "algo para leer": que la carrera ya tenga materias cargadas en su plan no alcanza sola, así
   * que sin ninguna de las dos sigue siendo el vacío, aunque el plan exista.
   */
  it('con materias cargadas pero sin datos oficiales ni voces, sigue siendo el vacío', () => {
    const text = describeCareerCoverage({
      hasOfficialData: false,
      voiceCount: 0,
      hasReviewsBelowFloor: false,
      totalSubjects: 21,
      coveredSubjects: 0,
    });

    expect(text).toBe('Todavía no tenemos nada para leer.');
  });

  /** Edge case de la ficha de SC-003: "cargada y todavía sin voces" no es un cero, se dice con palabras. */
  it('con datos oficiales pero sin voces, lo dice con palabras, nunca "0 voces" ni "0 %"', () => {
    const text = describeCareerCoverage({
      hasOfficialData: true,
      voiceCount: 0,
      hasReviewsBelowFloor: false,
      totalSubjects: 21,
      coveredSubjects: 0,
    });

    expect(text).toContain('sin voces todavía');
    expect(text).not.toMatch(/\b0\b/);
    expect(text).not.toContain('%');
  });

  /** "Si tiene datos oficiales" (Qué entra del hallazgo): viaja aparte de las voces, no las reemplaza. */
  it('con datos oficiales y sin voces, dice las dos cosas por separado', () => {
    const text = describeCareerCoverage({
      hasOfficialData: true,
      voiceCount: 0,
      hasReviewsBelowFloor: false,
      totalSubjects: 21,
      coveredSubjects: 0,
    });

    expect(text).toBe('Datos oficiales · sin voces todavía');
  });

  it('con datos oficiales y voces, antepone los datos oficiales', () => {
    const text = describeCareerCoverage({
      hasOfficialData: true,
      voiceCount: 13,
      hasReviewsBelowFloor: false,
      totalSubjects: 21,
      coveredSubjects: 1,
    });

    expect(text).toBe('Datos oficiales · 13 voces · 1 de 21 materias');
  });

  /**
   * "Una carrera sin datos ni voces sigue en la lista y dice que no tiene nada" (cómo sé que está
   * bien): el vacío se nombra, nunca un cero solo.
   */
  it('sin datos oficiales y sin voces: dice que no tiene nada, no un "0"', () => {
    const text = describeCareerCoverage({
      hasOfficialData: false,
      voiceCount: 0,
      hasReviewsBelowFloor: false,
      totalSubjects: 0,
      coveredSubjects: 0,
    });

    expect(
      hasSomethingToRead({
        hasOfficialData: false,
        voiceCount: 0,
        hasReviewsBelowFloor: false,
        totalSubjects: 0,
        coveredSubjects: 0,
      }),
    ).toBe(false);
    expect(text).toBe('Todavía no tenemos nada para leer.');
    expect(text).not.toMatch(/\d/);
  });

  it('voces sin ninguna materia cargada (defensivo): no divide contra un total en cero', () => {
    const text = describeCareerCoverage({
      hasOfficialData: false,
      voiceCount: 4,
      hasReviewsBelowFloor: false,
      totalSubjects: 0,
      coveredSubjects: 0,
    });

    expect(text).toBe('4 voces');
  });

  /**
   * El caso que corrige R6 (#486): una carrera con una sola cátedra bajo el piso no puede mostrar
   * su conteo crudo. "Hay reseñas trabajando" es información útil; cuántas son, no, mientras no
   * publiquen (ninguna cátedra cruzó el piso).
   */
  it('con reseñas cargadas bajo el piso y sin nada oficial, no muestra ningún número', () => {
    const text = describeCareerCoverage({
      hasOfficialData: false,
      voiceCount: 0,
      hasReviewsBelowFloor: true,
      totalSubjects: 21,
      coveredSubjects: 0,
    });

    expect(text).toBe('Hay reseñas cargándose: todavía sin datos publicables.');
    expect(text).not.toMatch(/\d/);
  });

  /**
   * La misma carrera bajo el piso no puede leerse igual que una sin ninguna reseña: son dos
   * mensajes de texto distintos, aunque ninguno lleve un número.
   */
  it('reseñas bajo el piso se distingue de no tener ninguna reseña, sin exponer el conteo', () => {
    const withActivity = describeCareerCoverage({
      hasOfficialData: false,
      voiceCount: 0,
      hasReviewsBelowFloor: true,
      totalSubjects: 21,
      coveredSubjects: 0,
    });
    const withNothing = describeCareerCoverage({
      hasOfficialData: false,
      voiceCount: 0,
      hasReviewsBelowFloor: false,
      totalSubjects: 21,
      coveredSubjects: 0,
    });

    expect(withActivity).not.toBe(withNothing);
  });

  it('con datos oficiales y reseñas bajo el piso, dice las dos cosas por separado, sin número', () => {
    const text = describeCareerCoverage({
      hasOfficialData: true,
      voiceCount: 0,
      hasReviewsBelowFloor: true,
      totalSubjects: 21,
      coveredSubjects: 0,
    });

    expect(text).toBe('Datos oficiales · todavía sin datos publicables');
  });
});

describe('hasSomethingToRead', () => {
  it('datos oficiales solos ya cuentan como algo para leer', () => {
    expect(
      hasSomethingToRead({
        hasOfficialData: true,
        voiceCount: 0,
        hasReviewsBelowFloor: false,
        totalSubjects: 0,
        coveredSubjects: 0,
      }),
    ).toBe(true);
  });

  it('voces solas ya cuentan como algo para leer', () => {
    expect(
      hasSomethingToRead({
        hasOfficialData: false,
        voiceCount: 1,
        hasReviewsBelowFloor: false,
        totalSubjects: 1,
        coveredSubjects: 0,
      }),
    ).toBe(true);
  });

  /** Reseñas bajo el piso todavía no publican nada: no alcanzan solas para "algo para leer". */
  it('reseñas bajo el piso, sin datos oficiales, no cuentan como algo para leer', () => {
    expect(
      hasSomethingToRead({
        hasOfficialData: false,
        voiceCount: 0,
        hasReviewsBelowFloor: true,
        totalSubjects: 1,
        coveredSubjects: 0,
      }),
    ).toBe(false);
  });
});

describe('describeUniversityCareerCount', () => {
  it('cuenta las carreras de la institución', () => {
    expect(describeUniversityCareerCount(12)).toBe('12 carreras');
  });

  it('una sola carrera usa el singular', () => {
    expect(describeUniversityCareerCount(1)).toBe('1 carrera');
  });

  it('sin ninguna carrera cargada: lo dice con palabras, no "0 carreras"', () => {
    expect(describeUniversityCareerCount(0)).toBe('Todavía sin carreras cargadas.');
  });
});

describe('describeUniversityReviewsPill', () => {
  it('con carreras que tienen reseñas, las cuenta', () => {
    expect(describeUniversityReviewsPill(4)).toBe('4 carreras con reseñas');
  });

  it('una sola carrera usa el singular', () => {
    expect(describeUniversityReviewsPill(1)).toBe('1 carrera con reseñas');
  });

  it('sin ninguna carrera con reseñas, lo dice con palabras, no "0 carreras"', () => {
    expect(describeUniversityReviewsPill(0)).toBe('sin reseñas todavía');
  });
});

describe('hasReviews', () => {
  it('voces publicadas cuentan como reseñas', () => {
    expect(hasReviews({ voiceCount: 3, hasReviewsBelowFloor: false })).toBe(true);
  });

  it('reseñas cargándose bajo el piso cuentan como reseñas, aunque no haya voces publicadas', () => {
    expect(hasReviews({ voiceCount: 0, hasReviewsBelowFloor: true })).toBe(true);
  });

  /** El bug que este test fija: un dato oficial solo (sin ninguna reseña) no es "con reseñas". */
  it('sin voces ni reseñas bajo el piso, no cuenta como reseñas, aunque haya datos oficiales', () => {
    expect(hasReviews({ voiceCount: 0, hasReviewsBelowFloor: false })).toBe(false);
  });
});

describe('careerReviewsState', () => {
  it('con voces publicadas, el estado es "reviewed" con el conteo real', () => {
    expect(careerReviewsState({ voiceCount: 3, hasReviewsBelowFloor: false })).toEqual({
      kind: 'reviewed',
      label: '3 reseñas',
    });
  });

  it('una sola voz usa el singular', () => {
    expect(careerReviewsState({ voiceCount: 1, hasReviewsBelowFloor: false })).toEqual({
      kind: 'reviewed',
      label: '1 reseña',
    });
  });

  it('sin voces pero con reseñas bajo el piso, el estado es "pending" (sin decir cuántas)', () => {
    expect(careerReviewsState({ voiceCount: 0, hasReviewsBelowFloor: true })).toEqual({
      kind: 'pending',
    });
  });

  it('sin voces ni reseñas bajo el piso, el estado es "none"', () => {
    expect(careerReviewsState({ voiceCount: 0, hasReviewsBelowFloor: false })).toEqual({
      kind: 'none',
    });
  });
});

describe('institutionTypeLabel', () => {
  function officialFact(overrides: Partial<OfficialFact>): OfficialFact {
    return {
      id: 'fact-id',
      subjectId: 'uni-id',
      field: 'institution_type',
      status: 'Published',
      value: 'Privada; 7479 estudiantes en 2022 y 7660 en 2023',
      unit: null,
      period: '2023',
      sourceName: 'Fuente',
      sourceUrl: 'https://example.edu.ar',
      derivationRuleId: null,
      note: null,
      relievedAt: '2026-09-01T00:00:00Z',
      ...overrides,
    };
  }

  it('extrae el primer segmento antes del ";" del valor Published', () => {
    expect(institutionTypeLabel(officialFact({}))).toBe('Privada');
  });

  it('sin ningún hecho, no hay tipo', () => {
    expect(institutionTypeLabel(undefined)).toBeNull();
  });

  it('con un hecho que no es Published (todavía no informa), no hay tipo', () => {
    expect(
      institutionTypeLabel(
        officialFact({ status: 'NotPublished', value: null, note: 'No informó.' }),
      ),
    ).toBeNull();
  });
});

describe('universityShortName', () => {
  it('el slug en mayúsculas, para un slug simple', () => {
    expect(universityShortName({ slug: 'unsta' })).toBe('UNSTA');
  });

  it('preserva el guion de un slug compuesto', () => {
    expect(universityShortName({ slug: 'utn-frt' })).toBe('UTN-FRT');
  });

  it('San Pablo-T: el slug "uspt" da "USPT"', () => {
    expect(universityShortName({ slug: 'uspt' })).toBe('USPT');
  });
});

describe('numberInWords', () => {
  it('cero a diez, en palabras', () => {
    expect(numberInWords(0)).toBe('cero');
    expect(numberInWords(3)).toBe('tres');
    expect(numberInWords(5)).toBe('cinco');
    expect(numberInWords(10)).toBe('diez');
  });

  it('más allá de la lista, el dígito tal cual', () => {
    expect(numberInWords(225)).toBe('225');
  });
});

describe('describeSubjectCoverage', () => {
  it('dice las reseñas y en cuántas cátedras, en esa forma (no "N cátedras" a secas)', () => {
    expect(describeSubjectCoverage({ reviewCount: 28, chairCount: 3 })).toBe(
      '28 reseñas en 3 cátedras',
    );
  });

  it('una sola cátedra y una sola reseña usan el singular', () => {
    expect(describeSubjectCoverage({ reviewCount: 1, chairCount: 1 })).toBe(
      '1 reseña en 1 cátedra',
    );
  });

  it('sin cobertura (undefined), dice "sin reseñas" en vez de "0 cátedras"', () => {
    expect(describeSubjectCoverage(undefined)).toBe('sin reseñas');
  });

  it('con reviewCount en cero, también dice "sin reseñas"', () => {
    expect(describeSubjectCoverage({ reviewCount: 0, chairCount: 0 })).toBe('sin reseñas');
  });
});
