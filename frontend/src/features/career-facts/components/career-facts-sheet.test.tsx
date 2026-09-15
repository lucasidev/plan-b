import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { OfficialFact } from '@/components/facts';
import type { CareerCoverage, Subject, SubjectCoverage } from '@/features/browse-catalog';
import type { CareerComparison, CareerComparisonOffering } from '@/features/career-comparison';
import type { CareerFacts } from '../types';
import { CareerFactsSheet } from './career-facts-sheet';

const BASE: CareerFacts = {
  careerId: 'career-1',
  careerName: 'Tecnicatura Universitaria en Desarrollo y Calidad de Software',
  universityName: 'Universidad del Norte Santo Tomás de Aquino',
  academicUnitName: null,
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
  value: '2 años y medio',
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
    universityShort?: string | null;
    comparison?: CareerComparison | null;
  } = {},
) {
  return render(
    <CareerFactsSheet
      facts={facts}
      officialFacts={officialFacts}
      catalogCoverage={overrides.catalogCoverage ?? []}
      academicUnitName={overrides.academicUnitName ?? null}
      activePlan={overrides.activePlan ?? null}
      universityShort={overrides.universityShort ?? null}
      comparison={overrides.comparison ?? null}
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

function offering(
  overrides: Partial<CareerComparisonOffering> & { careerId: string; universityName: string },
): CareerComparisonOffering {
  return {
    careerName: 'Tecnicatura Universitaria en Desarrollo y Calidad de Software',
    universityId: 'university-1',
    academicUnitName: null,
    localityName: null,
    institutionKind: null,
    facts: [],
    ...overrides,
  };
}

describe('CareerFactsSheet', () => {
  it('muestra el nombre de la carrera como título', () => {
    renderSheet(BASE);

    expect(screen.getByRole('heading', { level: 1, name: BASE.careerName })).toBeInTheDocument();
  });

  /** El eyebrow es la jerarquía completa: carrera, universidad corta, facultad (si se resolvió) y plan vigente. */
  it('el eyebrow dice la carrera, la universidad corta, la facultad y el plan vigente', () => {
    renderSheet(BASE, [], {
      academicUnitName: 'Facultad de Ingeniería',
      activePlan: { year: 2024, subjects: [], subjectCoverage: [] },
      universityShort: 'UNSTA',
    });

    expect(
      screen.getByText('Carrera · UNSTA · Facultad de Ingeniería · plan 2024'),
    ).toBeInTheDocument();
  });

  /** `universityShort` es un pedido nuevo de esta pantalla: si falla (null), ese segmento no se inventa. */
  it('sin universityShort resuelto, el eyebrow no inventa ese segmento', () => {
    renderSheet(BASE, [], { academicUnitName: 'Facultad de Ingeniería' });

    expect(screen.getByText('Carrera · Facultad de Ingeniería')).toBeInTheDocument();
  });

  it('sin ningún segmento resuelto, el eyebrow dice solo "Carrera"', () => {
    renderSheet(BASE);

    expect(screen.getByText('Carrera')).toBeInTheDocument();
  });

  /** US-127: la línea de sustento se arma con los datos oficiales, una oración por dato presente. */
  it('la línea de sustento dice la duración en el papel, que la real no la publica nadie, y el egreso derivado', () => {
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
        sourceName: 'SPU',
        sourceUrl: 'https://spu.example',
        derivationRuleId: null,
        note: 'Ninguna fuente pública releva la duración real por carrera.',
        relievedAt: '2026-09-07T12:00:00Z',
      },
      {
        id: 'fact-cohort-graduation',
        subjectId: 'career-1',
        field: 'cohort_graduation',
        status: 'Derived',
        value: '21,4 %',
        unit: 'percent',
        period: '2022',
        sourceName: 'Anuario SPU',
        sourceUrl: 'https://spu.example/anuario',
        derivationRuleId: 'graduation-flow-proxy',
        note: 'Proxy de flujo institucional.',
        relievedAt: '2026-09-07T12:00:00Z',
      },
    ]);

    expect(
      screen.getByText(
        'Dura 2 años y medio en el papel. En la realidad, ninguna fuente lo publica. De cada 100 que entran, egresan 21 (derivado de la institución entera).',
      ),
    ).toBeInTheDocument();
  });

  /** Publicado (no derivado), el egreso no lleva el paréntesis. */
  it('con el egreso por cohorte publicado (no derivado), la oración no lleva el paréntesis', () => {
    renderSheet(BASE, [
      {
        id: 'fact-cohort-graduation',
        subjectId: 'career-1',
        field: 'cohort_graduation',
        status: 'Published',
        value: '21,4 %',
        unit: 'percent',
        period: '2022',
        sourceName: 'Anuario SPU',
        sourceUrl: 'https://spu.example/anuario',
        derivationRuleId: null,
        note: null,
        relievedAt: '2026-09-07T12:00:00Z',
      },
    ]);

    expect(screen.getByText('De cada 100 que entran, egresan 21.')).toBeInTheDocument();
  });

  it('sin ningún dato oficial relevado, no dibuja la línea de sustento', () => {
    renderSheet(BASE);

    expect(screen.queryByText(/dura .* en el papel\./)).not.toBeInTheDocument();
  });

  /** US-127 N1: sin ningún dato oficial relevado, el bloque entero lo dice, no un espacio vacío. */
  it('dice que faltan los datos oficiales cuando todavía no hay ninguno relevado', () => {
    renderSheet(BASE, []);

    expect(screen.getByText(/todavía no tenemos datos oficiales/i)).toBeInTheDocument();
  });

  /** US-127 E1, E4: dura en el papel se lee como dato oficial, con su fuente y su período. */
  it('muestra dura en el papel publicado, con su fuente y su período', () => {
    renderSheet(BASE, [PAPER_DURATION]);

    expect(screen.getAllByText('Dura en el papel').length).toBeGreaterThan(0);
    expect(screen.getAllByText('2 años y medio').length).toBeGreaterThan(0);
    expect(screen.getByText('Sitio UNSTA · plan vigente')).toBeInTheDocument();
  });

  /** La tira ("V.career().stats" de la maqueta aprobada): "2 ½" con la etiqueta "años en el papel". */
  it('la tira dice "2 ½ años en el papel", el número al principio de paper_duration', () => {
    renderSheet(BASE, [PAPER_DURATION]);

    expect(screen.getByText('2 ½')).toBeInTheDocument();
    expect(screen.getByText('años en el papel')).toBeInTheDocument();
  });

  /**
   * ADR-0090: con relevamiento parcial (una sola afirmación de las seis), la ficha dice qué le
   * falta en vez de esconder las otras cinco filas en silencio, igual que Dónde estudiarla.
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
   * US-127 E2, N2: sin relevamiento de "dura en la realidad", el dato lo dice con la etiqueta fija
   * y la nota, nunca calculado ni en blanco; nunca toma la forma de un valor publicado. Sin la
   * fecha de relevamiento: el markup literal de la maqueta no la repite fila por fila (a
   * diferencia del checklist de transparencia institucional, que sí la muestra una vez al pie).
   */
  it('dura en la realidad no publicada se dice con la etiqueta fija y la nota, nunca con la forma de un valor', () => {
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
  });

  /**
   * US-133 E1: el egreso por cohorte no se publica por carrera, se deriva y se etiqueta como tal,
   * con un único link a la regla en Método (la tira ya no lleva un segundo link: es texto llano).
   */
  it('egreso por cohorte derivado se etiqueta como tal y linkea a Método, nunca como dato publicado', () => {
    renderSheet(BASE, [
      PAPER_DURATION,
      {
        id: 'fact-cohort-graduation',
        subjectId: 'career-1',
        field: 'cohort_graduation',
        status: 'Derived',
        value: '21,4 %',
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
    const derivedLink = screen.getByRole('link', { name: 'derivado' });
    expect(derivedLink).toHaveAttribute('href', '/method#graduation-flow-proxy');
  });

  /** La nota larga del proxy vive en Método, no en la fila: debajo va el literal fijo. */
  it('un dato derivado muestra "Derivado · la regla está en Método" debajo, nunca la nota del proxy', () => {
    renderSheet(BASE, [
      {
        id: 'fact-cohort-graduation',
        subjectId: 'career-1',
        field: 'cohort_graduation',
        status: 'Derived',
        value: '21,4 %',
        unit: 'percent',
        period: '2022',
        sourceName: 'Anuario SPU',
        sourceUrl: 'https://spu.example/anuario',
        derivationRuleId: 'graduation-flow-proxy',
        note: 'Proxy de flujo institucional, no es una cohorte real.',
        relievedAt: '2026-09-07T12:00:00Z',
      },
    ]);

    expect(screen.getByText('Derivado · la regla está en Método')).toBeInTheDocument();
    expect(
      screen.queryByText('Proxy de flujo institucional, no es una cohorte real.'),
    ).not.toBeInTheDocument();
  });

  /** US-133 E2, N1: sin proxy todavía, la etiqueta fija, nunca un cero ni un cálculo propio. */
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
    expect(
      screen.getByText('Todavía no se calculó el proxy de flujo para esta oferta.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('0,0 %')).not.toBeInTheDocument();
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

  /**
   * Maqueta aprobada (V.career línea 511): un dato Published con nota muestra la nota primero y
   * la fuente después, separadas por un espacio porque la nota ya cierra en punto.
   */
  it('un dato publicado con nota muestra la nota primero y la fuente después', () => {
    renderSheet(BASE, [
      {
        id: 'fact-current-plan',
        subjectId: 'career-1',
        field: 'current_plan',
        status: 'Published',
        value: 'RM 2495/2018, modificado por RM 1186/2021',
        unit: null,
        period: '2018',
        sourceName: 'Sitio UNSTA',
        sourceUrl: 'https://unsta.edu.ar/tudcs',
        derivationRuleId: null,
        note: '21 materias: 9 en primer año, 8 en segundo, 4 en tercero.',
        relievedAt: '2026-09-07T12:00:00Z',
      },
    ]);

    expect(
      screen.getByText(
        '21 materias: 9 en primer año, 8 en segundo, 4 en tercero. Sitio UNSTA · 2018',
      ),
    ).toBeInTheDocument();
  });

  /** F05, O03: una tecnicatura no tiene acreditación CONEAU, tiene validez nacional: su propia etiqueta, no la genérica. */
  it('en una tecnicatura muestra la etiqueta específica "Validez nacional", no la genérica ni "Acreditación"', () => {
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
    expect(screen.queryByText('Acreditación o validez nacional')).not.toBeInTheDocument();
    expect(screen.getByText('No aplica a esta carrera')).toBeInTheDocument();
    expect(
      screen.getByText('Las tecnicaturas no se acreditan: validez nacional por RM 2495/2018.'),
    ).toBeInTheDocument();
  });

  /** Sin ninguna de las dos, la fila usa el placeholder genérico: no se sabe cuál falta. */
  it('sin acreditación ni validez nacional relevadas, la fila usa la etiqueta genérica', () => {
    renderSheet(BASE, [PAPER_DURATION]);

    expect(screen.getByText('Acreditación o validez nacional')).toBeInTheDocument();
  });

  /**
   * Sin grupo canónico la celda no se dibuja: el agrupamiento es una lista curada incompleta, y
   * "instituciones más la dictan" afirmaría algo que no se sabe.
   */
  it('instituciones que la dictan: sin grupo canónico, la celda no se dibuja', () => {
    renderSheet(BASE, [], {
      catalogCoverage: [coverage({ careerId: BASE.careerId, canonicalGroupName: null })],
    });

    expect(screen.queryByText(/instituciones más la dictan/i)).not.toBeInTheDocument();
  });

  it('instituciones que la dictan: sin cobertura para esta carrera, la celda no se dibuja', () => {
    renderSheet(BASE);

    expect(screen.queryByText(/instituciones más la dictan/i)).not.toBeInTheDocument();
  });

  /** Con grupo canónico, cuenta las universidades del grupo MENOS esta (US-195, ADR-0090): "más la dictan". */
  it('instituciones que la dictan: con grupo canónico, cuenta el grupo menos esta institución', () => {
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

    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('instituciones más la dictan')).toBeInTheDocument();
  });

  /** Cuando el grupo entero es solo esta institución, "0 instituciones más" no informa nada: no se dibuja. */
  it('instituciones que la dictan: sin ninguna otra universidad en el grupo, la celda no se dibuja', () => {
    renderSheet(BASE, [], {
      catalogCoverage: [
        coverage({
          careerId: BASE.careerId,
          universityId: 'unsta',
          canonicalGroupName: 'Desarrollo de Software',
        }),
      ],
    });

    expect(screen.queryByText(/instituciones más la dictan/i)).not.toBeInTheDocument();
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

  /** El plan vigente se muestra inline, compacto por año (sin agrupar por cuatrimestre, US-134, SC-018). */
  it('con plan vigente, muestra "El plan {año}" con sus materias agrupadas por año, ordinal en español', () => {
    renderSheet(BASE, [], {
      activePlan: {
        year: 2018,
        subjects: [subject({ id: 'subj-1', code: '101', name: 'Algoritmos y Paradigmas' })],
        subjectCoverage: [],
      },
    });

    expect(
      screen.getByText('El plan 2018 · 1 materias · las medidas en negrita'),
    ).toBeInTheDocument();
    expect(screen.getByText('Primer año')).toBeInTheDocument();
    expect(screen.queryByText('Año 1')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /algoritmos y paradigmas/i })).toHaveAttribute(
      'href',
      '/subjects/subj-1',
    );
    expect(screen.queryByRole('link', { name: /ver los planes/i })).not.toBeInTheDocument();
  });

  /** Contrato: `code` de una materia del plan es opcional. */
  it('sin código, la materia del plan muestra solo el nombre, sin badge vacío', () => {
    renderSheet(BASE, [], {
      activePlan: {
        year: 2018,
        subjects: [subject({ id: 'subj-1', code: null, name: 'Proyecto Final' })],
        subjectCoverage: [],
      },
    });

    const link = screen.getByRole('link', { name: 'Proyecto Final' });
    expect(link.querySelector('.pb-code')).toBeNull();
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
   * "Por dónde empezar": las materias con reseñas, isCovered primero, ordenadas por reseñas
   * dentro de cada grupo (US-134). Distinto de la ficha de institución: acá SÍ entran las que
   * juntan reseñas pero todavía no cruzan el piso, marcadas aparte (.pb-dim).
   */
  it('"Por dónde empezar" lista las materias con reseñas, isCovered primero y por reseñas dentro de cada grupo', () => {
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
      .closest<HTMLElement>('.pb-section');
    if (!section) throw new Error('no se encontró la sección "Por dónde empezar"');
    const links = within(section).getAllByRole('link');
    // isCovered primero (Bases de Datos 45, Programación I 30), después la que junta bajo el
    // piso (Álgebra I, .pb-dim). Física I no tiene ninguna reseña: no entra.
    expect(links.map((l) => l.textContent)).toEqual([
      '101 · Bases de Datos45 reseñas · 4 cátedras→',
      '101 · Programación I30 reseñas · 3 cátedras→',
      '101 · Álgebra I5 reseñas · 1 cátedra→',
    ]);
    expect(within(section).queryByText(/física i/i)).not.toBeInTheDocument();
    // La que está bajo el piso lleva .pb-dim; las publicadas, no.
    const dimmedLink = within(section).getByRole('link', { name: /álgebra i/i });
    expect(dimmedLink.className).toContain('pb-dim');
  });

  /** Contrato: `code` de una materia del plan es opcional; "Por dónde empezar" también la nombra sin él. */
  it('"Por dónde empezar": una materia sin código muestra solo el nombre', () => {
    renderSheet(BASE, [], {
      activePlan: {
        year: 2018,
        subjects: [subject({ id: 'subj-1', code: null, name: 'Proyecto Final' })],
        subjectCoverage: [{ subjectId: 'subj-1', reviewCount: 5, chairCount: 1, isCovered: true }],
      },
    });

    const section = screen
      .getByText('Por dónde empezar · las materias con reseñas')
      .closest<HTMLElement>('.pb-section');
    if (!section) throw new Error('no se encontró la sección "Por dónde empezar"');

    expect(within(section).getByRole('link', { name: /proyecto final/i }).textContent).toBe(
      'Proyecto Final5 reseñas · 1 cátedra→',
    );
  });

  it('sin ninguna materia con reseñas, "Por dónde empezar" no se dibuja', () => {
    renderSheet(BASE, [], {
      activePlan: {
        year: 2018,
        subjects: [subject({ id: 'subj-1', name: 'Álgebra I' })],
        subjectCoverage: [],
      },
    });

    expect(screen.queryByText(/por dónde empezar/i)).not.toBeInTheDocument();
  });

  /** SC-008, US-128: la misma carrera canónica en otras instituciones, sin la oferta actual. */
  it('"Dónde estudiarla" lista las otras ofertas de la comparación, sin la actual, con el link a compararlas', () => {
    renderSheet(BASE, [], {
      comparison: {
        groupName: 'Tecnicatura o técnico en programación',
        cityLabel: 'San Miguel de Tucumán',
        isProvinceFallback: false,
        offerings: [
          offering({
            careerId: BASE.careerId,
            universityName: 'UNSTA',
          }),
          offering({
            careerId: 'career-unt',
            universityName: 'Universidad Nacional de Tucumán',
            academicUnitName: 'Facultad de Ciencias Exactas y Tecnología',
            localityName: 'San Miguel de Tucumán',
            institutionKind: 'Pública',
            facts: [
              {
                id: 'fact-unt-paper-duration',
                subjectId: 'career-unt',
                field: 'paper_duration',
                status: 'Published',
                value: '3 años',
                unit: 'years',
                period: 'plan',
                sourceName: 'Sitio FACET',
                sourceUrl: 'https://facet.unt.edu.ar',
                derivationRuleId: null,
                note: null,
                relievedAt: '2026-09-07T12:00:00Z',
              },
            ],
          }),
        ],
      },
    });

    expect(screen.getByText('Dónde estudiarla')).toBeInTheDocument();
    expect(
      screen.getByText(
        'La misma carrera en otras instituciones de la aglomeración, medidas igual. Sin ganador.',
      ),
    ).toBeInTheDocument();
    // Solo la otra oferta, no UNSTA (que es la carrera actual).
    expect(screen.queryByRole('link', { name: /^UNSTA/ })).not.toBeInTheDocument();
    const untRow = screen.getByRole('link', { name: /universidad nacional de tucumán/i });
    expect(untRow).toHaveAttribute('href', '/careers/career-unt');
    expect(
      within(untRow).getByText(
        'Facultad de Ciencias Exactas y Tecnología · San Miguel de Tucumán · pública',
      ),
    ).toBeInTheDocument();
    expect(within(untRow).getByText('Dura en el papel: 3 años')).toBeInTheDocument();
    // Dos ofertas en total (esta y UNT): "dos lado a lado".
    expect(screen.getByRole('link', { name: /comparar las dos lado a lado/i })).toHaveAttribute(
      'href',
      `/careers/${BASE.careerId}/where-to-study`,
    );
  });

  /** Todo pedido nuevo degrada: sin comparación (pedido que falló o 404), la sección no se dibuja. */
  it('sin comparación (el pedido falló o no existe), "Dónde estudiarla" no se dibuja', () => {
    renderSheet(BASE);

    expect(screen.queryByText('Dónde estudiarla')).not.toBeInTheDocument();
  });

  /** Con comparación pero sin ninguna otra oferta (esta carrera es la única), la sección tampoco se dibuja. */
  it('con comparación pero sin otras ofertas, "Dónde estudiarla" no se dibuja', () => {
    renderSheet(BASE, [], {
      comparison: {
        groupName: null,
        cityLabel: 'San Miguel de Tucumán',
        isProvinceFallback: false,
        offerings: [offering({ careerId: BASE.careerId, universityName: 'UNSTA' })],
      },
    });

    expect(screen.queryByText('Dónde estudiarla')).not.toBeInTheDocument();
  });

  it('sin plan vigente y sin comparación, la columna derecha no se dibuja', () => {
    const { container } = renderSheet(BASE);

    expect(container.querySelector('.pb-dossier')).not.toBeInTheDocument();
  });

  it('no ofrece ningún pie para reseñar: el botón de escribir reseña vive en el topbar', () => {
    renderSheet(BASE);

    expect(screen.queryByRole('link', { name: /reseñá tu cursada/i })).not.toBeInTheDocument();
  });

  it('no publica ningún puntaje ni escala', () => {
    const { container } = renderSheet(BASE);

    expect(container.textContent).not.toMatch(/★|puntaje|promedio de|\/ 5/i);
  });

  /**
   * ADR-0084: una nota de curaduría se muestra fechada y con su procedencia siempre al lado,
   * nunca un texto suelto sin decir de dónde sale, entre comillas tipográficas (maqueta aprobada).
   */
  it('publica la nota del equipo entre comillas, con su procedencia y su fecha', () => {
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

    expect(
      screen.getByText('“Varias cursadas mencionan que no se sabe con qué se rinde el final.”'),
    ).toBeInTheDocument();
    expect(screen.getByText(/leída de comentarios que no se publican/i)).toBeInTheDocument();
    expect(screen.getByText(/19\/08\/2026/)).toBeInTheDocument();
  });

  it('sin notas no dibuja el bloque, en vez de decir que no hay ninguna', () => {
    renderSheet(BASE);

    expect(screen.queryByText(/de la curaduría/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/nota del equipo/i)).not.toBeInTheDocument();
  });
});
