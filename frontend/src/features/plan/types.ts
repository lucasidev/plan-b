/**
 * Mock domain types for Planificar (US-046). Aligned with the v2 canvas mock data
 * (`v2-shell.jsx::V2_ACTIVE`, `v2-screens.jsx::V2MiniCalendar`).
 *
 * The "active" simulation (subjects del año, período, label) sigue siendo mock: la persistencia
 * real de qué está cursando el alumno es US-023, todavía no existe backend. Los tipos reales del
 * simulador (materias disponibles, evaluar combinación, comisiones) empiezan más abajo.
 */

export type Modality = '1c' | '2c' | 'anual' | 'bim1' | 'bim2' | 'bim3' | 'bim4';

export type DiffLevel = 1 | 2 | 3 | 4 | 5;

/**
 * Academic period (year + term). The "current period" is a single one; drafts
 * reference future periods.
 */
export type AcademicPeriod = {
  year: number;
  term: '1c' | '2c';
  /** ISO date (YYYY-MM-DD). Mocked; will come from the AcademicTerm backoffice (US-064) when it exists. */
  startsAt: string;
  endsAt: string;
};

export type Subject = {
  code: string;
  name: string;
  mod: Modality;
  /** Assigned commission. */
  com: string;
  /** Main teacher to display. */
  prof: string;
  diff: DiffLevel;
  /** "8 of 16" in the mockup; current week / total. */
  week?: number;
  weeks?: number;
};

/**
 * Block in the weekly calendar (US-096), decoupled from the mock `CalendarBlock` shape it
 * replaces: `day` is the weekday name the backend serializes (`"Monday"`..`"Sunday"`, only
 * Monday-Friday actually render, see `lib/calendar-blocks.ts`), `start`/`end` are `"HH:mm"`. Real
 * data (`SimulationScheduleBlock` below) is a structural superset of this shape, so the evaluate
 * response's `schedule` can be passed to `CalendarWeek` without mapping. Mock draft data
 * (`data/mocks.ts`) is written directly in this shape too: one calendar component, one contract.
 */
export type CalendarWeekBlock = {
  subjectCode: string;
  day: string;
  start: string;
  end: string;
  clashing: boolean;
};

/**
 * Simulation (draft or active). A single entity with `status`: the "promote" is a
 * flip, not a copy (ADR pending; spec in the US-046 doc).
 */
export type Simulation = {
  id: string;
  status: 'active' | 'draft' | 'archived';
  period: AcademicPeriod;
  label: string;
  subjects: Subject[];
  blocks: CalendarWeekBlock[];
  /** Precomputed aggregate stats for the active tab header. */
  stats: {
    weeklyHours: number;
    clashes: number;
    avgDiff: number;
    expectedApproval: number;
  };
};

/**
 * Real backend types for the "Agregar materia" drawer (US-016). Unlike the mock types above,
 * these mirror actual DTOs from `GET /api/me/simulator/available` (Planb.Planning.Application).
 */

/**
 * Why a subject can or cannot be taken next term. Same names as the enum the backend serializes
 * (`AvailabilityStatus`): translating to student-facing text is the frontend's job.
 */
export type AvailabilityStatus =
  | 'Available'
  | 'Blocked'
  | 'AlreadyPassed'
  | 'AlreadyRegularized'
  | 'InProgress';

/** A `para_cursar` prerequisite the student has not fulfilled yet. Mirrors `BlockedBySubjectItem`. */
export type BlockedBySubject = {
  id: string;
  code: string;
  name: string;
};

/** A weekly slot of a commission's schedule. Mirrors `SimulatorScheduleItem`: day as the enum name
 * (`"Monday"`..`"Sunday"`), hours as `"HH:mm"`. */
export type CommissionScheduleSlot = {
  day: string;
  start: string;
  end: string;
};

/**
 * A commission actually offered for a subject in a given term (US-096). Mirrors
 * `AvailableCommissionItem`. Only populated when the caller of `/available` passed a `termId`;
 * otherwise every subject's `commissions` travels empty (see `AvailableSubject` below).
 */
export type AvailableCommission = {
  id: string;
  name: string;
  modality: string;
  capacity: number | null;
  teacherNames: string[];
  schedule: CommissionScheduleSlot[];
};

