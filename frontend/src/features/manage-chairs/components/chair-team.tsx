'use client';

import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useActionState, useEffect, useId, useState } from 'react';
import type { AdminTeacherRow } from '@/features/manage-teachers/types';
import type { AdminTermRow } from '@/features/manage-terms/types';
import { useHydrated } from '@/lib/use-hydrated';
import { addChairMemberAction, closeChairMemberAction } from '../actions';
import { adminChairQueries } from '../api';
import {
  type AdminChairMember,
  CHAIR_MEMBER_ROLES,
  CHAIR_ROLE_LABELS,
  type ChairMemberRole,
  type ChairSubjectContext,
  initialManageChairState,
} from '../types';
import { chairDetailHref, chairListHref } from './chair-context';

const fieldClass = 'w-full rounded-md border border-line bg-bg-card px-3 py-2 text-[13px] text-ink';
const buttonClass =
  'rounded-md border border-ink bg-ink px-3 py-2 text-[13px] text-bg-card disabled:opacity-50';

export function ChairTeam({
  chairId,
  context,
  teachers,
  terms,
}: {
  chairId: string;
  context: ChairSubjectContext;
  teachers: AdminTeacherRow[];
  terms: AdminTermRow[];
}) {
  const { data } = useSuspenseQuery(adminChairQueries.forSubject(context.subjectId));
  const chair = data.find((c) => c.id === chairId);
  if (!chair) return <p role="alert">Esta cátedra ya no está disponible.</p>;
  const current = chair.members.filter((m) => m.untilTermLabel === null);
  const past = chair.members.filter((m) => m.untilTermLabel !== null);
  return (
    <div className="flex flex-col gap-6">
      {!chair.isActive && (
        <p className="rounded border border-line p-3 text-ink-2">Cátedra archivada</p>
      )}
      <section aria-labelledby="current-team">
        <h2 id="current-team" className="mb-3 font-serif text-[21px] text-ink">
          Equipo actual
        </h2>
        {current.length === 0 ? (
          <p className="text-[13px] text-ink-3">Sin equipo cargado todavía.</p>
        ) : (
          <ul className="divide-y divide-line rounded-md border border-line bg-bg-card">
            {current.map((m) => (
              <li key={`${m.teacherId}-${m.sinceTermId}`} className="p-4">
                <MemberLabel member={m} />
                <CloseMemberForm
                  chairId={chairId}
                  subjectId={context.subjectId}
                  member={m}
                  terms={terms}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
      {chair.isActive && (
        <AddMemberForm
          key={chairId}
          chairId={chairId}
          context={context}
          teachers={teachers.filter((t) => !current.some((m) => m.teacherId === t.id))}
          terms={terms}
          hasLead={current.some((m) => m.role === 'Lead')}
        />
      )}
      {past.length > 0 && (
        <section aria-labelledby="past-team">
          <h2 id="past-team" className="mb-3 font-serif text-[21px] text-ink">
            Integraron antes
          </h2>
          <ul className="divide-y divide-line rounded-md border border-line">
            {past.map((m) => (
              <li className="p-4" key={`${m.teacherId}-${m.sinceTermId}`}>
                <MemberLabel member={m} />
              </li>
            ))}
          </ul>
        </section>
      )}
      <Link className="text-[13px] text-ink underline" href={chairListHref(context.subjectId)}>
        Volver a las cátedras de {context.subjectName}
      </Link>
    </div>
  );
}

function MemberLabel({ member }: { member: AdminChairMember }) {
  return (
    <p className="text-[13px] text-ink">
      <strong>
        {member.firstName} {member.lastName}
      </strong>{' '}
      · {CHAIR_ROLE_LABELS[member.role as ChairMemberRole] ?? member.role}
      <span className="mt-1 block font-mono text-[11px] text-ink-3">
        Desde {member.sinceTermLabel}
        {member.untilTermLabel ? ` hasta ${member.untilTermLabel}` : ' · vigente'}
      </span>
    </p>
  );
}

function AddMemberForm({
  chairId,
  context,
  teachers,
  terms,
  hasLead,
}: {
  chairId: string;
  context: ChairSubjectContext;
  teachers: AdminTeacherRow[];
  terms: AdminTermRow[];
  hasLead: boolean;
}) {
  const [state, action, pending] = useActionState(addChairMemberAction, initialManageChairState);
  const client = useQueryClient();
  const hydrated = useHydrated();
  const id = useId();
  const [draft, setDraft] = useState({ teacherId: '', role: '', sinceTermId: '' });
  const draftKey = `chair-member:${chairId}`;
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(draftKey) ?? 'null');
      if (saved)
        setDraft({
          teacherId: teachers.some((t) => t.id === saved.teacherId) ? saved.teacherId : '',
          role: CHAIR_MEMBER_ROLES.includes(saved.role) ? saved.role : '',
          sinceTermId: terms.some((t) => t.id === saved.sinceTermId) ? saved.sinceTermId : '',
        });
    } catch {
      /* El formulario sigue funcionando sin almacenamiento local. */
    }
  }, [draftKey, teachers, terms]);
  useEffect(() => {
    if (state.status !== 'success') return;
    setDraft({ teacherId: '', role: '', sinceTermId: '' });
    try {
      sessionStorage.removeItem(draftKey);
    } catch {
      /* Sin persistencia local. */
    }
    client.invalidateQueries({
      queryKey: adminChairQueries.forSubject(context.subjectId).queryKey,
    });
  }, [state, client, context.subjectId, draftKey]);
  function update(key: keyof typeof draft, value: string) {
    const next = { ...draft, [key]: value };
    setDraft(next);
    try {
      sessionStorage.setItem(draftKey, JSON.stringify(next));
    } catch {
      /* Sin persistencia local. */
    }
  }
  const returnTo = chairDetailHref(context.subjectId, chairId);
  return (
    <section
      className="rounded-md border border-line bg-bg-card p-4"
      aria-labelledby={`${id}-title`}
    >
      <h2 id={`${id}-title`} className="mb-3 font-serif text-[21px] text-ink">
        Agregar integrante
      </h2>
      <form action={action} className="flex flex-col gap-3">
        <input type="hidden" name="chairId" value={chairId} />
        <label className="text-[13px] text-ink" htmlFor={`${id}-teacher`}>
          Docente
        </label>
        <select
          id={`${id}-teacher`}
          name="teacherId"
          required
          value={draft.teacherId}
          onChange={(e) => update('teacherId', e.target.value)}
          className={fieldClass}
        >
          <option value="">Elegí un docente</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.lastName}, {t.firstName}
            </option>
          ))}
        </select>
        <Link
          href={`/admin/teachers/new?universityId=${context.universityId}&from=${encodeURIComponent(returnTo)}`}
          className="text-[12px] text-ink underline"
        >
          Cargar un docente que falta
        </Link>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-[13px] text-ink">
            Rol
            <select
              name="role"
              required
              className={fieldClass}
              value={draft.role}
              onChange={(e) => update('role', e.target.value)}
            >
              <option value="">Elegí un rol</option>
              {CHAIR_MEMBER_ROLES.map((role) => (
                <option key={role} value={role} disabled={role === 'Lead' && hasLead}>
                  {CHAIR_ROLE_LABELS[role]}
                  {role === 'Lead' && hasLead ? ' (ya asignado)' : ''}
                </option>
              ))}
            </select>
          </label>
          <label className="text-[13px] text-ink">
            Desde qué período
            <select
              name="sinceTermId"
              required
              className={fieldClass}
              value={draft.sinceTermId}
              onChange={(e) => update('sinceTermId', e.target.value)}
            >
              <option value="">Elegí un período</option>
              {terms.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        {terms.length === 0 && (
          <p className="text-[13px] text-ink-2">
            No hay períodos cargados.{' '}
            <Link className="underline" href={`/admin/universities/${context.universityId}/terms`}>
              Gestionar períodos
            </Link>
          </p>
        )}
        {state.status === 'error' && (
          <p role="alert" className="text-[13px] text-ink">
            {state.message}
          </p>
        )}
        {state.status === 'success' && (
          <p role="status" className="text-[13px] text-ink">
            Integrante agregado.
          </p>
        )}
        <button
          className={`${buttonClass} self-start`}
          disabled={!hydrated || pending || terms.length === 0 || teachers.length === 0}
          type="submit"
        >
          {pending ? 'Guardando…' : 'Agregar integrante'}
        </button>
      </form>
    </section>
  );
}

