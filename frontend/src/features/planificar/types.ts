/**
 * Tipos del dominio mock de Planificar (US-046). Alineados al canvas v2 mock data
 * (`v2-shell.jsx::V2_ACTIVE`, `v2-screens.jsx::V2MiniCalendar`).
 *
 * Cuando aterrice el backend real (US-016 simulación + US-023 storage), estos tipos van a
 * acoplarse a los DTOs del API. Por ahora son mocks puros con shape estable.
 */

export type Modality = '1c' | '2c' | 'anual' | 'bim1' | 'bim2' | 'bim3' | 'bim4';

export type DiffLevel = 1 | 2 | 3 | 4 | 5;

/**
 * Período académico (año + cuatri). El "período en curso" es uno solo; los borradores
 * referencian periods futuros.
 */
export type AcademicPeriod = {
  year: number;
  term: '1c' | '2c';
  /** ISO date (YYYY-MM-DD). Mockeado; vendrá del backoffice AcademicTerm (US-064) cuando exista. */
  startsAt: string;
  endsAt: string;
};

export type Subject = {
  code: string;
  name: string;
  mod: Modality;
  /** Comisión asignada. */
  com: string;
  /** Docente principal mostrable. */
  prof: string;
  diff: DiffLevel;
  /** "8 de 16" en el mockup; semana en curso / total. */
  week?: number;
  weeks?: number;
};

/**
 * Bloque en el calendario semanal. Day 0=Lun, 4=Vie. `h` es hora de inicio (24h). `dur` en
 * horas. `warn` resalta choques.
 */
export type CalendarBlock = {
  day: 0 | 1 | 2 | 3 | 4;
  h: number;
  dur: number;
  code: string;
  mod: Modality;
  warn: boolean;
};

/**
 * Comisión alternativa para el comparador. Insights son derivados del corpus crowdsourced
 * cuando aterrice (US-024); por ahora mock.
 */
export type CommissionOption = {
  com: string;
  prof: string;
  schedule: string;
  insights: {
    /** Dificultad promedio según reseñas (0-5). */
    diff: number;
    /** Carga semanal estimada en horas. */
    workload: number;
    /** % de aprobación esperada. */
    approval: number;
    /** Cantidad de reseñas que respaldan los insights. */
    reviewsCount: number;
  };
};

/**
 * Simulación (borrador o activo). Una sola entidad con `status`: el "promote" es un flip,
 * no copia (ADR pendiente; spec en doc de US-046).
 */
export type Simulation = {
  id: string;
  status: 'active' | 'draft' | 'archived';
  period: AcademicPeriod;
  label: string;
  subjects: Subject[];
  blocks: CalendarBlock[];
  /** Stats agregados precomputados para el header del tab en curso. */
  stats: {
    weeklyHours: number;
    clashes: number;
    avgDiff: number;
    expectedApproval: number;
  };
};
