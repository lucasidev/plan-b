'use client';

import { usePathname } from 'next/navigation';
import { Fragment } from 'react';

/**
 * Topbar del backoffice (port de `admin-shell.jsx::AdmShell` topbar). Breadcrumbs derivados del
 * pathname. El search global (⌘K) y la campana son afordancias visuales del canvas, todavía inertes
 * (llegan con US-081 / US-087).
 */
const SEGMENT_LABELS: Record<string, string> = {
  universities: 'Universidades',
  teachers: 'Docentes',
  careers: 'Carreras',
  terms: 'Períodos',
  // `new`/`edit` son genéricos: el mismo breadcrumb sirve para todos los recursos del backoffice
  // (docentes, universidades, carreras). No hardcodear el recurso acá (antes decía "Nuevo docente",
  // que se filtraba mal a las otras secciones).
  new: 'Nuevo',
  edit: 'Editar',
  moderacion: 'Moderación',
  reportes: 'Reportes',
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function crumbsFor(pathname: string): string[] {
  const segments = pathname.split('/').filter(Boolean); // ['admin', 'teachers', ...]
  return segments
    .slice(1) // dropea 'admin'
    .filter((s) => !UUID_RE.test(s)) // dropea el id del docente
    .map((s) => SEGMENT_LABELS[s] ?? s);
}

export function AdminTopbar() {
  const pathname = usePathname();
  const crumbs = crumbsFor(pathname);

  return (
    <header className="flex h-[46px] items-center gap-3.5 border-b border-line bg-bg px-6">
      <div className="font-mono text-[11px] tracking-[0.02em] text-ink-3">
        {crumbs.length === 0 ? (
          <b className="font-medium text-ink">Backoffice</b>
        ) : (
          crumbs.map((c, i) => (
            <Fragment key={c}>
              {i > 0 && <span className="mx-1.5 text-ink-4">/</span>}
              {i === crumbs.length - 1 ? (
                <b className="font-medium text-ink">{c}</b>
              ) : (
                <span>{c}</span>
              )}
            </Fragment>
          ))
        )}
      </div>

      <div className="flex-1" />

      <div className="flex w-[280px] items-center gap-1.5 rounded-md border border-line bg-bg-card px-2.5 py-1 text-[12px] text-ink-3">
        <span aria-hidden="true">⌕</span>
        <span className="flex-1 truncate">Buscar en el backoffice</span>
        <kbd className="rounded-sm border border-line bg-bg-elev px-1 font-mono text-[9.5px] text-ink-3">
          ⌘K
        </kbd>
      </div>
    </header>
  );
}
