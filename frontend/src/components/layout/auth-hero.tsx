/**
 * Hero copy compartido entre las páginas del route group `(auth)` que
 * usan `<AuthSplit>` (sign-in, sign-up). Se centralizan acá para que
 * cada page exprese SOLO la diferencia (su heading + form), no la
 * repetición (description, quote, stats).
 *
 * Cuando el rediseño v2 termine de aterrizar, sign-in puede tener su
 * propio panel lateral con stats personalizadas (insights crowd-sourced,
 * "última actividad de tu carrera"). En ese momento, sign-in se separa
 * de este module y cada flow define su propio hero. Por ahora, las dos
 * páginas comparten el mismo hero porque la US-036 solo cambia el shell
 * (de tabs a 4 rutas), no el contenido del hero.
 *
 * El heading queda en cada page porque ahí está el verbo dominante
 * ("Empezá en 30 segundos" para sign-up, "Buenas de nuevo" para sign-in).
 * Esa diferencia es semánticamente la página, no el hero.
 */

// Hero stats: 3 métricas que dan presencia al hero. Hardcoded hasta que
// aterrice GET /api/stats/public (universities desde Academic, members
// desde Identity, reviews desde Reviews, query agregada cross-module sin
// auth, US separada). Cuando exista el endpoint, este const se reemplaza
// por un fetch RSC y este componente queda intacto.
export const AUTH_HERO_STATS: Array<{ label: string; value: string }> = [
  { label: 'alumnos verificados', value: '340' },
  { label: 'reseñas', value: '1.2k' },
  { label: 'universidades', value: '3' },
];

// Testimonial fijo del mockup. Hardcoded por el mismo motivo que las stats:
// cuando exista un sistema real de testimonials, este valor se reemplaza
// por una rotación dinámica.
export const AUTH_HERO_QUOTE = {
  text: '"Iba a anotarme en INT302 con el primero que tenía horario libre. Acá vi que había una comisión de 2c con 4.1★ vs 3.4★. Esperé un cuatri."',
  attribution: 'Anónimo · 4° año Sistemas',
};

export const AUTH_HERO_DESCRIPTION =
  'plan-b es la app donde alumnos de UNSTA simulan su cuatrimestre, comparan comisiones y dejan reseñas verificadas. Sin nombres, sin filtros.';

export function AuthHeroHeadline() {
  return (
    <h1
      className="text-ink"
      style={{
        fontFamily: 'var(--font-display)',
        fontSize: 56,
        lineHeight: 1.02,
        letterSpacing: '-0.03em',
        fontWeight: 600,
        margin: 0,
      }}
    >
      Antes de inscribirte,
      <br />
      mirá <em style={{ fontStyle: 'normal' }}>quiénes ya pasaron</em>
      <br />
      por esa materia.
    </h1>
  );
}
