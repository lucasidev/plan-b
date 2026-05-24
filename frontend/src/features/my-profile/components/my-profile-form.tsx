'use client';

import { Pencil } from 'lucide-react';
import { useActionState, useId, useState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { TextField } from '@/components/ui/text-field';
import { displayNameFromEmail } from '@/lib/member-shell';
import { updateMyProfileAction } from '../actions';
import { initialUpdateProfileState, type MyProfile, type UpdateProfileFormState } from '../types';
import { ProfileAvatar } from './profile-avatar';

/**
 * Shell de Mi perfil (US-047). Toggle entre view mode (default) y edit mode. View mode lista
 * los datos académicos + identidad; edit mode habilita displayName, yearOfStudy, legajo y
 * regularStudent. Universidad / Carrera / Plan / Email NO se editan acá (cambios mayores
 * que requieren flows propios post-MVP).
 *
 * <para>
 * Implementación con React 19 primitives (useActionState + useFormStatus) en lugar de
 * TanStack Form. ADR-0022 sugiere TanStack a partir de 4+ campos pero acá los 4 campos son
 * planos sin lógica cross-field compleja; el costo de setup de TanStack supera el beneficio.
 * Deuda explícita: si aterrizan validaciones cross-field (legajo válido por universidad),
 * migrar.
 * </para>
 */
type Props = {
  profile: MyProfile;
};

export function MyProfileForm({ profile }: Props) {
  const [editing, setEditing] = useState(false);
  const [state, formAction] = useActionState(updateMyProfileAction, initialUpdateProfileState);
  const [, startTransition] = useTransition();

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
          formAction={formAction}
          state={state}
          onCancel={() => setEditing(false)}
          onSuccess={() => {
            startTransition(() => setEditing(false));
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
          <Pencil className="h-4 w-4" aria-hidden />
          Editar
        </Button>
      </div>
      <dl className="grid grid-cols-[140px_1fr] gap-x-4 gap-y-3 text-sm">
        <Row label="Año cursando">
          {profile.yearOfStudy ? `${profile.yearOfStudy}° año` : <Empty />}
        </Row>
        <Row label="Año de ingreso">{profile.enrollmentYear}</Row>
        <Row label="Legajo">{profile.legajo ?? <Empty />}</Row>
        <Row label="Estado">{profile.regularStudent ? 'Regular' : 'Libre'}</Row>
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

function Empty() {
  return <span className="text-ink-4 italic">Sin cargar</span>;
}

type EditFormProps = {
  profile: MyProfile;
  formAction: (patch: unknown) => void;
  state: UpdateProfileFormState;
  onCancel: () => void;
  onSuccess: () => void;
};

function EditForm({ profile, formAction, state, onCancel, onSuccess }: EditFormProps) {
  const formId = useId();

  // Wrapper que parsea el FormData a JSON payload + invoca el action.
  const handleSubmit = (formData: FormData) => {
    const displayName = formData.get('displayName')?.toString().trim() ?? '';
    const yearOfStudy = formData.get('yearOfStudy')?.toString();
    const legajo = formData.get('legajo')?.toString().trim() ?? '';
    const regularStudent = formData.get('regularStudent') === 'on';

    const patch: Record<string, unknown> = {
      displayName: displayName.length > 0 ? displayName : undefined,
      yearOfStudy: yearOfStudy ? Number(yearOfStudy) : undefined,
      legajo: legajo.length > 0 ? legajo : undefined,
      regularStudent,
    };

    formAction(patch);
  };

  // Si el último submit fue success, ejecutamos onSuccess para volver a view mode.
  if (state.status === 'success') {
    onSuccess();
  }

  return (
    <section className="bg-bg border border-line rounded-lg p-6">
      <h3 className="text-base font-semibold text-ink-1 mb-4">Editar datos académicos</h3>
      <form id={formId} action={handleSubmit} className="space-y-4">
        <TextField
          label="Nombre para mostrar"
          name="displayName"
          defaultValue={profile.displayName ?? ''}
          maxLength={80}
          hint="Cómo querés que te vean en la app y en tus reseñas."
        />
        <div>
          <Label htmlFor="yearOfStudy" className="text-sm">
            Año cursando
          </Label>
          <select
            id="yearOfStudy"
            name="yearOfStudy"
            defaultValue={profile.yearOfStudy ?? ''}
            className="mt-1 block w-full rounded border border-line bg-bg px-3 py-2 text-sm"
          >
            <option value="">Sin especificar</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <option key={n} value={n}>
                {n}° año
              </option>
            ))}
          </select>
        </div>
        <TextField
          label="Legajo (opcional)"
          name="legajo"
          defaultValue={profile.legajo ?? ''}
          maxLength={32}
        />
        <div className="flex items-center gap-2">
          <input
            id="regularStudent"
            type="checkbox"
            name="regularStudent"
            defaultChecked={profile.regularStudent}
            className="rounded border-line"
          />
          <Label htmlFor="regularStudent" className="text-sm cursor-pointer">
            Soy alumno regular
          </Label>
        </div>

        {state.status === 'error' && (
          <p role="alert" className="text-sm text-danger">
            {state.message}
          </p>
        )}

        <div className="flex gap-2 justify-end pt-2">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
          <SaveButton formId={formId} />
        </div>
      </form>
    </section>
  );
}

function SaveButton({ formId }: { formId: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" form={formId} disabled={pending}>
      {pending ? 'Guardando…' : 'Guardar'}
    </Button>
  );
}
