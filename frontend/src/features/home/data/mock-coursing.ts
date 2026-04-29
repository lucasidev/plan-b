/**
 * Materias "Cursando ahora" del home, hardcoded del mockup
 * `screens.jsx::HomeView` (filter `states[s.code]==='coursing'` sobre el
 * array `SUBJECTS`).
 *
 * Cuando aterrice cargar historial (US-013) y el simulador (US-016), esta
 * lista se reemplaza por una query a `EnrollmentRecord` filtrando por
 * `status='cursando'` del término actual del alumno.
 */
export type CoursingSubject = {
  readonly code: string;
  readonly name: string;
  /** Dificultad 1..5 para los DiffDots. */
  readonly diff: number;
  /** Cantidad de reseñas published para esta materia. */
  readonly reviews: number;
};

export const homeCoursing: readonly CoursingSubject[] = [
  { code: 'ISW301', name: 'Ingeniería de Software I', diff: 3, reviews: 23 },
  { code: 'WEB301', name: 'Desarrollo Web', diff: 3, reviews: 31 },
  { code: 'BDD301', name: 'Bases de Datos II', diff: 4, reviews: 18 },
  { code: 'INT301', name: 'Inteligencia Artificial I', diff: 4, reviews: 12 },
] as const;
