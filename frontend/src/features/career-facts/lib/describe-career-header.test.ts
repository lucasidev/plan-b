import { describe, expect, it } from 'vitest';
import type { OfficialFact } from '@/components/facts';
import {
  careerSustentoSentence,
  cohortGraduationCount,
  describeSubjectReviewsDot,
  yearLabel,
} from './describe-career-header';

function fact(
  overrides: Partial<OfficialFact> & Pick<OfficialFact, 'field' | 'status'>,
): OfficialFact {
  return {
    id: 'fact-1',
    subjectId: 'career-1',
    value: null,
    unit: null,
    period: null,
    sourceName: 'Sitio institucional',
    sourceUrl: 'https://example.edu.ar',
    derivationRuleId: null,
    note: null,
    relievedAt: '2026-09-07T12:00:00Z',
    ...overrides,
  };
}

describe('careerSustentoSentence', () => {
  it('sin ningún dato oficial, no arma ninguna oración', () => {
    expect(careerSustentoSentence(new Map())).toBeNull();
  });

  it('con solo dura en el papel publicado, arma esa única oración', () => {
    const byField = new Map([
      [
        'paper_duration',
        fact({
          field: 'paper_duration',
          status: 'Published',
          value: '2 años y medio',
          unit: 'years',
        }),
      ],
    ]);

    expect(careerSustentoSentence(byField)).toBe('Dura 2 años y medio en el papel.');
  });

  it('cuando la duración real está NotPublished, suma esa oración', () => {
    const byField = new Map([
      [
        'paper_duration',
        fact({
          field: 'paper_duration',
          status: 'Published',
          value: '2 años y medio',
          unit: 'years',
        }),
      ],
      ['real_duration', fact({ field: 'real_duration', status: 'NotPublished' })],
    ]);

    expect(careerSustentoSentence(byField)).toBe(
      'Dura 2 años y medio en el papel. En la realidad, ninguna fuente lo publica.',
    );
  });

  it('con la duración real Published, no suma esa oración (no es el hecho de que nadie la publique)', () => {
    const byField = new Map([
      [
        'real_duration',
        fact({ field: 'real_duration', status: 'Published', value: '2 años', unit: 'years' }),
      ],
    ]);

    expect(careerSustentoSentence(byField)).toBeNull();
  });

  it('con el egreso por cohorte Derived, suma la oración con el paréntesis', () => {
    const byField = new Map([
      [
        'cohort_graduation',
        fact({ field: 'cohort_graduation', status: 'Derived', value: '21,4 %', unit: 'percent' }),
      ],
    ]);

    expect(careerSustentoSentence(byField)).toBe(
      'De cada 100 que entran, egresan 21 (derivado de la institución entera).',
    );
  });

  it('con el egreso por cohorte Published, suma la oración sin el paréntesis', () => {
    const byField = new Map([
      [
        'cohort_graduation',
        fact({ field: 'cohort_graduation', status: 'Published', value: '21,4 %', unit: 'percent' }),
      ],
    ]);

    expect(careerSustentoSentence(byField)).toBe('De cada 100 que entran, egresan 21.');
  });

  it('con el egreso por cohorte sin valor parseable, no suma esa oración', () => {
    const byField = new Map([
      ['cohort_graduation', fact({ field: 'cohort_graduation', status: 'NotPublished' })],
    ]);

    expect(careerSustentoSentence(byField)).toBeNull();
  });

  it('las tres oraciones juntas, en orden', () => {
    const byField = new Map([
      [
        'paper_duration',
        fact({
          field: 'paper_duration',
          status: 'Published',
          value: '2 años y medio',
          unit: 'years',
        }),
      ],
      ['real_duration', fact({ field: 'real_duration', status: 'NotPublished' })],
      [
        'cohort_graduation',
        fact({ field: 'cohort_graduation', status: 'Derived', value: '21,4 %', unit: 'percent' }),
      ],
    ]);

    expect(careerSustentoSentence(byField)).toBe(
      'Dura 2 años y medio en el papel. En la realidad, ninguna fuente lo publica. De cada 100 que entran, egresan 21 (derivado de la institución entera).',
    );
  });
});

describe('cohortGraduationCount', () => {
  it('parsea un valor con coma decimal y símbolo de porcentaje, redondeado', () => {
    expect(
      cohortGraduationCount(
        fact({ field: 'cohort_graduation', status: 'Derived', value: '21,4 %' }),
      ),
    ).toBe(21);
  });

  it('parsea un valor con punto decimal', () => {
    expect(
      cohortGraduationCount(fact({ field: 'cohort_graduation', status: 'Derived', value: '21.4' })),
    ).toBe(21);
  });

  it('redondea hacia arriba cuando corresponde', () => {
    expect(
      cohortGraduationCount(
        fact({ field: 'cohort_graduation', status: 'Derived', value: '21,6 %' }),
      ),
    ).toBe(22);
  });

  it('sin valor, es null', () => {
    expect(
      cohortGraduationCount(fact({ field: 'cohort_graduation', status: 'NotPublished' })),
    ).toBeNull();
  });

  it('con un valor que no parsea como número, es null', () => {
    expect(
      cohortGraduationCount(
        fact({ field: 'cohort_graduation', status: 'Published', value: 'no numérico' }),
      ),
    ).toBeNull();
  });
});

describe('yearLabel', () => {
  it('los primeros seis años tienen ordinal en español', () => {
    expect(yearLabel(1)).toBe('Primer año');
    expect(yearLabel(2)).toBe('Segundo año');
    expect(yearLabel(3)).toBe('Tercer año');
    expect(yearLabel(4)).toBe('Cuarto año');
    expect(yearLabel(5)).toBe('Quinto año');
    expect(yearLabel(6)).toBe('Sexto año');
  });

  it('más allá del sexto, usa el número en vez de inventar un ordinal', () => {
    expect(yearLabel(7)).toBe('7º año');
  });
});

describe('describeSubjectReviewsDot', () => {
  it('singular de reseña y de cátedra', () => {
    expect(describeSubjectReviewsDot({ reviewCount: 1, chairCount: 1 })).toBe(
      '1 reseña · 1 cátedra',
    );
  });

  it('plural de reseñas y de cátedras', () => {
    expect(describeSubjectReviewsDot({ reviewCount: 28, chairCount: 3 })).toBe(
      '28 reseñas · 3 cátedras',
    );
  });
});
