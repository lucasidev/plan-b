import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { OfficialFact } from '@/components/facts';
import type { CareerFacts } from '../types';
import { CareerFactsSheet } from './career-facts-sheet';

// La ficha monta el topbar del catálogo, que a su vez monta el buscador global (router +
// QueryClient). Mismo patrón que landing-hero.test.tsx: se le dan los dos en vez de mockear el
// topbar entero, porque lo que se prueba acá es el contenido de la ficha.
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const BASE: CareerFacts = {
  careerId: 'career-1',
  careerName: 'Tecnicatura Universitaria en Desarrollo y Calidad de Software',
  universityName: 'Universidad del Norte Santo Tomás de Aquino',
  durationYears: null,
  totalSubjects: 21,
  coveredSubjects: 0,
  coveragePercent: 0,
  editorialNotes: [],
};

const PAPER_DURATION: OfficialFact = {
  id: 'fact-paper-duration',
  field: 'paper_duration',
  status: 'Published',
  value: '2.5',
  unit: 'years',
  period: 'plan vigente',
  sourceName: 'Sitio UNSTA',
  sourceUrl: 'https://unsta.edu.ar/tudcs',
  derivationRuleId: null,
  note: null,
  relievedAt: '2026-09-07T12:00:00Z',
};

function renderSheet(facts: CareerFacts, officialFacts: OfficialFact[] = []) {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <CareerFactsSheet facts={facts} officialFacts={officialFacts} />
    </QueryClientProvider>,
  );
}

