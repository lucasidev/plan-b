import type {
  AcademicPeriod,
  CalendarBlock,
  CommissionOption,
  Simulation,
  Subject,
} from '../types';

/**
 * Mock data alineado al canvas v2 (`v2-shell.jsx::V2_ACTIVE`, `v2-screens.jsx::V2MiniCalendar`).
 * Cuando aterrice US-016 + US-023, esto se reemplaza por fetch real al backend.
 *
 * Todo este archivo es **placeholder data, no del dominio real**. No se usa en producción
 * cuando el backend exista; vive solo para la maqueta visual de la US-046.
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

const ACTIVE_BLOCKS: CalendarBlock[] = [
  { day: 0, h: 14, dur: 4, code: 'INT302', mod: '1c', warn: false },
  { day: 0, h: 18, dur: 4, code: 'ISW302', mod: '1c', warn: false },
  { day: 1, h: 18, dur: 4, code: 'MAT401', mod: 'anual', warn: true },
  { day: 1, h: 19, dur: 3, code: 'MOV302', mod: '1c', warn: true },
  { day: 2, h: 18, dur: 4, code: 'ISW302', mod: '1c', warn: false },
  { day: 3, h: 19, dur: 3, code: 'SEG302', mod: '1c', warn: false },
  { day: 4, h: 14, dur: 4, code: 'INT302', mod: '1c', warn: false },
  { day: 4, h: 19, dur: 3, code: 'MOV302', mod: '1c', warn: false },
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

const DRAFT_2027_BLOCKS: CalendarBlock[] = [
  { day: 0, h: 14, dur: 4, code: 'ISW401', mod: '1c', warn: false },
  { day: 0, h: 18, dur: 4, code: 'ALG402', mod: '1c', warn: false },
  { day: 1, h: 14, dur: 4, code: 'ARQ301', mod: '1c', warn: false },
  { day: 2, h: 18, dur: 4, code: 'BD402', mod: '1c', warn: false },
  { day: 3, h: 14, dur: 4, code: 'PRO402', mod: '1c', warn: false },
  { day: 4, h: 18, dur: 4, code: 'ALG402', mod: '1c', warn: false },
];

export const MOCK_ACTIVE_SIMULATION: Simulation = {
  id: 'sim-active-2026-1c',
  status: 'active',
  period: PERIOD_2026_1C,
  label: '2026 · primer cuatrimestre',
  subjects: ACTIVE_SUBJECTS,
  blocks: ACTIVE_BLOCKS,
  stats: { weeklyHours: 25, clashes: 1, avgDiff: 3.8, expectedApproval: 0.52 },
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

/**
 * Catálogo de materias agregables al borrador. Mock simple: 8 materias cursables según el
 * plan del alumno (filtro real sale del backend US-014 + US-023). Subset del catálogo del
 * canvas v2.
 */
export const MOCK_AVAILABLE_SUBJECTS: Subject[] = [
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
  { code: 'REI401', name: 'Redes Inalámbricas', mod: '2c', com: 'A', prof: 'Sosa', diff: 3 },
  {
    code: 'IOT401',
    name: 'IoT y Sistemas Embebidos',
    mod: '2c',
    com: 'A',
    prof: 'Castro',
    diff: 4,
  },
  { code: 'OPT401', name: 'Optativa Humanística', mod: 'anual', com: 'A', prof: 'Méndez', diff: 1 },
];

/**
 * Opciones de comisión para el comparador. Hoy hardcoded; cuando aterricen reseñas + crowd
 * insights, el cálculo viene del backend.
 */
export const MOCK_COMMISSION_OPTIONS_INT302: CommissionOption[] = [
  {
    com: 'A',
    prof: 'Iturralde',
    schedule: 'Lun 14-18, Vie 14-18',
    insights: { diff: 4.1, workload: 9, approval: 0.55, reviewsCount: 24 },
  },
  {
    com: 'B',
    prof: 'Vázquez',
    schedule: 'Mar 18-22',
    insights: { diff: 3.4, workload: 6, approval: 0.71, reviewsCount: 18 },
  },
  {
    com: 'C',
    prof: 'Méndez',
    schedule: 'Jue 14-18',
    insights: { diff: 3.9, workload: 7, approval: 0.62, reviewsCount: 11 },
  },
];

export { PERIOD_2026_1C, PERIOD_2026_2C, PERIOD_2027_1C };
