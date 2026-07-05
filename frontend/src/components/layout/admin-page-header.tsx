/**
 * Encabezado de página del backoffice (port de `admin-shell.jsx::.adm-ph`): eyebrow mono + título +
 * subtítulo + slot de acciones a la derecha. Server component.
 */
export function AdminPageHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-6">
      <div>
        {eyebrow && (
          <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-3">
            {eyebrow}
          </div>
        )}
        <h1 className="m-0 font-display text-[22px] font-semibold tracking-[-0.018em] text-ink">
          {title}
        </h1>
        {subtitle && <p className="mt-1.5 mb-0 text-[12.5px] text-ink-3">{subtitle}</p>}
      </div>
      {action && <div className="flex flex-shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}
