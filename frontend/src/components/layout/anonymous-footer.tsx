/**
 * Pie de la barra lateral sin sesión: reemplaza a `<AvatarMenu>` cuando nadie inició sesión. Dos
 * líneas, mismo padding que el bloque del avatar (`avatar-menu.tsx`), para que el pie de la
 * barra no salte de alto entre los dos estados.
 */
export function AnonymousFooter() {
  return (
    <div
      className="border-t border-line text-[12px] text-ink-3 leading-relaxed"
      style={{ padding: '10px 8px' }}
    >
      <p>Leer no pide cuenta.</p>
      <p>La cuenta es para reseñar, y llega recién cuando reseñás.</p>
    </div>
  );
}
