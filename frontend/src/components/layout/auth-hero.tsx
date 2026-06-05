/**
 * Hero copy shared across the `(auth)` route group pages that use `<AuthSplit>`
 * (sign-in, sign-up). The Headline component lives only in this file; copy constants
 * (stats, quote, description) live in `auth-hero-data.ts` to avoid breaking Fast
 * Refresh by mixing component exports with constant exports
 * (`react-doctor/only-export-components` rule).
 *
 * Once the v2 redesign finishes landing, sign-in may get its own side panel with
 * personalized stats (crowd-sourced insights, "última actividad de tu carrera"). At
 * that point, sign-in splits off from this module and each flow defines its own hero.
 * For now, both pages share the same hero because US-036 only changes the shell
 * (tabs → 4 routes), not the hero content.
 *
 * The heading stays in each page because that's where the dominant verb lives
 * ("Empezá en 30 segundos" for sign-up, "Buenas de nuevo" for sign-in). That
 * difference is semantically the page, not the hero.
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
