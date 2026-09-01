'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { adminChairQueries } from '../api';
import { type AdminChair, CHAIR_ROLE_LABELS, type ChairMemberRole } from '../types';

/**
 * Las cátedras de una materia con su equipo (US-196, SC-027).
 *
 * Muestra el equipo entero, no solo el de hoy: los tramos cerrados van abajo y grises. Esconderlos
 * haría que quien carga no pueda ver a quién cerró, y esa es justamente la corrección más
 * frecuente. Una cátedra archivada se lista igual, marcada.
 *
 * Lee del query que la RSC dejó hidratado, y no de una prop: así el alta puede invalidarlo y ver el
 * resultado sin depender de `router.refresh()`, que en prod build no lo refleja siempre.
 */
export function ChairList({ subjectId }: { subjectId: string }) {
  const { data: chairs } = useSuspenseQuery(adminChairQueries.forSubject(subjectId));

  if (chairs.length === 0) {
    return (
      <p className="rounded-lg border border-line bg-bg-card p-4 text-[13px] text-ink-3">
        Esta materia todavía no tiene cátedras cargadas.
      </p>
    );
  }

  return (
    <ul className="m-0 flex list-none flex-col gap-3 p-0">
      {chairs.map((chair) => (
        <li key={chair.id} className="rounded-lg border border-line bg-bg-card p-4">
          <div className="mb-2 flex items-baseline gap-2">
            <h3 className="text-[15px] font-medium text-ink">Cátedra {chair.name}</h3>
            {!chair.isActive && (
              <span className="rounded bg-bg-elev px-2 py-0.5 font-mono text-[10px] text-ink-3">
                archivada
              </span>
            )}
          </div>
          <Team members={chair.members} />
        </li>
      ))}
    </ul>
  );
}

function Team({ members }: { members: AdminChair['members'] }) {
  if (members.length === 0) {
    // Una cátedra sin titular se guarda igual: el dato falta, no está mal.
    return <p className="text-[12.5px] text-ink-3">Sin equipo cargado todavía.</p>;
  }

  const current = members.filter((m) => m.untilTermLabel === null);
  const past = members.filter((m) => m.untilTermLabel !== null);

  return (
    <>
      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        {current.map((m) => (
          <li key={`${m.teacherId}-${m.sinceTermLabel}`} className="text-[13px] text-ink-2">
            <span className="text-ink">
              {m.firstName} {m.lastName}
            </span>{' '}
            · {roleLabel(m.role)}{' '}
            <span className="font-mono text-[11px] text-ink-3">desde {m.sinceTermLabel}</span>
          </li>
        ))}
      </ul>

      {past.length > 0 && (
        <>
          <p className="mt-3 mb-1 font-mono text-[10px] uppercase tracking-wide text-ink-4">
            Integraron antes
          </p>
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {past.map((m) => (
              <li key={`${m.teacherId}-${m.sinceTermLabel}`} className="text-[12.5px] text-ink-3">
                {m.firstName} {m.lastName} · {roleLabel(m.role)}{' '}
                <span className="font-mono text-[11px]">
                  {m.sinceTermLabel} a {m.untilTermLabel}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}

/** El backend manda el valor del enum; acá se lee en castellano. Un rol desconocido se muestra crudo. */
function roleLabel(role: string): string {
  return CHAIR_ROLE_LABELS[role as ChairMemberRole] ?? role;
}
