import { describe, expect, it } from 'vitest';
import { officialFactCaption } from './official-fact-caption';
import type { OfficialFact } from './types';

function fact(overrides: Partial<OfficialFact> & Pick<OfficialFact, 'status'>): OfficialFact {
  return {
    id: 'fact-1',
    subjectId: 'career-1',
    field: 'paper_duration',
    value: null,
    unit: null,
    period: null,
    sourceName: 'Sitio UNSTA',
    sourceUrl: 'https://unsta.edu.ar',
    derivationRuleId: null,
    note: null,
    relievedAt: '2026-09-07T12:00:00Z',
    ...overrides,
  };
}

describe('officialFactCaption', () => {
  it('Derivado siempre es el literal fijo, nunca la nota del proxy', () => {
    const caption = officialFactCaption(
      fact({
        status: 'Derived',
        note: 'Proxy de flujo institucional, no una cohorte real de esta carrera.',
      }),
    );

    expect(caption).toBe('Derivado · la regla está en Método');
  });

  it('Publicado sin nota: la fuente con su período', () => {
    const caption = officialFactCaption(
      fact({ status: 'Published', sourceName: 'Sitio UNSTA', period: 'plan vigente' }),
    );

    expect(caption).toBe('Sitio UNSTA · plan vigente');
  });

  it('Publicado sin período: solo la fuente', () => {
    const caption = officialFactCaption(fact({ status: 'Published', period: null }));

    expect(caption).toBe('Sitio UNSTA');
  });

  /** Maqueta aprobada (V.career línea 511): la nota del plan vigente, después la fuente, separadas por un espacio porque la nota ya cierra en punto. */
  it('Publicado con nota que cierra en punto: nota, un espacio, la fuente', () => {
    const caption = officialFactCaption(
      fact({
        status: 'Published',
        note: '21 materias: 9 en primer año, 8 en segundo, 4 en tercero.',
        sourceName: 'Sitio UNSTA',
        period: '2018',
      }),
    );

    expect(caption).toBe(
      '21 materias: 9 en primer año, 8 en segundo, 4 en tercero. Sitio UNSTA · 2018',
    );
  });

  it('Publicado con nota que no cierra en punto: nota, " · ", la fuente', () => {
    const caption = officialFactCaption(
      fact({
        status: 'Published',
        note: 'Coincide con SIPES y con el plan de materias del catálogo',
        sourceName: 'SIPES',
        period: 'vigente',
      }),
    );

    expect(caption).toBe(
      'Coincide con SIPES y con el plan de materias del catálogo · SIPES · vigente',
    );
  });

  it('No publicado con nota: la nota', () => {
    const caption = officialFactCaption(
      fact({
        status: 'NotPublished',
        note: 'Ninguna fuente publica la duración real por carrera.',
      }),
    );

    expect(caption).toBe('Ninguna fuente publica la duración real por carrera.');
  });

  it('No publicado sin nota: la fuente con su período', () => {
    const caption = officialFactCaption(
      fact({ status: 'NotPublished', note: null, sourceName: 'SPU', period: '2023' }),
    );

    expect(caption).toBe('SPU · 2023');
  });

  it('No aplica con nota: la nota', () => {
    const caption = officialFactCaption(
      fact({
        status: 'NotApplicable',
        note: 'Las tecnicaturas no se acreditan: validez nacional por RM 2495/2018.',
      }),
    );

    expect(caption).toBe('Las tecnicaturas no se acreditan: validez nacional por RM 2495/2018.');
  });

  it('No aplica sin nota: la fuente con su período', () => {
    const caption = officialFactCaption(
      fact({ status: 'NotApplicable', note: null, sourceName: 'CONEAU', period: '2013, 2018' }),
    );

    expect(caption).toBe('CONEAU · 2013, 2018');
  });
});
