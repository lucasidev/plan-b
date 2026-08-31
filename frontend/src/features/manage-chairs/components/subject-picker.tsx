'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MIN_SEARCH_LENGTH, searchQueries } from '@/features/global-search/api';

/**
 * Elige la materia sobre la que se van a cargar cátedras (US-196, SC-027).
 *
 * Reusa la query del buscador del catálogo, no su componente: `GlobalSearch` navega a la ficha
 * pública al elegir, y acá elegir significa abrir el backoffice de esa materia. Se comparte el
 * fetcher, que es lo que no conviene duplicar; el comportamiento es distinto y se escribe distinto.
 *
 * Filtra a materias: la búsqueda también devuelve docentes y cátedras, y ninguno de los dos es un
 * sujeto sobre el que se abra una cátedra nueva.
 */
export function SubjectPicker() {
  const router = useRouter();
  const [term, setTerm] = useState('');

  // La query vive fuera de cualquier HydrationBoundary, así que se gatea por `mounted` para que su
  // queryFn (que usa un path relativo) no corra server-side. Mismo criterio que el topbar.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { data, isFetching } = useQuery({
    ...searchQueries.forTerm(term.trim()),
    enabled: mounted && term.trim().length >= MIN_SEARCH_LENGTH,
  });

  const subjects = (data?.items ?? []).filter((item) => item.type === 'subject');

  return (
    <div className="rounded-lg border border-line bg-bg-card p-4">
      <label htmlFor="subject-search" className="mb-1.5 block text-[13px] text-ink">
        Buscá la materia
      </label>
      <input
        id="subject-search"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Código o nombre, por ejemplo 211 o Control de Calidad"
        className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-[13.5px] text-ink"
      />

      {term.trim().length >= MIN_SEARCH_LENGTH && (
        <div className="mt-3">
          {isFetching && <p className="text-[12.5px] text-ink-3">Buscando…</p>}

          {!isFetching && subjects.length === 0 && (
            <p className="text-[12.5px] text-ink-3">
              Ninguna materia coincide. La cátedra cuelga de una materia del catálogo: si la materia
              no está cargada, va primero.
            </p>
          )}

          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {subjects.map((subject) => (
              <li key={subject.id}>
                <button
                  type="button"
                  onClick={() => router.push(`/admin/chairs?subjectId=${subject.id}`)}
                  className="w-full rounded-md px-2.5 py-2 text-left text-[13px] text-ink hover:bg-bg-elev"
                >
                  {subject.label}
                  <span className="block text-[11.5px] text-ink-3">{subject.sublabel}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
