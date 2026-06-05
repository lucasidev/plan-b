import type { Modality } from '../components/mod-pill';

/**
 * Subject the student is currently taking or that starts soon in the current period.
 * Shape mirrored from the `v2-shell.jsx::V2_ACTIVE` mock. `week=0` means "not started
 * yet" (future). Diff and attendance are percentages / values between 0 and 1.
 *
 * Once US-013 (transcript load) + US-016 (simulate enrollment) + the Academic catalog
 * with real commissions land, this file swaps its mock for a fetch to
 * `EnrollmentRecord` (Enrollments BC) joined with `Subject` and `Commission` (Academic
 * BC). The shape stays the same.
 */
export type ActiveSubject = {
  code: string;
  name: string;
  mod: Modality;
  /** Commission letter (e.g. "A", "B", "C"). */
  com: string;
  /** Surname of the main teacher. */
  prof: string;
  /** Perceived difficulty from 1 to 5 (once UX tracking lands, real source is plugged in). */
  diff: 1 | 2 | 3 | 4 | 5;
  /** Current week of the term/anual. 0 means the subject starts later. */
  week: number;
  /** Total length of the cursado in weeks (16 term / 32 anual). */
  weeks: number;
  /** Next relevant event as a pre-formatted string (e.g. "Parcial · 12 may", "arranca el 5 ago"). */
  next: string;
  /** Accumulated attendance as a 0-1 fraction. `null` if the subject has not started or attendance is not tracked. */
  attendance: number | null;
  /** Latest partial grade on record. `null` when there is no grade yet. */
  note: number | null;
};

// TODO: once US-013 + US-016 + the Academic catalog endpoint (US-061 and onward) land,
// swap this mock for a real fetch to `GET /api/me/period-subjects` (or equivalent).
// The shape stays the same.
export const activeSubjects: ActiveSubject[] = [
  {
    code: 'ISW302',
    name: 'Ingeniería de Software II',
    mod: '1c',
    com: 'A',
    prof: 'Brandt',
    diff: 4,
    week: 8,
    weeks: 16,
    next: 'Parcial · 12 may',
    attendance: 0.92,
    note: null,
  },
  {
    code: 'INT302',
    name: 'Inteligencia Artificial I',
    mod: '1c',
    com: 'A',
    prof: 'Iturralde',
    diff: 5,
    week: 8,
    weeks: 16,
    next: 'TP1 entrega · 6 may',
    attendance: 0.88,
    note: 7,
  },
  {
    code: 'MAT401',
    name: 'Matemática Aplicada',
    mod: 'anual',
    com: 'A',
    prof: 'Reynoso',
    diff: 4,
    week: 18,
    weeks: 32,
    next: 'Parcial · 22 may',
    attendance: 0.94,
    note: 8,
  },
  {
    code: 'SEG302',
    name: 'Seguridad Informática',
    mod: '1c',
    com: 'B',
    prof: 'Sosa',
    diff: 3,
    week: 8,
    weeks: 16,
    next: 'TP2 · 18 may',
    attendance: 0.81,
    note: null,
  },
  {
    code: 'QUI201',
    name: 'Química General',
    mod: '2c',
    com: 'A',
    prof: 'Méndez',
    diff: 3,
    week: 0,
    weeks: 16,
    next: 'arranca el 5 ago',
    attendance: null,
    note: null,
  },
];
