/**
 * Hero data (stats + quote + description) shared across the `(auth)` route group pages
 * that use `<AuthSplit>` (sign-in, sign-up). Lives separate from the `auth-hero.tsx`
 * component so Fast Refresh keeps working: once a .tsx file mixes component exports
 * with constant exports, Next.js HMR falls back to a full reload
 * (`react-doctor/only-export-components` rule).
 *
 * Hardcoded until GET /api/stats/public lands (universities from Academic, members
 * from Identity, reviews from Reviews, cross-module aggregate query without auth,
 * separate US). When the endpoint exists, these consts are swapped for an RSC fetch
 * and this file stays intact.
 */

// Hero stats: 3 metrics that give the hero presence.
export const AUTH_HERO_STATS: Array<{ label: string; value: string }> = [
  { label: 'alumnos verificados', value: '340' },
  { label: 'reseñas', value: '1.2k' },
  { label: 'universidades', value: '3' },
];

// Fixed testimonial from the mockup. Once a real testimonials system exists, this
// value is replaced by a dynamic rotation.
export const AUTH_HERO_QUOTE = {
  text: '"Iba a anotarme en INT302 con el primero que tenía horario libre. Acá vi que había una comisión de 2c con 4.1★ vs 3.4★. Esperé un cuatri."',
  attribution: 'Anónimo · 4° año Sistemas',
};

export const AUTH_HERO_DESCRIPTION =
  'plan-b es la app donde alumnos de UNSTA simulan su cuatrimestre, comparan comisiones y dejan reseñas verificadas. Sin nombres, sin filtros.';
