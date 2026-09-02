'use client';

import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { itemCatalogQueries } from '../api';
import type { CatalogItem } from '../types';
import { ItemEditor } from './item-editor';

/**
 * El catálogo de frases y su panel de edición, en una sola pantalla (US-198, E1).
 *
 * Un solo lugar es literal: no hay una segunda copia editable en ninguna otra parte del producto.
 * El catálogo se lista entero (son decenas de filas, y curar es mirar el conjunto) y editar es
 * elegir uno y trabajarlo al lado, sin perder de vista el resto.
 */
export function ItemCatalog() {
  const queryClient = useQueryClient();
  const { data: items } = useSuspenseQuery(itemCatalogQueries.all());
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return items;
    return items.filter(
      (item) =>
        item.code.toLowerCase().includes(needle) || item.text.toLowerCase().includes(needle),
    );
  }, [items, query]);

  // El primero del catálogo mientras no se haya elegido nada: la pantalla arranca mostrando algo,
  // y quien cura casi siempre viene a buscar una pregunta puntual con el buscador.
  const selected = items.find((item) => item.id === selectedId) ?? items[0] ?? null;
  const offered = items.filter((item) => item.isActive).length;
  const retired = items.length - offered;

  // Guardar cambia el catálogo que esta misma pantalla lista, así que hay que volver a pedirlo: el
  // texto nuevo, el código nuevo y el conteo que quedó del lado viejo.
  const onDone = useCallback(
    () => queryClient.invalidateQueries({ queryKey: itemCatalogQueries.all().queryKey }),
    [queryClient],
  );

  return (
    <div className="grid gap-6" style={{ gridTemplateColumns: '380px 1fr' }}>
      <div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por código o por texto"
          aria-label="Buscar en el catálogo"
          className="mb-2.5 w-[280px] rounded-lg border border-line bg-bg-card px-3 py-1.5 text-[12.5px] text-ink"
        />

        <p className="mb-2 font-mono text-[10.5px] text-ink-3">
          {offered} en el cuestionario vigente
          {retired > 0 ? ` · ${retired} ${retired === 1 ? 'retirada' : 'retiradas'}` : ''}
        </p>

        <ul className="overflow-hidden rounded-xl border border-line bg-bg-card">
          {shown.map((item, index) => (
            <li key={item.id}>
              <button
                type="button"
                aria-current={item.id === selected?.id}
                onClick={() => setSelectedId(item.id)}
                className="w-full px-3.5 py-2.5 text-left"
                style={{
                  borderTop: index === 0 ? 0 : '1px solid var(--color-line-2)',
                  background: item.id === selected?.id ? 'var(--color-bg)' : 'var(--color-bg-card)',
                  borderLeft:
                    item.id === selected?.id
                      ? '2px solid var(--color-accent)'
                      : '2px solid transparent',
                  opacity: item.isActive ? 1 : 0.55,
                }}
              >
                <span className="flex items-baseline justify-between gap-2">
                  <span
                    className="font-mono text-[10.5px] text-ink-3"
                    style={{ textDecoration: item.isActive ? 'none' : 'line-through' }}
                  >
                    {item.code}
                  </span>
                  <Tag item={item} />
                </span>
                <span className="mt-0.5 block text-[12.5px] leading-snug text-ink-2">
                  {item.text}
                </span>
                <span className="mt-0.5 block text-[10.5px] text-ink-3">
                  {item.answerCount === 1 ? '1 respuesta' : `${item.answerCount} respuestas`}
                </span>
              </button>
            </li>
          ))}
          {shown.length === 0 && (
            <li className="px-3.5 py-4 text-[12.5px] text-ink-3">Nada con ese texto.</li>
          )}
        </ul>
      </div>

      <div className="rounded-xl border border-line bg-bg-card p-5">
        {selected ? (
          <ItemEditor item={selected} onDone={onDone} />
        ) : (
          <p className="text-[12.5px] text-ink-3">Elegí una pregunta de la lista.</p>
        )}
      </div>
    </div>
  );
}

/** De dónde salió la pregunta, o que ya no se ofrece. Es lo mismo que Método publica. */
function Tag({ item }: { item: CatalogItem }) {
  const label = !item.isActive ? 'retirada' : item.origin === 'Distilled' ? 'destilada' : 'semilla';
  const distilled = item.isActive && item.origin === 'Distilled';

  return (
    <span
      className="rounded-full px-[7px] py-px font-mono text-[9px]"
      style={
        distilled
          ? { background: 'var(--color-accent-soft)', color: 'var(--color-accent-ink)' }
          : { background: 'var(--color-bg-elev)', color: 'var(--color-ink-3)' }
      }
    >
      {label}
    </span>
  );
}
