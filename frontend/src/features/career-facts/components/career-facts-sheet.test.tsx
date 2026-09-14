import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { OfficialFact } from '@/components/facts';
import type { CareerCoverage, Subject, SubjectCoverage } from '@/features/browse-catalog';
import type { CareerFacts } from '../types';
import { CareerFactsSheet } from './career-facts-sheet';

const BASE: CareerFacts = {
  careerId: 'career-1',
  careerName: 'Tecnicatura Universitaria en Desarrollo y Calidad de Software',
  universityName: 'Universidad del Norte Santo Tomás de Aquino',
  academicUnitName: null,
  durationYears: null,
  totalSubjects: 21,
  coveredSubjects: 0,
  coveragePercent: 0,
  editorialNotes: [],
};

const PAPER_DURATION: OfficialFact = {
  id: 'fact-paper-duration',
  subjectId: 'career-1',
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

function renderSheet(
  facts: CareerFacts,
  officialFacts: OfficialFact[] = [],
  overrides: {
    catalogCoverage?: CareerCoverage[];
    academicUnitName?: string | null;
    activePlan?: { year: number; subjects: Subject[]; subjectCoverage: SubjectCoverage[] } | null;
  } = {},
) {
  return render(
    <CareerFactsSheet
      facts={facts}
      officialFacts={officialFacts}
      catalogCoverage={overrides.catalogCoverage ?? []}
      academicUnitName={overrides.academicUnitName ?? null}
      activePlan={overrides.activePlan ?? null}
    />,
  );
}

function coverage(overrides: Partial<CareerCoverage> & { careerId: string }): CareerCoverage {
  return {
    careerName: 'Carrera',
    universityId: 'uni-1',
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

function subject(overrides: Partial<Subject> & { id: string }): Subject {
  return {
    careerPlanId: 'plan-1',
    code: '101',
    name: 'Materia',
    yearInPlan: 1,
    termInYear: 1,
    termKind: 'FourMonth',
    ...overrides,
  };
}

describe('CareerFactsSheet', () => {
  it('muestra el nombre de la carrera como título', () => {
    renderSheet(BASE);

    expect(screen.getByRole('heading', { level: 1, name: BASE.careerName })).toBeInTheDocument();
  });

  /** El eyebrow es la jerarquía completa: carrera, universidad, facultad (si se resolvió) y plan vigente. */
  it('el eyebrow dice la carrera, la universidad, la facultad y el plan vigente', () => {
    renderSheet(BASE, [], {
      academicUnitName: 'Facultad de Ingeniería',
      activePlan: { year: 2024, subjects: [], subjectCoverage: [] },
    });

    expect(
      screen.getByText(
        'Carrera · Universidad del Norte Santo Tomás de Aquino · Facultad de Ingeniería · plan 2024',
      ),
    ).toBeInTheDocument();
  });

  it('sin facultad ni plan resueltos, el eyebrow no inventa esos segmentos', () => {
    renderSheet(BASE);

    expect(
      screen.getByText('Carrera · Universidad del Norte Santo Tomás de Aquino'),
    ).toBeInTheDocument();
  });

  /** SC-001: la línea bajo el título dice la facultad y la universidad, en prosa. */
  it('con facultad resuelta, la línea bajo el título la nombra en una oración', () => {
    renderSheet(BASE, [], { academicUnitName: 'Facultad de Ingeniería' });

    expect(
      screen.getByText(
        'Se dicta en la Facultad de Ingeniería de la Universidad del Norte Santo Tomás de Aquino.',
      ),
    ).toBeInTheDocument();
  });

  it('sin facultad resuelta, la línea nombra solo la universidad', () => {
    renderSheet(BASE);

    expect(
      screen.getByText('Se dicta en la Universidad del Norte Santo Tomás de Aquino.'),
    ).toBeInTheDocument();
  });

  /** US-127 N1: sin ningún dato oficial relevado, el bloque entero lo dice, no un espacio vacío. */
  it('dice que faltan los datos oficiales cuando todavía no hay ninguno relevado', () => {
    renderSheet(BASE, []);

    expect(screen.getByText(/todavía no tenemos datos oficiales/i)).toBeInTheDocument();
  });

  /** US-127 E1, E4: dura en el papel se lee como dato oficial, con su fuente y su período. */
  it('muestra dura en el papel publicado, con su fuente y su período', () => {
    renderSheet(BASE, [PAPER_DURATION]);

    // La etiqueta y el valor aparecen dos veces: la tira de números (vistazo) y "Datos oficiales"
    // (detalle con fuente). Solo el detalle dice la fuente junto al período.
    expect(screen.getAllByText('Dura en el papel').length).toBeGreaterThan(0);
    expect(screen.getAllByText('2,5 años').length).toBeGreaterThan(0);
    expect(screen.getByText('Sitio UNSTA · plan vigente')).toBeInTheDocument();
  });

  /**
   * ADR-0090: con relevamiento parcial (una sola afirmación de las seis), la ficha dice qué le
   * falta en vez de esconder las otras cinco filas en silencio, igual que Dónde estudiarla
   * (career-comparison-view.tsx).
   */
  it('con datos oficiales parciales, dice qué le falta en vez de esconder las filas', () => {
    renderSheet(BASE, [PAPER_DURATION]);

    expect(screen.getAllByText('Dura en el papel').length).toBeGreaterThan(0);
    expect(screen.getByText('Dura en la realidad')).toBeInTheDocument();
    expect(screen.getAllByText('Egreso por cohorte').length).toBeGreaterThan(0);
    expect(screen.getByText('Plan vigente')).toBeInTheDocument();
    expect(screen.getByText('Acreditación o validez nacional')).toBeInTheDocument();
    expect(screen.getByText('Régimen de ingreso')).toBeInTheDocument();
    expect(screen.getAllByText('Todavía no se relevó para esta oferta.')).toHaveLength(5);
  });

  /**
   * US-127 E2, N2: sin relevamiento de "dura en la realidad" (hoy no está publicado por ninguna
   * fuente para ninguna carrera), el dato lo dice con la etiqueta fija y la fecha, nunca calculado
   * ni en blanco; nunca toma la forma de un valor publicado.
   */
  it('dura en la realidad no publicada se dice con la etiqueta fija, la nota y la fecha', () => {
    renderSheet(BASE, [
      PAPER_DURATION,
      {
        id: 'fact-real-duration',
        subjectId: 'career-1',
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
    expect(screen.getByText('No publicado por falta de datos')).toBeInTheDocument();
    expect(
      screen.getByText('Ninguna fuente pública releva la duración real por carrera.'),
    ).toBeInTheDocument();
    expect(screen.getByText(/relevado el 07\/09\/2026/)).toBeInTheDocument();
  });

  /**
   * US-133 E1: el egreso por cohorte no se publica por carrera, se deriva y se etiqueta como tal.
   * El chip de la tira linkea a la regla igual que la fila de "Datos oficiales": dos links al
   * mismo bloque de Método, uno por altura.
   */
  it('egreso por cohorte derivado se etiqueta como tal y linkea a Método, nunca como dato publicado', () => {
    renderSheet(BASE, [
      PAPER_DURATION,
      {
        id: 'fact-cohort-graduation',
        subjectId: 'career-1',
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

    expect(screen.getAllByText('Egreso por cohorte').length).toBeGreaterThan(0);
    expect(screen.getAllByText('21,4 %').length).toBeGreaterThan(0);
    const derivedLinks = screen.getAllByRole('link', { name: /derivado|ver la regla en método/i });
    expect(derivedLinks.length).toBeGreaterThan(1);
    for (const link of derivedLinks) {
      expect(link).toHaveAttribute('href', '/method#graduation-flow-proxy');
    }
  });

  /** US-133 E2, N1: sin proxy todavía, la etiqueta fija con fecha, nunca un cero ni un cálculo propio. */
  it('egreso por cohorte sin derivar todavía se dice no publicado, nunca un cero', () => {
    renderSheet(BASE, [
      {
        id: 'fact-cohort-graduation-not-published',
        subjectId: 'career-1',
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

    expect(screen.getAllByText('Egreso por cohorte').length).toBeGreaterThan(0);
    expect(screen.getByText('No publicado por falta de datos')).toBeInTheDocument();
    // La nota corta aparece también en la tira (el mismo criterio que la ficha de institución
    // aplica a estudiantes/egresados): no es un dato roto, es el mismo hecho en dos alturas.
    expect(
      screen.getAllByText('Todavía no se calculó el proxy de flujo para esta oferta.').length,
    ).toBeGreaterThan(0);
    // Nunca la forma de un valor publicado: nada de serif grande al lado de "Egreso por cohorte".
    expect(screen.queryByText('0,0 %')).not.toBeInTheDocument();
    expect(screen.queryByText('0 %', { selector: '.font-serif' })).not.toBeInTheDocument();
  });

  /** F02: el régimen de ingreso entra a esta ficha, con la misma forma que el resto. */
  it('muestra el régimen de ingreso cuando está relevado', () => {
    renderSheet(BASE, [
      {
        id: 'fact-admission-regime',
        subjectId: 'career-1',
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
        subjectId: 'career-1',
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
    expect(screen.getByText('No aplica a esta carrera')).toBeInTheDocument();
    expect(
      screen.getByText('Las tecnicaturas no se acreditan: validez nacional por RM 2495/2018.'),
    ).toBeInTheDocument();
  });

  /**
   * Sin grupo canónico la celda no se dibuja: el agrupamiento es una lista curada incompleta
   * (Procurador y Psicología quedaron afuera a propósito), y "Solo acá" afirmaría algo que no se
   * sabe.
   */
  it('instituciones que la dictan: sin grupo canónico, la celda no se dibuja', () => {
    renderSheet(BASE, [], {
      catalogCoverage: [coverage({ careerId: BASE.careerId, canonicalGroupName: null })],
    });

    expect(screen.queryByText(/instituciones que la dictan/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Solo acá')).not.toBeInTheDocument();
  });

  /** Sin ninguna entrada de catalogCoverage para esta carrera, tampoco se dibuja (mismo caso: sin dato, no se inventa). */
  it('instituciones que la dictan: sin cobertura para esta carrera, la celda no se dibuja', () => {
    renderSheet(BASE);

    expect(screen.queryByText(/instituciones que la dictan/i)).not.toBeInTheDocument();
  });

  /** Con grupo canónico, cuenta las universidades distintas del grupo, esta incluida. */
  it('instituciones que la dictan: con grupo canónico, cuenta las universidades del grupo', () => {
    renderSheet(BASE, [], {
      catalogCoverage: [
        coverage({
          careerId: BASE.careerId,
          universityId: 'unsta',
          canonicalGroupName: 'Desarrollo de Software',
        }),
        coverage({
          careerId: 'career-2',
          universityId: 'unt',
          canonicalGroupName: 'Desarrollo de Software',
        }),
        coverage({
          careerId: 'career-3',
          universityId: 'utn',
          canonicalGroupName: 'Desarrollo de Software',
        }),
      ],
    });

    expect(screen.getByText('3 instituciones')).toBeInTheDocument();
  });

  /** "Materias medidas" no se dibuja con denominador 0: la carrera todavía no tiene plan cargado. */
  it('materias medidas: sin materias cargadas, la celda no se dibuja', () => {
    renderSheet({ ...BASE, totalSubjects: 0, coveredSubjects: 0, coveragePercent: 0 });

    expect(screen.queryByText(/materias medidas/i)).not.toBeInTheDocument();
  });

  it('la cobertura vacía dice que ninguna materia junta reseñas suficientes', () => {
    renderSheet(BASE);

    expect(screen.getByText(/0 de 21 materias/)).toBeInTheDocument();
    expect(screen.getByText(/ninguna materia junta todavía/i)).toBeInTheDocument();
  });

  /** US-134 E1: la cobertura se lee como fracción y porcentaje, con lo que falta explicado. */
  it('la cobertura parcial dice cuántas materias restantes todavía no juntan reseñas suficientes', () => {
    renderSheet({ ...BASE, coveredSubjects: 1, coveragePercent: 5 });

    expect(screen.getByText(/1 de 21 materias/)).toBeInTheDocument();
    expect(screen.getByText('5 %')).toBeInTheDocument();
    expect(
      screen.getByText(/las 20 restantes todavía no juntan reseñas suficientes/i),
    ).toBeInTheDocument();
  });

  it('la cobertura completa no dice que falten materias', () => {
    renderSheet({ ...BASE, coveredSubjects: 21, coveragePercent: 100 });

    expect(
      screen.getByText(/todas sus materias ya juntan reseñas suficientes/i),
    ).toBeInTheDocument();
  });

  /** El plan vigente se muestra inline, agrupado por año (US-134, SC-018). */
  it('con plan vigente, muestra "El plan {año}" con sus materias agrupadas por año', () => {
    renderSheet(BASE, [], {
      activePlan: {
        year: 2018,
        subjects: [subject({ id: 'subj-1', code: '101', name: 'Algoritmos y Paradigmas' })],
        subjectCoverage: [],
      },
    });

    expect(screen.getByText('El plan 2018')).toBeInTheDocument();
    expect(screen.getByText('Año 1')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /algoritmos y paradigmas/i })).toHaveAttribute(
      'href',
      '/subjects/subj-1',
    );
    expect(screen.queryByRole('link', { name: /ver los planes/i })).not.toBeInTheDocument();
  });

  /** Sin plan vigente, el único camino a las materias de un plan histórico es la lista completa. */
  it('sin plan vigente, ofrece "Ver los planes" en el lugar del plan', () => {
    renderSheet(BASE);

    expect(screen.queryByText(/^El plan /)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ver los planes/i })).toHaveAttribute(
      'href',
      `/careers/${BASE.careerId}/plans`,
    );
  });

  /**
   * "Por dónde empezar": las materias que ya publican (cruzaron el piso), de más a menos reseñas.
   * Una con carga bajo el piso, o sin ninguna reseña, no entra: todavía no hay nada publicado ahí.
   */
  it('"Por dónde empezar" lista las materias que ya publican, de más a menos', () => {
    renderSheet(BASE, [], {
      activePlan: {
        year: 2018,
        subjects: [
          subject({ id: 'subj-1', name: 'Álgebra I' }),
          subject({ id: 'subj-2', name: 'Programación I' }),
          subject({ id: 'subj-3', name: 'Física I' }),
          subject({ id: 'subj-4', name: 'Bases de Datos' }),
        ],
        subjectCoverage: [
          { subjectId: 'subj-1', reviewCount: 5, chairCount: 1, isCovered: false },
          { subjectId: 'subj-2', reviewCount: 30, chairCount: 3, isCovered: true },
          { subjectId: 'subj-4', reviewCount: 45, chairCount: 4, isCovered: true },
        ],
      },
    });

    const section = screen
      .getByText('Por dónde empezar · las materias con reseñas')
      .closest('section');
    if (!section) throw new Error('no se encontró la sección "Por dónde empezar"');
    const links = within(section).getAllByRole('link');
    expect(links.map((l) => l.textContent)).toEqual(['Bases de Datos', 'Programación I']);
    // Álgebra I junta reseñas pero todavía no cruzó el piso: no es "por dónde empezar" todavía.
    expect(within(section).queryByText('Álgebra I')).not.toBeInTheDocument();
    // Física I no tiene ninguna reseña.
    expect(within(section).queryByText('Física I')).not.toBeInTheDocument();
  });

  it('sin ninguna materia que publique, "Por dónde empezar" no se dibuja', () => {
    renderSheet(BASE, [], {
      activePlan: {
        year: 2018,
        subjects: [subject({ id: 'subj-1', name: 'Álgebra I' })],
        subjectCoverage: [{ subjectId: 'subj-1', reviewCount: 5, chairCount: 1, isCovered: false }],
      },
    });

    expect(screen.queryByText(/por dónde empezar/i)).not.toBeInTheDocument();
  });

  it('enlaza a reseñar la cursada', () => {
    renderSheet(BASE);

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
