'use client';

import { useRouter } from 'next/navigation';
import { useId, useState, useTransition } from 'react';
import { changeUserAccessAction } from '../actions';
import type { AdminUserRow } from '../types';

export function UserTable({ users }: { users: AdminUserRow[] }) {
  if (users.length === 0)
    return (
      <p className="rounded-lg border border-line p-6 text-sm text-ink-2">
        No hay cuentas con esos filtros.
      </p>
    );
  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-bg-card">
      <table className="w-full text-left text-[13px]">
        <thead className="border-b border-line bg-bg-elev text-ink-3">
          <tr>
            <th className="p-3">Cuenta</th>
            <th className="p-3">Perfil académico</th>
            <th className="p-3">Estado y acceso</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <UserRow key={user.id} user={user} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UserRow({ user }: { user: AdminUserRow }) {
  const router = useRouter();
  const reasonId = useId();
  const [editing, setEditing] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const suspended = user.disabledAt !== null;

  function changeAccess() {
    setError(null);
    startTransition(async () => {
      const result = await changeUserAccessAction({
        id: user.id,
        operation: suspended ? 'restore' : 'suspend',
        reason,
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setEditing(false);
      setReason('');
      router.refresh();
    });
  }

  return (
    <tr className="border-b border-line-2 align-top last:border-0">
      <td className="p-3">
        <p className="break-all font-medium">{user.email}</p>
        {user.displayName && <p className="text-ink-2">{user.displayName}</p>}
        <p className="mt-1 text-xs text-ink-3">
          Alta: {new Date(user.createdAt).toLocaleDateString('es-AR', { timeZone: 'UTC' })}
        </p>
      </td>
      <td className="p-3 text-ink-2">
        <p>
          {user.careerName ?? (user.careerId ? 'Carrera no disponible' : 'Sin perfil de alumno')}
        </p>
        {user.universityName && <p className="text-xs text-ink-3">{user.universityName}</p>}
        {user.enrollmentYear && (
          <p className="mt-1 text-xs text-ink-3">Ingreso: {user.enrollmentYear}</p>
        )}
      </td>
      <td className="min-w-60 p-3">
        <p className="font-medium">
          {suspended ? 'Suspendida' : user.emailVerifiedAt ? 'Activa' : 'Email pendiente'}
        </p>
        {suspended && (
          <p className="mt-1 break-words text-xs text-ink-2">Motivo: {user.disabledReason}</p>
        )}
        {editing ? (
          <form
            className="mt-2 space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              changeAccess();
            }}
          >
            <label htmlFor={reasonId} className="block text-xs">
              Motivo de la suspensión
            </label>
            <textarea
              id={reasonId}
              required
              maxLength={500}
              value={reason}
              disabled={pending}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded border border-line bg-bg p-2"
            />
            <p className="text-xs text-ink-3">Se bloquea el acceso. Sus aportes se conservan.</p>
            <button
              type="submit"
              disabled={pending || !reason.trim()}
              className="mr-3 underline disabled:opacity-50"
            >
              {pending ? 'Guardando…' : 'Confirmar suspensión'}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setEditing(false);
                setError(null);
              }}
            >
              Cancelar
            </button>
          </form>
        ) : (
          <button
            type="button"
            disabled={pending}
            className="mt-2 underline underline-offset-2 disabled:opacity-50"
            onClick={() => (suspended ? changeAccess() : setEditing(true))}
          >
            {pending ? 'Guardando…' : suspended ? 'Reactivar acceso' : 'Suspender acceso'}
          </button>
        )}
        {error && (
          <p role="alert" className="mt-2 text-xs text-alarm-ink">
            {error}
          </p>
        )}
      </td>
    </tr>
  );
}
