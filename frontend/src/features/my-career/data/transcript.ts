/**
 * Academic-history mock for the "Historial" tab of Mi carrera (US-045-e). Literal port
 * of the canvas `canvas-mocks/v2-screens-3.jsx::V2_HIST`.
 *
 * When the real backend lands, this is replaced by:
 *   - `GET /api/me/enrollments?grouped=true` (Enrollments BC, future).
 *
 * Structure per period (most recent first). Each entry has 2 visual states: `aprob`
 * (green) or `recurso` (orange). More lifecycle states (libre, regular, pendiente) are
 * not modeled here because the canvas does not show them; once Enrollments exposes
 * more states, evaluate the visual mapping.
 */

export type HistorialState = 'aprob' | 'recurso';

export type HistorialEntry = {
  code: string;
  name: string;
  state: HistorialState;
  /** Final grade 1-10. null when state='recurso'. */
  grade: number | null;
  /** Teacher's surname (display). */
  teacher: string;
};

export type HistorialPeriod = {
  /** Human-readable period label (e.g. `2025·2c`). */
  period: string;
  /** Period average (precomputed in the mock). */
  avg: number;
  items: HistorialEntry[];
};

export const historial: HistorialPeriod[] = [
  {
    period: '2025·2c',
    avg: 7.7,
    items: [
      {
        code: 'ISW301',
        name: 'Ingeniería de Software I',
        state: 'aprob',
        grade: 8,
        teacher: 'Brandt',
      },
      { code: 'BD301', name: 'Bases de Datos', state: 'aprob', grade: 7, teacher: 'Castellanos' },
      {
        code: 'ARQ301',
        name: 'Arquitectura de Computadoras',
        state: 'aprob',
        grade: 8,
        teacher: 'Toranzos',
      },
    ],
  },
  {
    period: '2025·1c',
    avg: 7.7,
    items: [
      {
        code: 'ISW201',
        name: 'Ingeniería de Software I (intro)',
        state: 'aprob',
        grade: 8,
        teacher: 'Iturralde',
      },
      { code: 'BD201', name: 'Bases de Datos I', state: 'aprob', grade: 9, teacher: 'Castellanos' },
      { code: 'SO201', name: 'Sistemas Operativos', state: 'aprob', grade: 7, teacher: 'Sosa' },
    ],
  },
  {
    period: '2024·2c',
    avg: 7.0,
    items: [
      { code: 'PRG201', name: 'Programación II', state: 'aprob', grade: 8, teacher: 'García' },
      {
        code: 'MAT201',
        name: 'Análisis Matemático II',
        state: 'aprob',
        grade: 6,
        teacher: 'López',
      },
    ],
  },
  {
    period: '2024·1c',
    avg: 8.0,
    items: [
      { code: 'MAT102', name: 'Análisis Matemático I', state: 'aprob', grade: 7, teacher: 'López' },
      { code: 'ALG101', name: 'Álgebra', state: 'aprob', grade: 8, teacher: 'Pérez' },
      { code: 'INT101', name: 'Intro a Sistemas', state: 'aprob', grade: 9, teacher: 'Castro' },
      { code: 'PRG101', name: 'Programación I', state: 'recurso', grade: null, teacher: 'García' },
    ],
  },
];
