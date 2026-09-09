import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { OfficialFact } from '@/components/facts';
import type { CareerComparison, CareerComparisonOffering } from '../types';
import { CareerComparisonView } from './career-comparison-view';

// La pantalla monta el topbar del catálogo, que monta el buscador global (router + QueryClient).
// Mismo patrón que career-facts-sheet.test.tsx.
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

function fact(overrides: Partial<OfficialFact> & Pick<OfficialFact, 'id' | 'field'>): OfficialFact {
  return {
    status: 'Published',
    value: null,
    unit: null,
    period: null,
    sourceName: 'Sitio institucional',
    sourceUrl: 'https://example.edu.ar',
    derivationRuleId: null,
    note: null,
    relievedAt: '2026-09-08T00:00:00Z',
    ...overrides,
  };
}

function sixFacts(prefix: string): OfficialFact[] {
  return [
    fact({ id: `${prefix}-paper`, field: 'paper_duration', value: '3', unit: 'years' }),
    fact({
      id: `${prefix}-real`,
      field: 'real_duration',
      status: 'NotPublished',
      note: 'No publicado por ninguna fuente.',
    }),
    fact({
      id: `${prefix}-cohort`,
      field: 'cohort_graduation',
      status: 'Derived',
      value: '20',
      unit: 'percent',
    }),
    fact({ id: `${prefix}-plan`, field: 'current_plan', value: 'Plan 2020' }),
    fact({
      id: `${prefix}-accred`,
      field: 'accreditation',
      status: 'NotApplicable',
      note: 'No aplica a esta oferta.',
    }),
    fact({ id: `${prefix}-admission`, field: 'admission_regime', value: 'Irrestricto' }),
  ];
}

function offering(
  overrides: Partial<CareerComparisonOffering> & { careerId: string },
): CareerComparisonOffering {
  return {
    careerName: 'Tecnicatura de prueba',
    universityId: `uni-${overrides.careerId}`,
    universityName: 'Universidad de prueba',
    academicUnitName: null,
    localityName: null,
    institutionKind: null,
    facts: sixFacts(overrides.careerId),
    ...overrides,
  };
}

function comparison(overrides: Partial<CareerComparison> = {}): CareerComparison {
  return {
    groupName: 'Tecnicatura o técnico en programación',
    cityLabel: 'San Miguel de Tucumán',
    isProvinceFallback: false,
    offerings: [],
    ...overrides,
  };
}

function renderView(data: CareerComparison) {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <CareerComparisonView comparison={data} />
    </QueryClientProvider>,
  );
}

