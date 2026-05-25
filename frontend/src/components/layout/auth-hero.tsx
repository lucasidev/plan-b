/**
 * Hero copy compartido entre las páginas del route group `(auth)` que
 * usan `<AuthSplit>` (sign-in, sign-up). El componente Headline vive solo
 * en este archivo; las constantes de copy (stats, quote, description)
 * viven en `auth-hero-data.ts` para no romper Fast Refresh por mezclar
 * exports de componente con exports de constantes (regla
 * `react-doctor/only-export-components`).
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
