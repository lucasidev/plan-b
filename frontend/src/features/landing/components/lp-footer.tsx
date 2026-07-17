import { INDEPENDENT_PROJECT_DISCLAIMER } from '@/lib/copy';

/**
 * Footer de la landing pública (US-054-f). Port del `<footer>` de `Landing`
 * (docs/design/reference/canvas-mocks/landing.jsx, líneas 608-621): una línea
 * mono sobre fondo oscuro. Reusa `INDEPENDENT_PROJECT_DISCLAIMER` (mismo
 * disclaimer que el footer del `AuthShell`) en vez de duplicar el string.
 */
export function LpFooter() {
  return (
    <footer
      className="flex justify-between bg-ink text-ink-4 font-mono"
      style={{
        padding: '20px 48px',
        borderTop: '1px solid #1a110a',
        fontSize: 11,
        letterSpacing: '0.04em',
      }}
    >
      <span>plan-b · 2026 · proyecto independiente</span>
      <span>{INDEPENDENT_PROJECT_DISCLAIMER}</span>
    </footer>
  );
}
