/**
 * Static content for the "About plan-b" page (US-074). Hardcoded in the frontend
 * because it is product copy, not domain data. If it grows, consider moving to a CMS or
 * to Markdown served from the repo (a call for when the CMS US exists).
 *
 * Academic disclaimer: Lucas Iriarte is the sole author. UNSTA + Ing. Elio Copas are
 * academic context (final project), not co-authors. The names from the mockup (Juan
 * Manuel R., Sofía C., Matías V.) were canvas placeholders; we replaced them with the
 * project's reality.
 */

export const ABOUT_HEADLINE = 'Estamos haciendo la app que nos hubiera gustado tener.';

export const ABOUT_LEDE =
  'plan-b es una herramienta de planificación académica hecha por estudiantes, para estudiantes.';

/**
 * Manifesto as blocks. Each item is a paragraph. The last one carries the disclaimer in
 * italics (marked with `kind: 'disclaimer'`).
 */
export type ManifestoBlock = {
  kind: 'paragraph' | 'disclaimer';
  text: string;
};

export const ABOUT_MANIFESTO: readonly ManifestoBlock[] = [
  {
    kind: 'paragraph',
    text: 'La universidad te da un PDF con materias y una fecha de inscripción. Lo que pasa entre medio: qué cursar, con quién, en qué orden, cuántas juntas se aguantan, lo resolvés solo o preguntando en grupos de WhatsApp.',
  },
  {
    kind: 'paragraph',
    text: 'plan-b junta esa info en un lugar. Tu plan, las reseñas reales de quienes ya cursaron, los choques de horario, los docentes que recomiendan tus compañeros. Para que decidir tu próximo cuatrimestre deje de ser una apuesta.',
  },
  {
    kind: 'disclaimer',
    text: 'No estamos afiliados oficialmente a ninguna universidad. Es una herramienta independiente, hecha por alumnos en sus ratos libres. Cada facu que sumamos la cargamos nosotros.',
  },
] as const;

/**
 * "Lo que viene": a high-level roadmap. When the roadmap is mature and a CMS exists,
 * this will come from there. For now it is aligned with the MVP US backlog (US-016,
 * US-017, US-018, etc).
 */
export type RoadmapItem = {
  when: string;
  what: string;
};

export const ABOUT_ROADMAP: readonly RoadmapItem[] = [
  {
    when: 'Ahora',
    what: 'Reseñas validadas, planificador con detección de choques, rankings.',
  },
  {
    when: 'Próximo mes',
    what: 'Importación automática del SIU. Comparador de comisiones lado a lado.',
  },
  {
    when: 'Más adelante',
    what: 'Recomendaciones personalizadas según tu plan y desempeño.',
  },
] as const;

/**
 * Team: Lucas as author. UNSTA + Ing. Copas as academic context (not team members).
 * When external collaborators (open-source contributors) join, they go here.
 */
export type TeamMember = {
  initials: string;
  name: string;
  role: string;
};

export const ABOUT_TEAM: readonly TeamMember[] = [
  {
    initials: 'LI',
    name: 'Lucas Iriarte',
    role: 'Autor · Tecnicatura en Desarrollo y Calidad de Software, UNSTA',
  },
] as const;

export const ABOUT_ACADEMIC_CONTEXT =
  'Proyecto Final 2026 · Tutor: Ing. Elio Copas · Universidad del Norte Santo Tomás de Aquino (UNSTA), Tucumán.';

/**
 * Hardcoded stats. When `GET /api/stats/public` lands (separate cross-module US), these
 * values come from the backend and the card switches to RSC with fetch.
 */
export const ABOUT_STATS = {
  students: '340',
  reviews: '1.247',
  teachers: '87',
  version: 'v0.2',
} as const;

export const ABOUT_REPO_URL = 'https://github.com/lucasidev/plan-b';

/**
 * Supported universities. Until `GET /api/universities/public` exists (debt documented
 * in US-074), the list lives hardcoded here. The real source is the `universities`
 * table from Academic; once the endpoint lands, this array is replaced by an RSC fetch
 * cached for 24h.
 */
export const ABOUT_UNIVERSITIES: readonly string[] = [
  'Universidad del Norte Santo Tomás de Aquino (UNSTA)',
  'Universidad Siglo 21',
  'Universidad San Pablo-T (USPT)',
] as const;
