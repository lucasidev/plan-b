'use client';

import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { useDebouncedValue } from '@/lib/use-debounced-value';
import { cn } from '@/lib/utils';
import { MIN_SEARCH_LENGTH, searchQueries } from '../api';
import type { SearchResultItem } from '../types';

/**
 * Búsqueda global de catálogo (US-004) que reemplaza el `SearchBar` stub del topbar. Combobox
 * liviano sobre las primitivas del design system (sin cmdk): input + dropdown de resultados live,
 * debounce 250ms, navegación por teclado y atajo ⌘K. Pega a `GET /api/search` vía TanStack Query.
 *
 * Materias (`type: 'subject'`) y docentes (`type: 'teacher'`) en una sola lista rankeada; el href y
 * el badge salen del `type`.
 *
 * Gate `mounted`: la búsqueda vive en el topbar, fuera de cualquier HydrationBoundary; sin el flag
 * la query correría server-side bajo ReactQueryStreamedHydration y el fetch relativo fallaría.
 */
function hrefFor(item: SearchResultItem): string {
  return item.type === 'teacher' ? `/teachers/${item.id}` : `/subjects/${item.id}`;
}

const TYPE_LABEL: Record<SearchResultItem['type'], string> = {
  subject: 'Materia',
  teacher: 'Docente',
};

export function GlobalSearch() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const term = useDebouncedValue(query.trim(), 250);
  const { data, isFetching } = useQuery({
    ...searchQueries.forTerm(term),
    enabled: mounted && term.length >= MIN_SEARCH_LENGTH,
  });
  const items = data?.items ?? [];
  const showDropdown = open && term.length >= MIN_SEARCH_LENGTH;
  const optionId = (i: number) => `${listboxId}-opt-${i}`;

  // ⌘K / Ctrl+K enfoca la búsqueda desde cualquier parte del shell.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // El cursor vuelve al primer resultado cada vez que cambia el término.
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset atado al término, no a items.
  useEffect(() => setActive(0), [term]);

  function select(item: SearchResultItem) {
    setOpen(false);
    setQuery('');
    router.push(hrefFor(item));
  }

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (!showDropdown || items.length === 0) {
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => (a + 1) % items.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => (a - 1 + items.length) % items.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const it = items[active];
      if (it) select(it);
    }
  }

  return (
    <div className="relative" style={{ width: 320 }}>
      <div
        className="flex items-center bg-bg-card border border-line rounded-pill shadow-card"
        style={{ padding: '7px 14px', gap: 6 }}
      >
        <Search size={13} className="text-ink-3" aria-hidden />
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={showDropdown && items.length > 0 ? optionId(active) : undefined}
          placeholder="Buscar materia o docente..."
          aria-label="Buscar materia o docente"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          // Delay para que el onMouseDown de un resultado dispare antes de cerrar.
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={onInputKeyDown}
          className="flex-1 bg-transparent border-0 outline-none text-ink"
          style={{ font: 'inherit', fontSize: 13 }}
        />
        <kbd
          className="text-ink-3 bg-bg-card border border-line"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            padding: '1px 5px',
            borderRadius: 3,
          }}
        >
          ⌘K
        </kbd>
      </div>

      {showDropdown && (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Resultados de búsqueda"
          className="absolute left-0 right-0 z-50 mt-1 overflow-hidden rounded-lg border border-line bg-bg-card shadow-card"
        >
          {items.length === 0 ? (
            <div className="px-3 py-2.5 text-[12.5px] text-ink-3">
              {isFetching ? 'Buscando...' : 'Sin resultados'}
            </div>
          ) : (
            items.map((item, i) => (
              <div
                key={`${item.type}-${item.id}`}
                id={optionId(i)}
                role="option"
                // Foco en el input vía aria-activedescendant; tabIndex={-1} mantiene la option
                // fuera del tab order pero focusable, como pide el patrón W3C combobox.
                tabIndex={-1}
                aria-selected={i === active}
                // onMouseDown (no onClick): dispara antes que el onBlur del input cierre la lista.
                onMouseDown={(e) => {
                  e.preventDefault();
                  select(item);
                }}
                onMouseEnter={() => setActive(i)}
                className={cn(
                  'flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left transition-colors',
                  i === active ? 'bg-bg-elev' : 'bg-transparent',
                )}
              >
                <span className="flex-1 truncate text-[13px] text-ink">{item.label}</span>
                <span className="font-mono text-[11px] tabular-nums text-ink-3">
                  {item.sublabel}
                </span>
                <span className="rounded-pill border border-line px-2 py-[1px] text-[10px] text-ink-3">
                  {TYPE_LABEL[item.type]}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
