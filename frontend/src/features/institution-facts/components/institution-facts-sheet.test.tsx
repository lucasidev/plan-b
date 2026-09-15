import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { OfficialFact } from '@/components/facts';
import type { Career, CareerCoverage } from '@/features/browse-catalog';
import { InstitutionFactsSheet } from './institution-facts-sheet';

function career(overrides: Partial<Career> & { id: string }): Career {
  return {
    universityId: 'unsta',
    name: 'Carrera',
    slug: 'carrera',
    isOfficial: true,
    academicUnitName: 'Facultad de Ingeniería',
    ...overrides,
  };
}

function coverage(overrides: Partial<CareerCoverage> & { careerId: string }): CareerCoverage {
  return {
    careerName: 'Carrera',
    universityId: 'unsta',
    universityName: 'UNSTA',
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

function fact(
  overrides: Partial<OfficialFact> & Pick<OfficialFact, 'id' | 'field' | 'status'>,
): OfficialFact {
  return {
    subjectId: 'unsta',
    value: null,
    unit: null,
    period: null,
    sourceName: 'SPU, Anuario de Estadísticas Universitarias',
    sourceUrl: 'https://spu.example/anuario',
    derivationRuleId: null,
    note: null,
    relievedAt: '2026-09-07T12:00:00Z',
    ...overrides,
  };
}

function renderSheet(
  overrides: {
    universityName?: string;
    careers?: Career[];
    officialFacts?: OfficialFact[];
    coverage?: CareerCoverage[];
  } = {},
) {
  return render(
    <InstitutionFactsSheet
      universityName={overrides.universityName ?? 'Universidad del Norte Santo Tomás de Aquino'}
      careers={overrides.careers ?? []}
      officialFacts={overrides.officialFacts ?? []}
      coverage={overrides.coverage ?? []}
    />,
  );
}

describe('InstitutionFactsSheet', () => {
  it('muestra el nombre de la institución como título', () => {
    renderSheet();

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Universidad del Norte Santo Tomás de Aquino',
      }),
    ).toBeInTheDocument();
  });

  it('el eyebrow muestra el tipo de institución cuando está relevado', () => {
    renderSheet({
      officialFacts: [
        fact({
          id: 'f1',
          field: 'institution_type',
          status: 'Published',
          value: 'Privada; 7660 estudiantes en 2023',
        }),
      ],
    });

    expect(screen.getByText('Universidad · privada')).toBeInTheDocument();
  });

  it('sin institution_type relevado, el eyebrow dice solo "Universidad"', () => {
    renderSheet();

    expect(screen.getByText('Universidad')).toBeInTheDocument();
  });

  /** La línea bajo el h1: cuántas carreras en cuántas facultades, más cuántas están medidas. */
  it('el h-sub dice cuántas carreras en cuántas facultades y la carrera medida', () => {
    renderSheet({
      careers: [
        career({ id: 'a', name: 'Tecnicatura en Desarrollo y Calidad de Software' }),
        career({ id: 'b', name: 'Abogacía', academicUnitName: 'Facultad de Ciencias Jurídicas' }),
      ],
      coverage: [
        coverage({
          careerId: 'a',
          careerName: 'Tecnicatura en Desarrollo y Calidad de Software',
          voiceCount: 137,
        }),
      ],
    });

    expect(
      screen.getByText(
        '2 carreras en 2 facultades. Una carrera medida: la Tecnicatura en Desarrollo y Calidad de Software.',
      ),
    ).toBeInTheDocument();
  });

  it('sin ninguna carrera medida, el h-sub no suma esa segunda oración', () => {
    renderSheet({
      careers: [career({ id: 'a' })],
    });

    expect(screen.getByText('1 carrera en 1 facultad.')).toBeInTheDocument();
  });

  it('sin ninguna carrera cargada, no dibuja el h-sub', () => {
    renderSheet();

    expect(screen.queryByText(/carreras? en/)).not.toBeInTheDocument();
  });

  it('estudiantes y egresados publicados muestran su valor con su período', () => {
    renderSheet({
      officialFacts: [
        fact({
          id: 'f1',
          field: 'students',
          status: 'Published',
          value: '7660',
          unit: 'count',
          period: '2023',
        }),
        fact({
          id: 'f2',
          field: 'graduates',
          status: 'Published',
          value: '488',
          unit: 'count',
          period: '2023',
        }),
      ],
    });

    expect(screen.getByText('7.660')).toBeInTheDocument();
    expect(screen.getByText('estudiantes en 2023')).toBeInTheDocument();
    expect(screen.getByText('488')).toBeInTheDocument();
    expect(screen.getByText('egresados en 2023')).toBeInTheDocument();
  });

  /** Un dato no publicado (o derivado, o sin relevar) no se dibuja como celda de la tira: no está publicado. */
  it('estudiantes no publicado no se dibuja en la tira', () => {
    renderSheet({
      officialFacts: [fact({ id: 'f1', field: 'students', status: 'NotPublished' })],
    });

    expect(screen.queryByText(/estudiantes en/)).not.toBeInTheDocument();
  });

  it('carreras con reseñas: con denominador 0, la celda no se dibuja', () => {
    renderSheet();

    expect(screen.queryByText(/carreras? con reseñas/i)).not.toBeInTheDocument();
  });

  /** El conteo usa `hasReviews` (voiceCount > 0 o hasReviewsBelowFloor), no solo voiceCount. */
  it('carreras con reseñas: cuenta también la que junta reseñas bajo el piso todavía', () => {
    renderSheet({
      careers: [career({ id: 'a' }), career({ id: 'b' })],
      coverage: [
        coverage({ careerId: 'a', voiceCount: 137 }),
        coverage({ careerId: 'b', voiceCount: 0, hasReviewsBelowFloor: true }),
      ],
    });

    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('carreras con reseñas')).toBeInTheDocument();
  });

  it('transparencia: sin ningún campo del checklist cargado, la celda no se dibuja', () => {
    renderSheet();

    expect(screen.queryByText(/datos de transparencia/i)).not.toBeInTheDocument();
  });

  it('transparencia: cuenta los publicados contra los campos efectivamente cargados', () => {
    renderSheet({
      officialFacts: [
        fact({ id: 'f1', field: 'minutes_published', status: 'Published', value: 'Publicado' }),
        fact({ id: 'f2', field: 'budget_published', status: 'NotPublished', note: 'No publica.' }),
      ],
    });

    expect(screen.getByText('1 de 2')).toBeInTheDocument();
    expect(
      screen.getByText('datos de transparencia que la institución publica'),
    ).toBeInTheDocument();
  });

  it('lista las carreras agrupadas por facultad en el cuerpo', () => {
    renderSheet({
      careers: [career({ id: 'a', name: 'Tecnicatura en Desarrollo y Calidad de Software' })],
    });

    expect(screen.getByText('Facultad de Ingeniería')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Tecnicatura en Desarrollo y Calidad de Software' }),
    ).toBeInTheDocument();
  });

  /** Columna derecha, en orden: por dónde empezar, identidad institucional, transparencia. */
  it('la columna derecha compone por dónde empezar, identidad institucional y transparencia, en ese orden', () => {
    const { container } = renderSheet({
      careers: [career({ id: 'a', name: 'Tecnicatura en Desarrollo y Calidad de Software' })],
      coverage: [
        coverage({
          careerId: 'a',
          careerName: 'Tecnicatura en Desarrollo y Calidad de Software',
          voiceCount: 137,
        }),
      ],
      officialFacts: [
        fact({
          id: 'f1',
          field: 'institution_type',
          status: 'Published',
          value: 'Privada; 7660 estudiantes en 2023',
          sourceName: 'SPU',
          period: '2023',
        }),
      ],
    });

    const aside = container.querySelector('.pb-dossier > aside');
    if (!aside) throw new Error('no se encontró la columna derecha');
    const eyebrows = within(aside as HTMLElement)
      .getAllByText(/^(Por dónde empezar|Identidad institucional|Transparencia)/)
      .map((el) => el.textContent);
    expect(eyebrows).toEqual([
      'Por dónde empezar',
      'Identidad institucional',
      'Transparencia · verificado a fuente pública',
    ]);
  });

  it('identidad institucional: sin institution_type publicado, no dibuja el bloque', () => {
    const { container } = renderSheet();

    expect(container.querySelector('.pb-dossier')).toBeInTheDocument();
    expect(screen.queryByText('Identidad institucional')).not.toBeInTheDocument();
  });

  it('identidad institucional: con institution_type publicado, muestra el valor completo y la fuente', () => {
    renderSheet({
      officialFacts: [
        fact({
          id: 'f1',
          field: 'institution_type',
          status: 'Published',
          value: 'Privada; 7660 estudiantes en 2023; 401 egresados en 2022',
          sourceName: 'SPU, Anuario de Estadísticas Universitarias',
          period: '2023',
        }),
      ],
    });

    expect(
      screen.getByText('Privada; 7660 estudiantes en 2023; 401 egresados en 2022'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('SPU, Anuario de Estadísticas Universitarias · 2023'),
    ).toBeInTheDocument();
  });

  it('no publica ningún puntaje ni escala', () => {
    const { container } = renderSheet({
      careers: [career({ id: 'a' })],
    });

    expect(container.textContent).not.toMatch(/★|puntaje|promedio de|\/ 5/i);
  });

  it('no ofrece ningún pie para reseñar: el botón de escribir reseña vive en el topbar', () => {
    renderSheet();

    expect(screen.queryByText(/¿Estudiás acá\?/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /reseñá tu cursada/i })).not.toBeInTheDocument();
  });
});
