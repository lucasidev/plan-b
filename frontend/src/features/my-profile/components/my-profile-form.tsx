'use client';

import { Pencil } from 'lucide-react';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { displayNameFromEmail } from '@/lib/member-shell';
import { reloadAfterMutation } from '@/lib/reload-after-mutation';
import { updateMyProfileAction } from '../actions';
import { initialUpdateProfileState, type MyProfile } from '../types';
import { ProfileAvatar } from './profile-avatar';

/**
 * Mi perfil conserva el año de ingreso y permite editar el nombre de la cuenta.
 */
type Props = {
  profile: MyProfile;
};

export function MyProfileForm({ profile }: Props) {
  const [editing, setEditing] = useState(false);

  const displayedName = profile.displayName ?? displayNameFromEmail(profile.email);

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <header className="flex items-center gap-5">
        <ProfileAvatar email={profile.email} />
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-semibold text-ink-1 truncate" title={displayedName}>
            {displayedName}
          </h2>
          <p className="text-sm text-ink-3 mt-1 truncate" title={profile.email}>
            {profile.email}
          </p>
          <p className="text-xs text-ink-4 mt-1">
            Miembro desde{' '}
            {new Date(profile.memberSince).toLocaleDateString('es-AR', {
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
      </header>

      {editing ? (
        <EditForm
          profile={profile}
          onCancel={() => setEditing(false)}
          onSaved={() => {
            // La página es force-dynamic: refrescar trae el profile posta del RSC. `router.refresh()`
            // puede perder el commit bajo carga (issue #491, mismo fallo que `router.push`): acá no
            // hay nada más en pantalla que perder, así que se fuerza un reload real en vez de confiar
            // en la transición de React. Ver `lib/reload-after-mutation.ts`.
            setEditing(false);
            reloadAfterMutation();
          }}
        />
      ) : (
        <ViewMode profile={profile} onEdit={() => setEditing(true)} />
      )}
    </div>
  );
}

function ViewMode({ profile, onEdit }: { profile: MyProfile; onEdit: () => void }) {
  return (
    <section className="bg-bg border border-line rounded-lg p-6 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-base font-semibold text-ink-1">Datos académicos</h3>
        <Button type="button" variant="secondary" size="sm" onClick={onEdit}>
          <Pencil className="size-4" aria-hidden />
          Editar
        </Button>
      </div>
      <dl className="grid grid-cols-[140px_1fr] gap-x-4 gap-y-3 text-sm">
        <Row label="Año de ingreso">{profile.enrollmentYear ?? '-'}</Row>
      </dl>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="text-ink-3 font-mono text-xs uppercase tracking-wider pt-0.5">{label}</dt>
      <dd className="text-ink-1">{children}</dd>
    </>
  );
}

type EditFormProps = {
  profile: MyProfile;
  onCancel: () => void;
  onSaved: () => void;
};

function EditForm({ profile, onCancel, onSaved }: EditFormProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Parsea el FormData en un patch e invoca el action. Recién cuando el action contesta
  // 'success' se avisa al padre, y en la misma transición: así la vista nunca muestra el
  // nombre viejo, y un guardado fallido deja el form abierto con lo que la persona tipeó.
  function handleSubmit(formData: FormData) {
    const displayName = formData.get('displayName')?.toString().trim() ?? '';

    const patch: Record<string, unknown> = {
      displayName: displayName.length > 0 ? displayName : undefined,
    };

    setError(null);
    startTransition(async () => {
      const result = await updateMyProfileAction(initialUpdateProfileState, patch);
      if (result.status === 'success') {
        onSaved();
      } else if (result.status === 'error') {
        setError(result.message);
      }
    });
  }

  return (
    <section className="bg-bg border border-line rounded-lg p-6">
      <h3 className="text-base font-semibold text-ink-1 mb-4">Editar datos académicos</h3>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit(new FormData(event.currentTarget));
        }}
        className="space-y-4"
      >
        <TextField
          label="Nombre para mostrar"
          name="displayName"
          defaultValue={profile.displayName ?? ''}
          maxLength={80}
          hint="Cómo querés que te llamemos en tu cuenta. Tus reseñas se cuentan sin tu nombre."
        />

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}

        <div className="flex gap-2 justify-end pt-2">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? 'Guardando…' : 'Guardar'}
          </Button>
        </div>
      </form>
    </section>
  );
}
