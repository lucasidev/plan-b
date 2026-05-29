import type { CursadaContext, ReviewAnonymousIdentity } from '../types';

/**
 * Mock del contexto de la cursada que se está reseñando (`V2_EDITOR_CTX` del canvas).
 * Mientras el endpoint `GET /api/me/pending-reviews/:cursadaId` no exista (US-048 backend
 * + US futura del rework de Review), el editor lo levanta desde acá. Cuando aterrice la
 * data real, se resuelve por `[cursadaId]` y este mock queda como fallback de demo.
 */
export const MOCK_CURSADA_CONTEXT: CursadaContext = {
  id: 'cursada-mock-isw301-brandt-2025-2c',
  matCode: 'ISW301',
  matName: 'Ingeniería de Software I',
  prof: 'Brandt, Carlos',
  com: 'A',
  period: '2025·2c',
  finalNote: 8,
};

/**
 * Identidad pseudónima que se muestra en el preview lateral. Alineada al ADR-0009: solo
 * año en carrera + carrera + período cursado. Cuando aterrice StudentProfile real con el
 * año del alumno, se lee de session.
 */
export const MOCK_ANONYMOUS_IDENTITY: ReviewAnonymousIdentity = {
  year: 4,
  career: 'Sistemas',
  period: '2025·2c',
};

/**
 * Set de tags pre-seleccionables del canvas (`V2_TAGS` en `v2-screens-4.jsx`). Marcado
 * como ejemplo en ADR-0041: el set definitivo se decide en una US separada. Mantener
 * tipado readonly para que el chip selector valide contra esto.
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

/** Labels semánticas que acompañan al rating 1..5 (al lado de las estrellas). */
export const RATING_LABELS = ['', 'mala', 'regular', 'aceptable', 'buena', 'excelente'] as const;

/** Labels semánticas que acompañan a difficulty 1..5 (debajo de cada step). */
export const DIFFICULTY_LABELS = [
  'muy fácil',
  'fácil',
  'justa',
  'exigente',
  'muy exigente',
] as const;
