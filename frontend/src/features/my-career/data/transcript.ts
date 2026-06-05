/**
 * Mock del historial académico para el tab "Historial" de Mi carrera
 * (US-045-e). Port literal del canvas
 * `canvas-mocks/v2-screens-3.jsx::V2_HIST`.
 *
 * Cuando aterrice el backend real, esto se reemplaza por:
 *   - `GET /api/me/enrollments?grouped=true` (Enrollments BC, futuro).
 *
 * Estructura por período (más reciente primero). Cada entrada tiene 2
 * estados visuales: `aprob` (verde) o `recurso` (naranja). Mas tipos
 * del lifecycle (libre, regular, pendiente) no se modelan acá porque
 * el canvas no los muestra; cuando Enrollments exponga más estados,
 * evaluar mapping visual.
 */

export type HistorialState = 'aprob' | 'recurso';

export type HistorialEntry = {
  code: string;
  name: string;
  state: HistorialState;
  /** Nota final 1-10. null si state='recurso'. */
  grade: number | null;
  /** Apellido del docente (display). */
  teacher: string;
};

export type HistorialPeriod = {
  /** Etiqueta human-readable del período (ej. `2025·2c`). */
  period: string;
  /** Promedio del período (precomputado en el mock). */
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
