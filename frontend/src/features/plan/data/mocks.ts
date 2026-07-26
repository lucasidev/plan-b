import type { AcademicPeriod, CalendarWeekBlock, Simulation, Subject } from '../types';

/**
 * Mock data aligned with the v2 canvas (`v2-shell.jsx::V2_ACTIVE`,
 * `v2-screens.jsx::V2MiniCalendar`). When US-023 (draft/active storage) lands, this is replaced by
 * a real fetch to the backend.
 *
 * The whole file is **placeholder data, not real domain**: `MOCK_DRAFTS` still stands in for
 * borradores (US-023 has no backend yet). `MOCK_ACTIVE_SIMULATION` only keeps its `subjects`
 * (mock "Materias del año" list) and `period`/`label` for the same reason; its `blocks`/`stats`
 * are dead weight the `Simulation` type still requires (see the comment on the constant itself):
 * the "En curso" tab's calendar and metrics now come from `POST /api/me/simulator/evaluate`
 * (US-016 + US-096), not from here.
 */

const PERIOD_2026_1C: AcademicPeriod = {
  year: 2026,
  term: '1c',
  startsAt: '2026-03-09',
  endsAt: '2026-07-05',
};

const PERIOD_2026_2C: AcademicPeriod = {
  year: 2026,
  term: '2c',
  startsAt: '2026-08-03',
  endsAt: '2026-11-22',
};

const PERIOD_2027_1C: AcademicPeriod = {
  year: 2027,
  term: '1c',
  startsAt: '2027-03-08',
  endsAt: '2027-07-04',
};

const ACTIVE_SUBJECTS: Subject[] = [
  {
    code: 'ISW302',
    name: 'Ingeniería de Software II',
    mod: '1c',
    com: 'A',
    prof: 'Brandt',
    diff: 4,
    week: 8,
    weeks: 16,
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
  },
  {
    code: 'MOV302',
    name: 'Programación Móvil',
    mod: '1c',
    com: 'A',
    prof: 'Castro',
    diff: 3,
    week: 8,
    weeks: 16,
  },
];

const DRAFT_2027_SUBJECTS: Subject[] = [
  {
    code: 'ISW401',
    name: 'Arquitectura de Software',
    mod: '1c',
    com: 'A',
    prof: 'Brandt',
    diff: 4,
  },
  {
    code: 'ARQ301',
    name: 'Arquitectura de Computadoras',
    mod: '1c',
    com: 'B',
    prof: 'Reynoso',
    diff: 4,
  },
  { code: 'ALG402', name: 'Algoritmos Avanzados', mod: '1c', com: 'A', prof: 'Iturralde', diff: 5 },
  { code: 'PRO402', name: 'Project Management', mod: '1c', com: 'A', prof: 'López', diff: 2 },
  {
    code: 'BD402',
    name: 'Bases de Datos Distribuidas',
    mod: '1c',
    com: 'A',
    prof: 'Castellanos',
    diff: 4,
  },
];

const DRAFT_2027_BLOCKS: CalendarWeekBlock[] = [
  { subjectCode: 'ISW401', day: 'Monday', start: '14:00', end: '18:00', clashing: false },
  { subjectCode: 'ALG402', day: 'Monday', start: '18:00', end: '22:00', clashing: false },
  { subjectCode: 'ARQ301', day: 'Tuesday', start: '14:00', end: '18:00', clashing: false },
  { subjectCode: 'BD402', day: 'Wednesday', start: '18:00', end: '22:00', clashing: false },
  { subjectCode: 'PRO402', day: 'Thursday', start: '14:00', end: '18:00', clashing: false },
  { subjectCode: 'ALG402', day: 'Friday', start: '18:00', end: '22:00', clashing: false },
];

// `blocks`/`stats` no tienen consumidor real en el tab "En curso" (US-096: el calendario y las
// métricas de esa tab ahora salen de POST /api/me/simulator/evaluate, cableado a las comisiones
// que el alumno elige en la sesión, no a este mock). Se dejan en su valor vacío porque el tipo
// `Simulation` los sigue pidiendo: todavía es compartido con los borradores (`MOCK_DRAFTS` abajo),
// que sí los usan de mock hasta que exista el backend de US-023.
export const MOCK_ACTIVE_SIMULATION: Simulation = {
  id: 'sim-active-2026-1c',
  status: 'active',
  period: PERIOD_2026_1C,
  label: '2026 · primer cuatrimestre',
  subjects: ACTIVE_SUBJECTS,
  blocks: [],
  stats: { weeklyHours: 0, clashes: 0, avgDiff: 0, expectedApproval: 0 },
};

export const MOCK_DRAFTS: Simulation[] = [
  {
    id: 'sim-draft-2027-1c',
    status: 'draft',
    period: PERIOD_2027_1C,
    label: 'Borrador 2027 · 1c',
    subjects: DRAFT_2027_SUBJECTS,
    blocks: DRAFT_2027_BLOCKS,
    stats: { weeklyHours: 21, clashes: 0, avgDiff: 3.8, expectedApproval: 0.58 },
  },
  {
    id: 'sim-draft-2027-1c-alt',
    status: 'draft',
    period: PERIOD_2027_1C,
    label: '2027 · alternativa (carga liviana)',
    subjects: DRAFT_2027_SUBJECTS.slice(0, 4),
    blocks: DRAFT_2027_BLOCKS.slice(0, 5),
    stats: { weeklyHours: 17, clashes: 0, avgDiff: 3.3, expectedApproval: 0.66 },
  },
];

export { PERIOD_2026_1C, PERIOD_2026_2C, PERIOD_2027_1C };
