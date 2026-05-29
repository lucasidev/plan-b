/**
 * Card "Privacidad" del aside del editor (US-049). Espejo del mockup. Texto fijo: las 4
 * promesas de anonimato/derechos que el alumno tiene que ver antes de publicar.
 *
 * Es un componente puro sin estado. Si cambian las promesas (ej. ADR-0009 evoluciona o
 * llega un legal review), se actualiza el copy acá.
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