function CloseMemberForm({
  chairId,
  subjectId,
  member,
  terms,
}: {
  chairId: string;
  subjectId: string;
  member: AdminChairMember;
  terms: AdminTermRow[];
}) {
  const [open, setOpen] = useState(false);
  const [untilTermId, setUntilTermId] = useState('');
  const [state, action, pending] = useActionState(closeChairMemberAction, initialManageChairState);
  const client = useQueryClient();
  const hydrated = useHydrated();
  const since = terms.find((t) => t.id === member.sinceTermId);
  const eligibleTerms = terms.filter((t) => since && t.endDate >= since.startDate);
  useEffect(() => {
    if (state.status !== 'success') return;
    client.invalidateQueries({ queryKey: adminChairQueries.forSubject(subjectId).queryKey });
  }, [state, client, subjectId]);
  if (!open)
    return (
      <button
        type="button"
        className="mt-2 text-[12px] text-ink underline"
        onClick={() => setOpen(true)}
      >
        Cerrar tramo
      </button>
    );
  return (
    <form action={action} className="mt-3 flex flex-col gap-3">
      <input type="hidden" name="chairId" value={chairId} />
      <input type="hidden" name="teacherId" value={member.teacherId} />
      <label className="text-[13px] text-ink">
        Último período que integró
        <select
          name="untilTermId"
          required
          className={fieldClass}
          value={untilTermId}
          onChange={(event) => setUntilTermId(event.target.value)}
        >
          <option value="">Elegí un período</option>
          {eligibleTerms.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </label>
      <p className="text-[12px] text-ink-3">
        El período elegido queda incluido. El integrante se conserva en el historial.
      </p>
      {state.status === 'error' && (
        <p role="alert" className="text-[13px] text-ink">
          {state.message}
        </p>
      )}
      <div className="flex gap-3">
        <button
          type="submit"
          className={buttonClass}
          disabled={pending || !hydrated || eligibleTerms.length === 0}
        >
          {pending ? 'Guardando…' : 'Confirmar cierre'}
        </button>
        <button
          type="button"
          disabled={pending}
          className="text-[13px] text-ink underline"
          onClick={() => setOpen(false)}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
