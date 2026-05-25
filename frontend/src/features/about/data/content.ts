/**
 * Contenido estático de la página "Sobre plan-b" (US-074). Hardcoded en frontend porque es
 * copy del producto, no datos del dominio. Si crece, evaluar pasar a CMS o MD servido del
 * repo (decisión para cuando exista la US del CMS).
 *
 * Disclaimer académico: Lucas Iriarte es el único autor. UNSTA + Ing. Elio Copas son
 * contexto académico (proyecto final), no co-authors. Los nombres del mockup
 * (Juan Manuel R., Sofía C., Matías V.) eran placeholders del canvas; los reemplazamos
 * por la realidad del proyecto.
 */

export const ABOUT_HEADLINE = 'Estamos haciendo la app que nos hubiera gustado tener.';

export const ABOUT_LEDE =
  'plan-b es una herramienta de planificación académica hecha por estudiantes, para estudiantes.';

/**
 * Manifiesto en bloques. Cada elemento es un párrafo. El último lleva el disclaimer en
 * itálica (lo marcamos con `kind: 'disclaimer'`).
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
 * "Lo que viene" — roadmap a alto nivel. Cuando el roadmap esté maduro y exista CMS, esto
 * sale de ahí. Por ahora alineado a la cartera de US del MVP (US-016, US-017, US-018, etc).
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
 * Equipo: Lucas como autor. UNSTA + Ing. Copas como contexto académico (no team members).
 * Cuando sumemos colaboradores externos (open source contributors), entran acá.
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
 * Stats hardcoded. Cuando aterrice `GET /api/stats/public` (US separada cross-module),
 * estos valores salen del backend y la card pasa a ser RSC con fetch.
 */
export const ABOUT_STATS = {
  alumnos: '340',
  reseñas: '1.247',
  docentes: '87',
  version: 'v0.2',
} as const;

export const ABOUT_REPO_URL = 'https://github.com/lucasidev/plan-b';

/**
 * Universidades soportadas. Mientras no exista `GET /api/universities/public` (deuda
 * documentada en US-074), la lista vive hardcoded acá. La fuente real es la tabla
 * `universities` de Academic; cuando aterrice el endpoint este array se reemplaza por
 * un fetch RSC cacheado 24h.
 */
export const ABOUT_UNIVERSITIES: readonly string[] = [
  'Universidad del Norte Santo Tomás de Aquino (UNSTA)',
  'Universidad Siglo 21',
  'Universidad San Pablo-T (USPT)',
] as const;