/**
 * A plan subject evaluated by the simulator (US-016). Mirrors `AvailableSubjectItem`.
 * `commissions` (US-096) is the term's actual offering for this subject: empty when the caller of
 * `/available` did not pass a `termId`, populated (with teachers + schedule) when it did.
 */
export type AvailableSubject = {
  id: string;
  code: string;
  name: string;
  yearInPlan: number;
  termInYear: number | null;
  termKind: string;
  weeklyHours: number;
  totalHours: number;
  status: AvailabilityStatus;
  blockedBy: BlockedBySubject[];
  commissions: AvailableCommission[];
};

/** Wrapper of the `GET /api/me/simulator/available` response. */
export type AvailableSubjectsResponse = {
  items: AvailableSubject[];
};

/**
 * Período lectivo de una universidad (US-096). Mirrors `AcademicTermListItem`
 * (`GET /api/academic/academic-terms?universityId=`). Las fechas las expone el catálogo público
 * desde US-096: son las que deciden cuál es "el período que viene", el default del planificador
 * (ver `pickDefaultTerm` en `lib/default-term.ts`).
 */
export type AcademicTerm = {
  id: string;
  universityId: string;
  year: number;
  number: number;
  kind: string;
  label: string;
  /** ISO date (YYYY-MM-DD). */
  startDate: string;
  endDate: string;
};

/** La comisión que el alumno eligió para una materia de la combinación. Mirrors `CommissionChoice`. */
export type CommissionChoice = {
  subjectId: string;
  commissionId: string;
};

/**
 * Selección de una materia en la simulación (US-096): la materia siempre está (viene del drawer
 * "Agregar materia"), la comisión es opcional (estado válido: cuenta para horas/dificultad pero no
 * para choques hasta que se elija una).
 */
export type CommissionSelection = {
  subjectId: string;
  commissionId: string | null;
};

/**
 * Real backend types for the metrics panel (US-016). Mirror `POST /api/me/simulator/evaluate`
 * (`Planb.Planning.Application.Features.EvaluateSimulation`).
 */

/**
 * A schedule block of a chosen commission (US-096), ready for the weekly calendar. Mirrors
 * `SimulationScheduleBlock`. Structural superset of `CalendarWeekBlock` (adds `subjectId`,
 * `commissionId`, `commissionName`): `CalendarWeek` can render this array directly.
 */
export type SimulationScheduleBlock = {
  subjectId: string;
  subjectCode: string;
  commissionId: string;
  commissionName: string;
  day: string;
  start: string;
  end: string;
  clashing: boolean;
};

/**
 * Result of evaluating a subject combination. Mirrors `EvaluateSimulationResponse`. When
 * `isValid` is false no metric was computed: they travel at their default (0 hours, null
 * difficulty, cohort at 0/null, `schedule` empty, `clashes` null); what matters to show in that
 * case is `blockedSubjects`.
 *
 * `clashes` (US-096) is `null` when NO subject in the combination has a commission chosen ("we
 * don't know", never "zero clashes"); with at least one commission chosen it is the real count
 * (can be 0). Same honesty rule as `weightedDifficulty`. See `EvaluateSimulationResponse` on the
 * backend for the exact wording.
 */
export type SimulationEvaluation = {
  isValid: boolean;
  blockedSubjects: BlockedSubjectEvaluation[];
  totalWeeklyHours: number;
  totalHours: number;
  weightedDifficulty: number | null;
  combinationStats: CombinationCohortStats;
  schedule: SimulationScheduleBlock[];
  clashes: number | null;
};

/**
 * A blocked subject from the evaluated subset, with the `para_cursar` prerequisite it is still
 * missing. Mirrors `BlockedSubjectItem`. `blockedBy` reuses `BlockedBySubject`: same shape
 * (`id`, `code`, `name`) as the drawer's prerequisite list.
 */
export type BlockedSubjectEvaluation = {
  id: string;
  code: string;
  name: string;
  blockedBy: BlockedBySubject[];
};

/**
 * How many other students took exactly this combination and how it went for them (US-016).
 * Mirrors `CombinationCohortStats`. `passRate`/`dropoutRate` travel null when `sampleSize` is
 * under the anti-reidentification floor (ADR-0047, N < 5): in that case the UI still shows the
 * sample size, never the rate (same policy as `SubjectPassRate` in view-subject, but surfacing
 * the N instead of hiding it entirely).
 */
export type CombinationCohortStats = {
  sampleSize: number;
  passRate: number | null;
  dropoutRate: number | null;
};
