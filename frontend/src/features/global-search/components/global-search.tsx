'use client';

import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { useDebouncedValue } from '@/lib/use-debounced-value';
import { cn } from '@/lib/utils';
import { MIN_SEARCH_LENGTH, searchQueries, universityDirectoryQuery } from '../api';
import type { SearchResultItem, UniversityDirectoryEntry } from '../types';

/**
 * Búsqueda global de catálogo (US-004, US-132) que reemplaza el `SearchBar` stub del topbar.
 * Combobox liviano sobre las primitivas del design system (sin cmdk): input + dropdown de
 * resultados live, debounce 250ms, navegación por teclado y atajo ⌘K. Pega a `GET /api/search`
 * vía TanStack Query.
 *
 * Materia, docente, cátedra, carrera e institución en una sola lista rankeada; el href y el badge
 * salen del `type`. La cátedra lleva a su ficha, que es donde vive lo que se publica de cursar con
 * ella. La institución todavía no tiene ficha propia (SC-005: "la ficha se rehace"); su chasis de
 * hoy resuelve por slug, no por id, así que su href sale de un segundo fetch chico (el directorio
 * de universidades) en vez de derivarse solo del id del resultado.
 *
 * Gate `mounted`: la búsqueda vive en el topbar, fuera de cualquier HydrationBoundary; sin el flag
 * la query correría server-side bajo ReactQueryStreamedHydration y el fetch relativo fallaría.
 */
function hrefFor(item: SearchResultItem, universities: UniversityDirectoryEntry[]): string {
  switch (item.type) {
    case 'subject':
      return `/subjects/${item.id}`;
    case 'teacher':
      return `/teachers/${item.id}`;
    case 'chair':
      return `/chairs/${item.id}`;
    case 'career':
      return `/careers/${item.id}`;
    case 'institution': {
      const university = universities.find((u) => u.id === item.id);
      return university ? `/universities/${university.slug}/careers` : '/universities';
    }
  }
}

const TYPE_LABEL: Record<SearchResultItem['type'], string> = {
  subject: 'Materia',
  teacher: 'Docente',
  chair: 'Cátedra',
  career: 'Carrera',
  institution: 'Institución',
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

  // Solo hace falta el directorio de universidades cuando hay al menos un resultado `institution`
  // para resolver: nada de pegarle a /api/academic/universities en cada búsqueda de materia.
  const { data: universities } = useQuery({
    ...universityDirectoryQuery,
    enabled: mounted && items.some((item) => item.type === 'institution'),
  });

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
    router.push(hrefFor(item, universities ?? []));
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
    // w-full + min-w-0 (no un width fijo): un flex item con width fijo no se achica por
    // default (min-width:auto lo frena en su contenido), así que a 393px este buscador
    // desbordaba el header en vez de ceder el lugar al logo y a "Ingresar" (V13).
    <div className="relative w-full min-w-0 max-w-[320px]">
      <div
        className="flex min-w-0 items-center bg-bg-card border border-line rounded-pill shadow-card"
        style={{ padding: '7px 14px', gap: 6 }}
      >
        <Search size={13} className="shrink-0 text-ink-3" aria-hidden />
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={showDropdown && items.length > 0 ? optionId(active) : undefined}
          placeholder="Buscar materia, carrera o docente..."
          aria-label="Buscar materia, carrera o docente"
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
        {/* Sin teclado físico en celular, el atajo no significa nada: se esconde para dejarle
            el lugar al input en vez de forzar el desborde (V13). */}
        <kbd
          className="hidden shrink-0 text-ink-3 bg-bg-card border border-line sm:inline"
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
