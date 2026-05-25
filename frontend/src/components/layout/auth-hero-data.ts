/**
 * Hero data (stats + quote + description) compartido entre las páginas del route group
 * `(auth)` que usan `<AuthSplit>` (sign-in, sign-up). Vive separado del componente
 * `auth-hero.tsx` para que Fast Refresh siga funcionando: una vez que un archivo .tsx
 * mezcla exports de componentes con exports de constantes, el HMR de Next.js cae a un
 * full reload (regla `react-doctor/only-export-components`).
 *
 * Hardcoded hasta que aterrice GET /api/stats/public (universities desde Academic,
 * members desde Identity, reviews desde Reviews, query agregada cross-module sin auth,
 * US separada). Cuando exista el endpoint, estos consts se reemplazan por un fetch
 * RSC y este archivo queda intacto.
 */

// Hero stats: 3 métricas que dan presencia al hero.
export const AUTH_HERO_STATS: Array<{ label: string; value: string }> = [
  { label: 'alumnos verificados', value: '340' },
  { label: 'reseñas', value: '1.2k' },
  { label: 'universidades', value: '3' },
];

// Testimonial fijo del mockup. Cuando exista un sistema real de testimonials, este
// valor se reemplaza por una rotación dinámica.
export const AUTH_HERO_QUOTE = {
  text: '"Iba a anotarme en INT302 con el primero que tenía horario libre. Acá vi que había una comisión de 2c con 4.1★ vs 3.4★. Esperé un cuatri."',
  attribution: 'Anónimo · 4° año Sistemas',
};

export const AUTH_HERO_DESCRIPTION =
  'plan-b es la app donde alumnos de UNSTA simulan su cuatrimestre, comparan comisiones y dejan reseñas verificadas. Sin nombres, sin filtros.';
