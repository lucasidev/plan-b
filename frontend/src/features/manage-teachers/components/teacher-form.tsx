'use client';

import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { createTeacherAction, updateTeacherAction } from '../actions';
import { initialManageTeacherState, type TeacherDetail, type University } from '../types';

type Props = {
  /** create: alta desde cero. edit: prefill con el detalle del docente activo. */
  mode: 'create' | 'edit';
  universities: University[];
  teacher?: TeacherDetail;
};

const inputClass =
  'w-full rounded-md border border-line bg-bg-card px-3 py-2 text-[13px] text-ink outline-none focus:border-ink-3';

/**
 * Form de alta/edición de docente (US-063 admin). React 19 primitives + Zod en el action (el form es
 * plano, sin campos condicionales ni arrays). En la edición la universidad es inmutable (el aggregate
 * no la cambia) y se muestra read-only. Mutación pura (ADR-0046): en success redirige al listado.
 * La foto es una URL con preview en vivo (opción A; el upload de archivos es una US aparte).
 */
export function TeacherForm({ mode, universities, teacher }: Props) {
  const router = useRouter();
  const isEdit = mode === 'edit';
  const [state, formAction, isPending] = useActionState(
    isEdit ? updateTeacherAction : createTeacherAction,
    initialManageTeacherState,
  );
  const [photoUrl, setPhotoUrl] = useState(teacher?.photoUrl ?? '');
  const [firstName, setFirstName] = useState(teacher?.firstName ?? '');
  const [lastName, setLastName] = useState(teacher?.lastName ?? '');

  const ids = {
    university: useId(),
    firstName: useId(),
    lastName: useId(),
    title: useId(),
    bio: useId(),
    photo: useId(),
  };

  useEffect(() => {
    if (state.status !== 'success') return;
    router.push('/admin/teachers');
    router.refresh();
  }, [state, router]);

  const universityName =
    universities.find((u) => u.id === teacher?.universityId)?.name ?? 'Universidad';

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-5">
      {isEdit && teacher && <input type="hidden" name="id" value={teacher.id} />}

      <Field label="Universidad" htmlFor={ids.university}>
        {isEdit ? (
          <div className="flex h-[38px] items-center rounded-md border border-line bg-bg-elev px-3 text-[13px] text-ink-2">
            {universityName}
          </div>
        ) : (
          <select
            id={ids.university}
            name="universityId"
            required
            defaultValue={universities[0]?.id ?? ''}
            className={inputClass}
          >
            {universities.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        )}
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Nombre" htmlFor={ids.firstName}>
          <input
            id={ids.firstName}
            name="firstName"
            required
            maxLength={100}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Apellido" htmlFor={ids.lastName}>
          <input
            id={ids.lastName}
            name="lastName"
            required
            maxLength={100}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Cargo" htmlFor={ids.title} hint="Opcional. Ej: Titular, Adjunto, JTP.">
        <input
          id={ids.title}
          name="title"
          maxLength={100}
          defaultValue={teacher?.title ?? ''}
          className={inputClass}
        />
      </Field>

      <Field label="Bio" htmlFor={ids.bio} hint="Opcional. Máximo 2000 caracteres.">
        <textarea
          id={ids.bio}
          name="bio"
          maxLength={2000}
          rows={4}
          defaultValue={teacher?.bio ?? ''}
          className={`${inputClass} resize-y`}
        />
      </Field>

      <Field
        label="Foto (URL)"
        htmlFor={ids.photo}
        hint="Opcional. Pegá la URL de una imagen (http:// o https://)."
      >
        <div className="flex items-center gap-3">
          <PhotoPreview url={photoUrl} firstName={firstName} lastName={lastName} />
          <input
            id={ids.photo}
            name="photoUrl"
            type="url"
            maxLength={500}
            value={photoUrl}
            onChange={(e) => setPhotoUrl(e.target.value)}
            placeholder="https://..."
            className={inputClass}
          />
        </div>
      </Field>

      {state.status === 'error' && (
        <p className="m-0 text-[12.5px] text-st-failed-fg" role="alert">
          {state.message}
        </p>
      )}

      <div className="flex items-center justify-end gap-2 border-t border-line pt-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isPending}
          onClick={() => router.push('/admin/teachers')}
        >
          Cancelar
        </Button>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear docente'}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-[12px] font-medium text-ink-2">
        {label}
      </label>
      {children}
      {hint && <span className="text-[11px] text-ink-3">{hint}</span>}
    </div>
  );
}

function PhotoPreview({
  url,
  firstName,
  lastName,
}: {
  url: string;
  firstName: string;
  lastName: string;
}) {
  const initials =
    `${firstName.trim().charAt(0)}${lastName.trim().charAt(0)}`.toUpperCase() || '??';
  const showImage = /^https?:\/\/.+/i.test(url.trim());
  if (showImage) {
    return (
      // biome-ignore lint/performance/noImgElement: URL de foto externa, sin config de dominio de next/image.
      <img
        src={url.trim()}
        alt="Vista previa"
        className="h-11 w-11 flex-shrink-0 rounded-full object-cover"
      />
    );
  }
  return (
    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-bg-elev font-display text-[13px] font-semibold text-ink-2">
      {initials}
    </div>
  );
}