describe('CareerFactsSheet', () => {
  it('muestra el nombre de la carrera y su institución', () => {
    renderSheet(BASE);

    expect(screen.getByRole('heading', { level: 1, name: BASE.careerName })).toBeInTheDocument();
    expect(screen.getByText(BASE.universityName)).toBeInTheDocument();
  });

  /** US-127 N1: sin ningún dato oficial relevado, el bloque entero lo dice, no un espacio vacío. */
  it('dice que faltan los datos oficiales cuando todavía no hay ninguno relevado', () => {
    renderSheet(BASE, []);

    expect(screen.getByText(/todavía no tenemos datos oficiales/i)).toBeInTheDocument();
  });

  /** US-127 E1, E4: dura en el papel se lee como dato oficial, con su fuente y su período. */
  it('muestra dura en el papel publicado, con su fuente y su período', () => {
    renderSheet(BASE, [PAPER_DURATION]);

    expect(screen.getByText('Dura en el papel')).toBeInTheDocument();
    expect(screen.getByText('2,5 años')).toBeInTheDocument();
    expect(screen.getByText('Sitio UNSTA · plan vigente')).toBeInTheDocument();
  });

  /**
   * US-127 E2, N2: sin relevamiento de "dura en la realidad" (hoy no está publicado por ninguna
   * fuente para ninguna carrera), el dato lo dice con fecha en vez de calcularlo o dejarlo en
   * blanco; nunca toma la forma de un valor publicado.
   */
  it('dura en la realidad no publicada se dice con su nota y su fecha, no un espacio en blanco', () => {
    renderSheet(BASE, [
      PAPER_DURATION,
      {
        id: 'fact-real-duration',
        field: 'real_duration',
        status: 'NotPublished',
        value: null,
        unit: null,
        period: null,
        sourceName: 'Ministerio de Educación (SPU)',
        sourceUrl: 'https://spu.example',
        derivationRuleId: null,
        note: 'Ninguna fuente pública releva la duración real por carrera.',
        relievedAt: '2026-09-07T12:00:00Z',
      },
    ]);

    expect(screen.getByText('Dura en la realidad')).toBeInTheDocument();
    expect(
      screen.getByText(/No publicado: Ninguna fuente pública releva la duración real/),
    ).toBeInTheDocument();
    expect(screen.getByText(/relevado el 07\/09\/2026/)).toBeInTheDocument();
  });

  /** US-133 E1: el egreso por cohorte no se publica por carrera, se deriva y se etiqueta como tal. */
  it('egreso por cohorte derivado se etiqueta como tal y linkea a Método, nunca como dato publicado', () => {
    renderSheet(BASE, [
      PAPER_DURATION,
      {
        id: 'fact-cohort-graduation',
        field: 'cohort_graduation',
        status: 'Derived',
        value: '21.4',
        unit: 'percent',
        period: '2022',
        sourceName: 'Anuario SPU',
        sourceUrl: 'https://spu.example/anuario',
        derivationRuleId: 'graduation-flow-proxy',
        note: 'Proxy de flujo institucional, no es una cohorte real.',
        relievedAt: '2026-09-07T12:00:00Z',
      },
    ]);

    expect(screen.getByText('Egreso por cohorte')).toBeInTheDocument();
    expect(screen.getByText('21,4 %')).toBeInTheDocument();
    expect(screen.getByText('Derivado')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ver la regla en método/i })).toHaveAttribute(
      'href',
      '/method#graduation-flow-proxy',
    );
  });

  /** US-133 E2, N1: sin proxy todavía, "no publicado" con fecha, nunca un cero ni un cálculo propio. */
  it('egreso por cohorte sin derivar todavía se dice no publicado, nunca un cero', () => {
    renderSheet(BASE, [
      {
        id: 'fact-cohort-graduation-not-published',
        field: 'cohort_graduation',
        status: 'NotPublished',
        value: null,
        unit: null,
        period: null,
        sourceName: 'Anuario SPU',
        sourceUrl: 'https://spu.example/anuario',
        derivationRuleId: null,
        note: 'Todavía no se calculó el proxy de flujo para esta oferta.',
        relievedAt: '2026-09-07T12:00:00Z',
      },
    ]);

    expect(screen.getByText('Egreso por cohorte')).toBeInTheDocument();
    expect(
      screen.getByText(/No publicado: Todavía no se calculó el proxy de flujo/),
    ).toBeInTheDocument();
    // Nunca la forma de un valor publicado: nada de serif grande al lado de "Egreso por cohorte".
    expect(screen.queryByText('0,0 %')).not.toBeInTheDocument();
    expect(screen.queryByText('0 %', { selector: '.font-serif' })).not.toBeInTheDocument();
  });

  /** F02: el régimen de ingreso entra a esta ficha, con la misma forma que el resto. */
  it('muestra el régimen de ingreso cuando está relevado', () => {
    renderSheet(BASE, [
      {
        id: 'fact-admission-regime',
        field: 'admission_regime',
        status: 'Published',
        value: 'Ingreso directo, sin examen ni curso',
        unit: null,
        period: '2026',
        sourceName: 'Sitio UNSTA',
        sourceUrl: 'https://unsta.edu.ar/ingreso',
        derivationRuleId: null,
        note: null,
        relievedAt: '2026-09-07T12:00:00Z',
      },
    ]);

    expect(screen.getByText('Régimen de ingreso')).toBeInTheDocument();
    expect(screen.getByText('Ingreso directo, sin examen ni curso')).toBeInTheDocument();
  });

  /** F05, O03: una tecnicatura no tiene acreditación CONEAU, tiene validez nacional. */
  it('en una tecnicatura muestra validez nacional, no acreditación', () => {
    renderSheet(BASE, [
      {
        id: 'fact-national-validity',
        field: 'national_validity',
        status: 'NotApplicable',
        value: null,
        unit: null,
        period: null,
        sourceName: 'CONEAU',
        sourceUrl: 'https://coneau.gob.ar',
        derivationRuleId: null,
        note: 'Las tecnicaturas no se acreditan: validez nacional por RM 2495/2018.',
        relievedAt: '2026-09-07T12:00:00Z',
      },
    ]);

    expect(screen.getByText('Validez nacional')).toBeInTheDocument();
    expect(screen.queryByText('Acreditación')).not.toBeInTheDocument();
    expect(
      screen.getByText(/No aplica: Las tecnicaturas no se acreditan: validez nacional/),
    ).toBeInTheDocument();
  });

  it('la cobertura vacía dice que ninguna materia junta el piso todavía', () => {
    renderSheet(BASE);

    expect(screen.getByText(/0 de 21 materias/)).toBeInTheDocument();
    expect(screen.getByText(/ninguna materia junta todavía/i)).toBeInTheDocument();
  });

  /** US-134 E1: la cobertura se lee como fracción y porcentaje, con lo que falta explicado. */
  it('la cobertura parcial dice cuántas materias restantes no llegan al piso', () => {
    renderSheet({ ...BASE, coveredSubjects: 1, coveragePercent: 5 });

    expect(screen.getByText(/1 de 21 materias/)).toBeInTheDocument();
    expect(screen.getByText('5 %')).toBeInTheDocument();
    expect(
      screen.getByText(/las 20 restantes todavía no juntan las 10 reseñas del piso/i),
    ).toBeInTheDocument();
  });

  it('la cobertura completa no dice que falten materias', () => {
    renderSheet({ ...BASE, coveredSubjects: 21, coveragePercent: 100 });

    expect(
      screen.getByText(/todas sus materias ya juntan las 10 reseñas del piso/i),
    ).toBeInTheDocument();
  });

  it('enlaza a las materias del plan y a reseñar', () => {
    renderSheet(BASE);

    expect(screen.getByRole('link', { name: /ver las 21 materias/i })).toHaveAttribute(
      'href',
      `/careers/${BASE.careerId}/plans`,
    );
    expect(screen.getByRole('link', { name: /reseñá tu cursada/i })).toHaveAttribute(
      'href',
      '/reviews/new',
    );
  });

  it('no publica ningún puntaje ni escala', () => {
    const { container } = renderSheet(BASE);

    expect(container.textContent).not.toMatch(/★|puntaje|promedio de|\/ 5/i);
  });

  /**
   * ADR-0084: una nota de curaduría se muestra fechada y con su procedencia siempre al lado,
   * nunca un texto suelto sin decir de dónde sale.
   */
  it('publica la nota del equipo con su procedencia y su fecha', () => {
    renderSheet({
      ...BASE,
      editorialNotes: [
        {
          id: 'n1',
          text: 'Varias cursadas mencionan que no se sabe con qué se rinde el final.',
          publishedAt: '2026-08-19T12:00:00Z',
        },
      ],
    });

    expect(screen.getByText(/no se sabe con qué se rinde el final/i)).toBeInTheDocument();

    // La procedencia es lo que la hace legible: una síntesis sin decir de dónde sale es opinión.
    expect(screen.getByText(/leída de comentarios que no se publican/i)).toBeInTheDocument();
    expect(screen.getByText(/19\/08\/2026/)).toBeInTheDocument();
  });

  it('sin notas no dibuja el bloque, en vez de decir que no hay ninguna', () => {
    renderSheet(BASE);

    expect(screen.queryByText(/de la curaduría/i)).not.toBeInTheDocument();
  });
});
