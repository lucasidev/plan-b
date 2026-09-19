import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { OfficialFact } from '@/components/facts';
import type { Career, CareerCoverage } from '@/features/browse-catalog';
import type { InstitutionProfile } from '@/features/manage-universities/profile-types';
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
    profile?: InstitutionProfile | null;
  } = {},
) {
  return render(
    <InstitutionFactsSheet
      universityName={overrides.universityName ?? 'Universidad del Norte Santo Tomás de Aquino'}
      careers={overrides.careers ?? []}
      officialFacts={overrides.officialFacts ?? []}
      coverage={overrides.coverage ?? []}
      profile={overrides.profile}
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

  /** US-235 E1: la identidad institucional cargada en backoffice se publica sin sesión. */
  it('muestra logo, sitio oficial y ubicación cuando el perfil los tiene', () => {
    renderSheet({
      profile: {
        universityId: '160c39b2-cf9a-4da8-9cd4-9eac3d11f70e',
        websiteUrl: 'https://universidad.edu.ar',
        address: 'Av. Central 100',
        province: 'Mendoza',
        localityId: '50021010',
        localityName: 'Godoy Cruz',
        logoVersion: 2,
        academicUnitCount: 1,
        careerCount: 2,
        planCount: 3,
        units: [],
      },
    });

    expect(screen.getByRole('presentation')).toHaveAttribute(
      'src',
      '/api/academic/universities/160c39b2-cf9a-4da8-9cd4-9eac3d11f70e/logo?v=2',
    );
    expect(screen.getByRole('link', { name: 'Sitio oficial' })).toHaveAttribute(
      'href',
      'https://universidad.edu.ar',
    );
    expect(screen.getByText('Av. Central 100 · Godoy Cruz · Mendoza')).toBeInTheDocument();
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

  /**
   * UTN-FRT y San Pablo-T no publican estudiantes/egresados, pero la celda no desaparece: dice
   * "No publicado" con el período del dato (nunca la nota, esa vive en el detalle).
   */
  it('estudiantes y egresados no publicados no desaparecen de la tira: dicen "No publicado" con el período', () => {
    renderSheet({
      officialFacts: [
        fact({ id: 'f1', field: 'students', status: 'NotPublished', period: '2023' }),
        fact({
          id: 'f2',
          field: 'graduates',
          status: 'NotPublished',
          period: '2020 a 2022',
          note: 'Las filas de San Pablo-T en el anuario están en cero: la institución no informó.',
        }),
      ],
    });

    expect(screen.getAllByText('No publicado')).toHaveLength(2);
    expect(screen.getByText('estudiantes en 2023')).toBeInTheDocument();
    expect(screen.getByText('egresados en 2020 a 2022')).toBeInTheDocument();
    // La nota no va en la etiqueta de la tira.
    expect(screen.queryByText(/la institución no informó/i)).not.toBeInTheDocument();
  });

  /** Sin ninguna afirmación cargada para el campo, la celda no se dibuja: no hay período que decir. */
  it('estudiantes sin ninguna afirmación cargada, la celda no se dibuja', () => {
    renderSheet();

    expect(screen.queryByText(/estudiantes en/)).not.toBeInTheDocument();
    expect(screen.queryByText('estudiantes')).not.toBeInTheDocument();
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

  it('identidad institucional: sin ninguna afirmación cargada, no dibuja el bloque', () => {
    const { container } = renderSheet();

    expect(container.querySelector('.pb-dossier')).toBeInTheDocument();
    expect(screen.queryByText('Identidad institucional')).not.toBeInTheDocument();
  });

  /**
   * San Pablo-T no publica institution_type, pero el bloque no desaparece: se lee como una fila
   * de datos oficiales de la carrera, con la pill fija y la nota debajo.
   */
  it('identidad institucional: con institution_type no publicado, muestra la pill fija y la nota', () => {
    renderSheet({
      officialFacts: [
        fact({
          id: 'f1',
          field: 'institution_type',
          status: 'NotPublished',
          period: '2020 a 2022',
          note: 'Las filas de San Pablo-T en el anuario 2020 a 2022 están en cero: la institución no informó.',
        }),
      ],
    });

    expect(screen.getByText('Identidad institucional')).toBeInTheDocument();
    expect(screen.getByText('No publicado por falta de datos')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Las filas de San Pablo-T en el anuario 2020 a 2022 están en cero: la institución no informó.',
      ),
    ).toBeInTheDocument();
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
