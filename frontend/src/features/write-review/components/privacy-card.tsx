/**
 * Privacy card in the editor aside (US-049). Mirrors the mockup. Fixed copy: the four
 * anonymity/rights promises the student has to see before publishing.
 *
 * Pure stateless component. When the promises change (e.g. ADR-0009 evolves or a legal
 * review comes in), the copy is updated here.
 */
export function PrivacyCard() {
  return (
    <div className="rounded border border-line bg-bg-card p-4">
      <h3 className="mb-2 text-[12px] font-semibold text-ink">Privacidad</h3>
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        <PrivLi>Aparecés solo como año + carrera + período</PrivLi>
        <PrivLi>Tu nombre, mail y legajo nunca se asocian</PrivLi>
        <PrivLi>Se muestra "verificado que cursó" porque tenés la materia en tu historial</PrivLi>
        <PrivLi>Podés editarla o borrarla cuando quieras</PrivLi>
      </ul>
    </div>
  );
}

function PrivLi({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2 text-[11.5px] leading-snug text-ink-2">
      <span
        aria-hidden="true"
        className="flex-shrink-0 font-mono"
        style={{ color: 'oklch(0.55 0.13 145)' }}
      >
        ✓
      </span>
      <span>{children}</span>
    </li>
  );
}
