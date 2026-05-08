import type { Modality } from '../components/mod-pill';

/**
 * Materia que el alumno está cursando o que arranca pronto en el período
 * actual. Shape espejada del mock `v2-shell.jsx::V2_ACTIVE`. `week=0`
 * significa "no arrancó todavía" (futura). Diff y attendance son
 * porcentajes / valores entre 0 y 1.
 *
 * Cuando aterricen US-013 (cargar historial) + US-016 (simular inscripción)
 * + el catálogo Academic con comisiones reales, este file reemplaza su mock
 * por un fetch a `EnrollmentRecord` (Enrollments BC) joineado con `Subject`
 * y `Commission` (Academic BC). El shape no cambia.
 */
export type ActiveSubject = {
  code: string;
  name: string;
  mod: Modality;
  /** Letra de comisión (ej. "A", "B", "C"). */
  com: string;
  /** Apellido del docente principal. */
  prof: string;
  /** Dificultad percibida del 1 al 5 (cuando aterrice tracking de UX, se enchufa fuente real). */
  diff: 1 | 2 | 3 | 4 | 5;
  /** Semana actual del cuatri/anual. 0 indica que la materia arranca después. */
  week: number;
  /** Duración total del cursado en semanas (16 cuatri / 32 anual). */
  weeks: number;
  /** Próximo evento relevante en string ya formateado (ej. "Parcial · 12 may", "arranca el 5 ago"). */
  next: string;
  /** Asistencia acumulada como fracción 0-1. `null` si la materia no arrancó o no se tracquea. */
  attendance: number | null;
  /** Última nota parcial registrada. `null` cuando todavía no hay nota. */
  note: number | null;
};

// TODO: cuando aterricen US-013 + US-016 + endpoint del catálogo Academic
// (US-061 y siguientes), reemplazar este mock por fetch real a
// `GET /api/me/period-subjects` (o equivalente). El shape se mantiene.
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
