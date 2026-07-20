/**
 * Mock domain types for Planificar (US-046). Aligned with the v2 canvas mock data
 * (`v2-shell.jsx::V2_ACTIVE`, `v2-screens.jsx::V2MiniCalendar`).
 *
 * Once the real backend lands (US-016 simulation + US-023 storage), these types will
 * couple to the API DTOs. For now they are pure mocks with a stable shape.
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
 * Block in the weekly calendar. Day 0=Mon, 4=Fri. `h` is the start hour (24h). `dur`
 * in hours. `warn` highlights clashes.
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
 * Alternative commission for the comparator. Insights are derived from the
 * crowdsourced corpus when it lands (US-024); mock for now.
 */
export type CommissionOption = {
  com: string;
  prof: string;
  schedule: string;
  insights: {
    /** Average difficulty per reviews (0-5). */
    diff: number;
    /** Estimated weekly workload in hours. */
    workload: number;
    /** % expected approval. */
    approval: number;
    /** Number of reviews backing the insights. */
    reviewsCount: number;
  };
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
  blocks: CalendarBlock[];
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

/**
 * A plan subject evaluated by the simulator (US-016). Mirrors `AvailableSubjectItem`. No `mod`
 * (modality) nor teacher: those belong to Commission (a term's actual offering), not Subject. The
 * backend does not expose them here on purpose; they come back once the commission backoffice
 * (US-093) exists.
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
};

/** Wrapper of the `GET /api/me/simulator/available` response. */
export type AvailableSubjectsResponse = {
  items: AvailableSubject[];
};
