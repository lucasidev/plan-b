import type { EnrollmentContext, ReviewAnonymousIdentity } from '../types';

/**
 * Test fixture for the enrollment context (`V2_EDITOR_CTX` in the canvas). The pages now
 * resolve the real context from the pending listing (`/reviews/write`) or the my-reviews
 * listing (`/reviews/edit`); this object is only used by the editor component test as a
 * stable, fully-populated sample (with teacher + commission, which the real listing can
 * not surface until US-063). Not exported from the feature barrel.
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
 * Fallback for the pseudonymous identity rendered in the side preview (ADR-0009: year in
 * career + career + period). The editor fills `period` with the real enrollment period; the
 * `year` and `career` stay placeholders until the session carries them (US-012). The sidebar
 * hardcodes the career name for the same reason, so this stays consistent with the rest of
 * the chrome until that US lands.
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