describe('CareerComparisonView', () => {
  /** US-128 E1: las tres tarjetas lado a lado, cada una con sus propios datos oficiales. */
  it('muestra una tarjeta por institución con sus propios datos oficiales', () => {
    renderView(
      comparison({
        offerings: [
          offering({ careerId: 'unsta', universityName: 'UNSTA' }),
          offering({ careerId: 'unt', universityName: 'UNT' }),
          offering({ careerId: 'utn', universityName: 'UTN' }),
        ],
      }),
    );

    expect(screen.getByRole('link', { name: 'UNSTA' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'UNT' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'UTN' })).toBeInTheDocument();
    expect(screen.getAllByText('Dura en el papel')).toHaveLength(3);
  });

  /** US-128 E2: alfabético, nunca por cuál valor es "mejor". */
  it('ordena las tarjetas alfabéticamente por institución', () => {
    renderView(
      comparison({
        offerings: [
          offering({ careerId: 'utn', universityName: 'UTN' }),
          offering({ careerId: 'unsta', universityName: 'UNSTA' }),
          offering({ careerId: 'unt', universityName: 'UNT' }),
        ],
      }),
    );

    const names = screen
      .getAllByRole('link', { name: /^(UNSTA|UNT|UTN)$/ })
      .map((el) => el.textContent);
    expect(names).toEqual(['UNSTA', 'UNT', 'UTN']);
  });

  /** US-128 N1: ninguna tarjeta se marca como mejor, recomendada, ni lleva un ícono de ganador. */
  it('no marca ninguna institución como mejor ni publica un puntaje', () => {
    const { container } = renderView(
      comparison({
        offerings: [
          offering({ careerId: 'unsta', universityName: 'UNSTA' }),
          offering({ careerId: 'unt', universityName: 'UNT' }),
        ],
      }),
    );

    expect(container.textContent).not.toMatch(/mejor|recomendad|ganador|★|puntaje|\/ 5/i);
  });

  /** SC-008, edge case: una sola oferta cargada no se muestra como si fuera una comparación. */
  it('con una sola oferta dice que no hay con qué comparar todavía', () => {
    renderView(
      comparison({
        offerings: [offering({ careerId: 'unsta', universityName: 'UNSTA' })],
      }),
    );

    expect(screen.getByText('No hay con qué comparar todavía.')).toBeInTheDocument();
    expect(screen.getByText(/solo está cargada en UNSTA/)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'UNSTA' })).not.toBeInTheDocument();
  });

  /** SC-008, estados: una oferta sin relevamiento todavía lo dice, no deja un espacio en blanco. */
  it('una oferta sin datos oficiales todavía lo dice en vez de dejar la tarjeta en blanco', () => {
    renderView(
      comparison({
        offerings: [
          offering({ careerId: 'unsta', universityName: 'UNSTA' }),
          offering({ careerId: 'unt', universityName: 'UNT', facts: [] }),
        ],
      }),
    );

    expect(
      screen.getByText('Todavía no tenemos datos oficiales de esta oferta.'),
    ).toBeInTheDocument();
  });

  /**
   * Contrato de la tarea: "los mismos campos, con la misma forma, en todas las tarjetas. Si una
   * institución no tiene un dato, esa celda dice su estado; no se achica la tarjeta ni se corre
   * la grilla." Acá UNT no tiene "admission_regime" pero sí los otros cinco.
   */
  it('un campo puntual sin relevar muestra su estado, sin correr la grilla del resto', () => {
    const unt = offering({ careerId: 'unt', universityName: 'UNT' });
    unt.facts = unt.facts.filter((f) => f.field !== 'admission_regime');

    renderView(
      comparison({
        offerings: [offering({ careerId: 'unsta', universityName: 'UNSTA' }), unt],
      }),
    );

    // UNSTA sí tiene régimen de ingreso: sigue mostrando el valor.
    expect(screen.getByText('Irrestricto')).toBeInTheDocument();
    // UNT no lo tiene: la celda dice su estado, la etiqueta sigue ahí.
    expect(screen.getAllByText('Régimen de ingreso')).toHaveLength(2);
    expect(screen.getByText('Todavía no se relevó para esta oferta.')).toBeInTheDocument();
  });

  /** Cómo agrupa: sin localidad resuelta, cae a la provincia y lo dice, no finge una ciudad. */
  it('cuando cae a la provincia lo dice en el encabezado', () => {
    renderView(
      comparison({
        cityLabel: 'Tucumán',
        isProvinceFallback: true,
        offerings: [
          offering({ careerId: 'unsta', universityName: 'UNSTA' }),
          offering({ careerId: 'unt', universityName: 'UNT' }),
        ],
      }),
    );

    expect(screen.getByText(/provincia de Tucumán/)).toBeInTheDocument();
    expect(screen.getByText(/no pudimos confirmar la ciudad exacta/)).toBeInTheDocument();
  });

  /**
   * Decisión de producto del 2026-09-09: la comparación agrupa por aglomeración, no por localidad
   * suelta, pero eso no puede esconder dónde queda cada oferta puntual (UNSTA en Yerba Buena, UNT
   * en San Miguel de Tucumán, aunque el título compare "Gran San Miguel de Tucumán").
   */
  it('cada tarjeta dice su localidad real aunque el título compare la aglomeración', () => {
    renderView(
      comparison({
        cityLabel: 'Gran San Miguel de Tucumán',
        offerings: [
          offering({ careerId: 'unsta', universityName: 'UNSTA', localityName: 'Yerba Buena' }),
          offering({
            careerId: 'unt',
            universityName: 'UNT',
            localityName: 'San Miguel de Tucumán',
          }),
        ],
      }),
    );

    expect(screen.getByText(/Gran San Miguel de Tucumán/)).toBeInTheDocument();
    expect(screen.getByText('Yerba Buena')).toBeInTheDocument();
    expect(screen.getByText('San Miguel de Tucumán')).toBeInTheDocument();
  });

  /** Contrato de la tarea: el sesgo de un derivado se dice una vez arriba, no repetido por tarjeta. */
  it('la nota de "derivado" aparece una sola vez, no una por tarjeta', () => {
    renderView(
      comparison({
        offerings: [
          offering({ careerId: 'unsta', universityName: 'UNSTA' }),
          offering({ careerId: 'unt', universityName: 'UNT' }),
        ],
      }),
    );

    expect(screen.getAllByText(/es un cálculo con una regla propia/)).toHaveLength(1);
  });

  it('pública o privada se muestra cuando está relevado, sin inventarlo si no', () => {
    renderView(
      comparison({
        offerings: [
          offering({ careerId: 'unsta', universityName: 'UNSTA', institutionKind: 'Privada' }),
          offering({ careerId: 'unt', universityName: 'UNT', institutionKind: null }),
        ],
      }),
    );

    expect(screen.getByText('privada')).toBeInTheDocument();
  });
});
