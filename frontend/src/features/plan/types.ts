/**
 * Real backend types for Planificar (US-046 shell + US-016/US-096 simulador + US-023 borradores).
 * Cada bloque documenta el endpoint que espeja (Planb.Planning.Application). Ya no quedan tipos
 * mock: US-023 reemplazó al último (`Simulation`/`Subject`/`AcademicPeriod` de la v2 canvas) por
 * los borradores reales de más abajo.
 */

/**
 * Block in the weekly calendar (US-096): `day` es el nombre del día que serializa el backend
 * (`"Monday"`..`"Sunday"`, solo lunes a viernes se renderizan, ver `lib/calendar-blocks.ts`),
 * `start`/`end` son `"HH:mm"`. `SimulationScheduleBlock` (abajo) es un superset estructural de esta
 * forma, así que el `schedule` de la respuesta de evaluate se le puede pasar a `CalendarWeek` sin
 * mapear.
 */
export type CalendarWeekBlock = {
  subjectCode: string;
  day: string;
  start: string;
  end: string;
  clashing: boolean;
};

/**
 * Real backend types for the "Agregar materia" drawer (US-016). Mirror actual DTOs from
 * `GET /api/me/simulator/available` (Planb.Planning.Application).
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

/**
 * Real backend types for los borradores guardados del planificador (US-023). Mirror
 * `Planb.Planning.Application.Features.{Create,Update,List,Promote,Delete}SimulationDraft`.
 */

/** Espeja `SimulationDraftStatus` del backend (serializado como el nombre del enum, en inglés). */
export type SimulationDraftStatus = 'Draft' | 'Active' | 'Archived';

/**
 * Materia de un borrador ya resuelta a code/name (+ comisión elegida, si hay). Mirrors
 * `SimulationDraftListItemSubject`: el read model resuelve esto server-side (Dapper cross-schema)
 * para que la lista se pinte sin pedir nada más por materia/comisión.
 */
export type SimulationDraftItem = {
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  commissionId: string | null;
  commissionName: string | null;
};

/**
 * Un borrador (o el plan activo/archivado) del alumno. Mirrors `SimulationDraftListItem`
 * (`GET /api/me/simulations/drafts`): trae TODOS los estados sin filtrar, el frontend decide cómo
 * agruparlos (Draft -> tab Borradores, Active del período elegido -> tab En curso).
 */
export type SimulationDraft = {
  id: string;
  termId: string;
  label: string | null;
  status: SimulationDraftStatus;
  items: SimulationDraftItem[];
  createdAt: string;
};

/** Wrapper del GET /api/me/simulations/drafts. */
export type ListSimulationDraftsResponse = {
  items: SimulationDraft[];
};

/**
 * Resultado de crear o editar un borrador (US-023). Mutación pura (ADR-0046): el action devuelve
 * el status, el cliente reacciona invalidando queries. Se invoca directo (no vía `useActionState`,
 * no hay `<form>` de por medio: la combinación vive en estado de React, no en FormData), así que no
 * hace falta un estado `'idle'` inicial (mismo criterio que `ToggleResult` de manage-commissions).
 * `id` en success identifica el borrador tocado sin necesitar otro roundtrip.
 */
export type SaveDraftResult =
  | { status: 'success'; id: string }
  | { status: 'error'; message: string };

/** Resultado de borrar un borrador (US-023). */
export type DeleteDraftResult = { status: 'success' } | { status: 'error'; message: string };

/**
 * Resultado de publicar un borrador (US-023). `draftStatus` es el estado que devuelve el backend
 * tras el promote (siempre `'Active'`); nombrado distinto de `status` para no pisar el
 * discriminante de la mutación.
 */
export type PromoteDraftResult =
  | { status: 'success'; draftStatus: SimulationDraftStatus }
  | { status: 'error'; message: string };
