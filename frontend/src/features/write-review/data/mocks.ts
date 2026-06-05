import type { EnrollmentContext, ReviewAnonymousIdentity } from '../types';

/**
 * Mock of the enrollment context being reviewed (`V2_EDITOR_CTX` in the canvas).
 * Until the `GET /api/me/pending-reviews/:enrollmentId` endpoint exists (US-048 backend
 * + the upcoming Review rework US), the editor reads this. Once the real data lands, it
 * is resolved by `[enrollmentId]` and this mock stays as a demo fallback.
 */
export const MOCK_ENROLLMENT_CONTEXT: EnrollmentContext = {
  id: 'enrollment-mock-isw301-brandt-2025-2c',
  matCode: 'ISW301',
  matName: 'Ingeniería de Software I',
  prof: 'Brandt, Carlos',
  com: 'A',
  period: '2025·2c',
  finalNote: 8,
};

/**
 * Pseudonymous identity rendered in the side preview. Aligned with ADR-0009: only
 * year in career + career + period attended. When the real StudentProfile carries the
 * student year, it is read from the session instead.
 */
export const MOCK_ANONYMOUS_IDENTITY: ReviewAnonymousIdentity = {
  year: 4,
  career: 'Sistemas',
  period: '2025·2c',
};

/**
 * Pre-selectable tag set from the canvas (`V2_TAGS` in `v2-screens-4.jsx`). Marked as
 * an example in ADR-0041: the definitive set is decided in a separate US. Kept readonly
 * so the chip selector type-checks against it.
 */
export const REVIEW_TAGS = [
  'claro explicando',
  'exige pero acompaña',
  'pide mucho',
  'responde tarde',
  'TPs bien armados',
  'parciales justos',
  'parciales difíciles',
  'aprueba justo',
  'cercano con alumnos',
  'flexible con entregas',
  'estructura ordenada',
  'material desactualizado',
] as const;

export type ReviewTag = (typeof REVIEW_TAGS)[number];

/** Semantic labels rendered next to the rating stars (1..5). */
export const RATING_LABELS = ['', 'mala', 'regular', 'aceptable', 'buena', 'excelente'] as const;

/** Semantic labels rendered below each difficulty step (1..5). */
export const DIFFICULTY_LABELS = [
  'muy fácil',
  'fácil',
  'justa',
  'exigente',
  'muy exigente',
] as const;
