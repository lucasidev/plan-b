'use client';

import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useId, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Pill } from '@/components/ui/pill';
import { VerifiedBadge } from '@/components/ui/verified-badge';
import { useDebouncedValue } from '@/lib/use-debounced-value';
import { initiateTeacherClaimAction } from '../actions';
import { MIN_TEACHER_SEARCH_LENGTH, searchTeachers } from '../api';
import { initialClaimState, type TeacherClaim } from '../types';

/**
 * Panel del flow de claim docente (US-030). Dos secciones:
 *   - Mis reclamos: los TeacherProfile del user con su estado (pendiente / verificado).
 *   - Reclamar un docente: búsqueda + botón "Soy yo" que dispara el server action.
 *
 * El claim es una mutación pura (ADR-0046): al `success` hacemos `router.refresh()` para que la
 * página server re-fetchee los claims y el docente recién reclamado salga del buscador.
 */
export function TeacherClaimPanel({ claims }: { claims: TeacherClaim[] }) {
  const router = useRouter();
  const listboxId = useId();

  const [query, setQuery] = useState('');
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const term = useDebouncedValue(query.trim(), 250);
  const [state, formAction, isPending] = useActionState(
    initiateTeacherClaimAction,
    initialClaimState,
  );

  const { data: results, isFetching } = useQuery({
    queryKey: ['teacher-claim-search', term],
    queryFn: () => searchTeachers(term),
    enabled: mounted && term.length >= MIN_TEACHER_SEARCH_LENGTH,
    staleTime: 30_000,
  });

  // Un docente ya reclamado no se vuelve a ofrecer en el buscador.
  const claimedIds = useMemo(() => new Set(claims.map((c) => c.teacherId)), [claims]);
  const offered = (results ?? []).filter((r) => !claimedIds.has(r.id));

  // Mutación pura: el éxito re-renderiza la página server (claims actualizados) y limpia la búsqueda.
  // biome-ignore lint/correctness/useExhaustiveDependencies: reaccionamos al cambio de status, no a router.
  useEffect(() => {
    if (state.status !== 'success') return;
    setQuery('');
    router.refresh();
  }, [state]);

  const showResults = term.length >= MIN_TEACHER_SEARCH_LENGTH;

  return (
    <div className="flex flex-col gap-6">
      {claims.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="m-0 font-display text-sm font-semibold text-ink-2">Mis reclamos</h2>
          <ul className="flex flex-col gap-2 p-0">
            {claims.map((claim) => (
              <li
                key={claim.claimId}
                className="flex items-center justify-between gap-3 rounded-lg border border-line bg-bg-card px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="m-0 truncate text-[13.5px] font-medium text-ink">
                    {claim.teacherName}
                  </p>
                  {claim.teacherTitle && (
                    <p className="m-0 truncate text-[12px] text-ink-3">{claim.teacherTitle}</p>
                  )}
                </div>
                {claim.isVerified ? (
                  <VerifiedBadge kind="teacher" />
                ) : (
                  <div className="flex shrink-0 items-center gap-2">
                    <Pill tone="warm">Pendiente de verificación</Pill>
                    {/* US-031 cablea la verificación por email institucional; hoy stub deshabilitado. */}
                    <Button variant="secondary" size="sm" disabled title="Disponible pronto">
                      Verificar identidad
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="m-0 font-display text-sm font-semibold text-ink-2">Reclamar un docente</h2>
        <div className="flex items-center gap-2 rounded-pill border border-line bg-bg-card px-3.5 py-2 shadow-card">
          <Search size={14} className="text-ink-3" aria-hidden />
          <input
            type="search"
            role="combobox"
            aria-expanded={showResults}
            aria-controls={listboxId}
            aria-autocomplete="list"
            placeholder="Buscá tu nombre en el catálogo..."
            aria-label="Buscar docente para reclamar"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 border-0 bg-transparent text-ink outline-none"
            style={{ font: 'inherit', fontSize: 13 }}
          />
        </div>

        {showResults && (
          <ul id={listboxId} aria-label="Resultados" className="flex flex-col gap-2 p-0">
            {offered.length === 0 ? (
              <li className="px-1 py-2 text-[12.5px] text-ink-3">
                {isFetching ? 'Buscando...' : 'Sin docentes para reclamar con ese nombre.'}
              </li>
            ) : (
              offered.map((teacher) => (
                <li
                  key={teacher.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-line bg-bg-card px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="m-0 truncate text-[13.5px] font-medium text-ink">
                      {teacher.name}
                    </p>
                    {teacher.title && (
                      <p className="m-0 truncate text-[12px] text-ink-3">{teacher.title}</p>
                    )}
                  </div>
                  <form action={formAction} className="shrink-0">
                    <input type="hidden" name="teacherId" value={teacher.id} />
                    <Button type="submit" size="sm" disabled={isPending}>
                      Soy yo
                    </Button>
                  </form>
                </li>
              ))
            )}
          </ul>
        )}

        {state.status === 'error' && (
          <p className="m-0 text-[12.5px] text-st-failed-fg" role="alert">
            {state.message}
          </p>
        )}
      </section>
    </div>
  );
}
