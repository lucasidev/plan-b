'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export type TabId = 'active' | 'draft' | 'public';

type TabItem = {
  id: TabId;
  label: string;
  tag?: string;
};

/**
 * URL-driven Plan tabs (US-046 + US-027 "Comunidad"). Canonical state in
 * `?tab=active|draft|public`. If the query param is missing, the default is "active". Visual
 * aligned with the v2 canvas (V2Tabs).
 */
export function PlanTabs({ items, active }: { items: TabItem[]; active: TabId }) {
  const searchParams = useSearchParams();

  return (
    <nav
      style={{
        display: 'flex',
        gap: 18,
        borderBottom: '1px solid var(--line)',
        marginBottom: 24,
      }}
      aria-label="Vistas de Planificar"
    >
      {items.map((it) => {
        const isActive = it.id === active;
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', it.id);
        const href = `?${params.toString()}`;
        return (
          <Link
            key={it.id}
            href={href}
            scroll={false}
            // Cambiar de pestaña se resuelve en el cliente, sin ir al servidor. `/plan` es
            // force-dynamic, así que una navegación normal de Next no actualiza la URL hasta que
            // vuelve el payload RSC, y ese render vuelve a pedir perfil, períodos y los dos
            // prefetch. En CI eso dejaba la pantalla en la pestaña anterior más de 20 segundos
            // después del click, con la URL sin cambiar: no era lentitud del test.
            //
            // `history.pushState` actualiza `useSearchParams` sin refetch (escape hatch soportado
            // por Next 15 para justamente este caso), y `PlanShell` deriva la pestaña de ahí. Sigue
            // siendo un <a> de verdad: ctrl+click, "abrir en pestaña nueva" y los lectores de
            // pantalla se comportan igual, y el default solo se previene en el click simple.
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
              e.preventDefault();
              window.history.pushState(null, '', href);
            }}
            style={{
              padding: '10px 0',
              fontSize: 13.5,
              color: isActive ? 'var(--ink-1)' : 'var(--ink-3)',
              fontWeight: isActive ? 600 : 400,
              borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom: -1,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
            aria-current={isActive ? 'page' : undefined}
          >
            {it.label}
            {it.tag && (
              <span
                className="text-ink-3"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10.5,
                  background: 'var(--bg-elev, var(--bg))',
                  padding: '1px 6px',
                  borderRadius: 999,
                }}
              >
                {it.tag}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
