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
  'plan-b junta lo que los alumnos ya saben por haberlo vivido y lo publica como datos que aguantan una discusión.';

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
    text: 'La universidad te da un PDF con materias y una fecha de inscripción. Lo que pasa adentro de cada cursada (si se dan las clases, si se puede preguntar, cómo corrigen) lo averiguás en grupos de WhatsApp, y se pierde el día que ese grupo se archiva.',
  },
  {
    kind: 'paragraph',
    text: 'plan-b junta eso y lo publica como conteos: qué contestó la mayoría, cómo se repartió el resto, cuántas voces lo sostienen. Nunca un puntaje ni un ranking, porque un puntaje se discute y un conteo no. Y ninguna cátedra publica nada hasta juntar diez reseñas, para que no se pueda deducir quién dijo qué.',
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
    what: 'Fichas de cátedra, materia y carrera con sus conteos, que se leen sin cuenta. Reseñar una cursada, y corregir o borrar lo que aportaste.',
  },
  {
    when: 'Próximo',
    what: 'Que la cátedra y la institución puedan responder a los números de su ficha, con nombre y cargo.',
  },
  {
    when: 'Más adelante',
    what: 'Bajarte los datos crudos para analizarlos por tu cuenta, sin pasar por nuestras conclusiones.',
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
  'Universidad Nacional de Tucumán (UNT)',
  'Universidad Tecnológica Nacional - Facultad Regional Tucumán',
] as const;
