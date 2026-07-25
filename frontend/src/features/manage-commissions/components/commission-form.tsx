'use client';

import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useId, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useHydrated } from '@/lib/use-hydrated';
import { cn } from '@/lib/utils';
import { createCommissionAction, updateCommissionAction } from '../actions';
import {
  COMMISSION_DAY_LABELS,
  COMMISSION_DAYS,
  COMMISSION_MODALITIES,
  COMMISSION_MODALITY_LABELS,
  COMMISSION_TEACHER_ROLE_LABELS,
  COMMISSION_TEACHER_ROLES,
} from '../schema';
import {
  type CommissionSubjectOption,
  type CommissionTeacherOption,
  initialManageCommissionState,
  type SubjectCommissionRow,
} from '../types';

type Props = {
  /** create: alta bajo el término de la ruta, con select de materia. edit: prefill con el detalle. */
  mode: 'create' | 'edit';
  universityId: string;
  termId: string;
  teachers: CommissionTeacherOption[];
  /** create: catálogo de materias elegibles (ya filtrado por cadencia del término). */
  subjects?: CommissionSubjectOption[];
  /** edit: detalle de la comisión (incluye el id). */
  commission?: SubjectCommissionRow;
};

type TeacherRowState = { key: string; teacherId: string; role: string };
type ScheduleRowState = { key: string; day: string; start: string; end: string };

const inputClass =
  'w-full rounded-md border border-line bg-bg-card px-3 py-2 text-[13px] text-ink outline-none focus:border-ink-3';

/**
 * Form de alta/edición de comisión (US-093 admin). React 19 primitives + Zod en el action, mismo
 * patrón que TeacherForm/SubjectForm. Materia y término son inmutables en la edición (no se pueden
 * mover, mismo criterio que Subject.Update no toca CareerPlanId): el select de materia solo aparece
 * en alta.
 *
 * Docentes y horario son repeaters: cada fila agrega inputs con el mismo `name` que el resto de sus
 * filas (`teacherId`/`teacherRole`, `scheduleDay`/`scheduleStart`/`scheduleEnd`); el server action los
 * zipea por posición con `FormData.getAll` (mismo criterio que los chips de dominios en
 * `manage-universities`, extendido a filas de más de un campo). Mutación pura (ADR-0046): en success
 * redirige al listado "Comisiones · término".
 */
export function CommissionForm({
  mode,
  universityId,
  termId,
  teachers,
  subjects,
  commission,
}: Props) {
  const router = useRouter();
  const isEdit = mode === 'edit';
  // Antes de hidratar el submit viaja como POST nativo: la mutación pasa pero el error nunca se ve.
  const hydrated = useHydrated();
  const [state, formAction, isPending] = useActionState(
    isEdit ? updateCommissionAction : createCommissionAction,
    initialManageCommissionState,
  );

  const [teacherRows, setTeacherRows] = useState<TeacherRowState[]>(() =>
    (commission?.teachers ?? []).map((t, i) => ({
      key: `initial-teacher-${i}`,
      teacherId: t.teacherId,
      role: t.role,
    })),
  );
  const [scheduleRows, setScheduleRows] = useState<ScheduleRowState[]>(() =>
    (commission?.schedule ?? []).map((s, i) => ({
      key: `initial-schedule-${i}`,
      day: s.day,
      start: s.start,
      end: s.end,
    })),
  );
  // Contador para las keys de filas agregadas después del mount (nunca corre en el render inicial,
  // así que no hay riesgo de desalinear la hidratación server/cliente).
  const nextRowId = useRef(0);
  function newRowKey(prefix: string): string {
    nextRowId.current += 1;
    return `${prefix}-new-${nextRowId.current}`;
  }

  function addTeacherRow() {
    setTeacherRows((prev) => [...prev, { key: newRowKey('teacher'), teacherId: '', role: '' }]);
  }
  function removeTeacherRow(key: string) {
    setTeacherRows((prev) => prev.filter((r) => r.key !== key));
  }
  function addScheduleRow() {
    setScheduleRows((prev) => [
      ...prev,
      { key: newRowKey('schedule'), day: '', start: '', end: '' },
    ]);
  }
  function removeScheduleRow(key: string) {
    setScheduleRows((prev) => prev.filter((r) => r.key !== key));
  }

  const ids = {
    subjectId: useId(),
    name: useId(),
    modality: useId(),
    capacity: useId(),
    notes: useId(),
  };

  const listHref = `/admin/commissions?universityId=${universityId}&termId=${termId}`;

  useEffect(() => {
    if (state.status !== 'success') return;
    // Solo `push`: el `refresh()` apuntaba a la ruta actual y competía con la navegación, comiéndose
    // el redirect a veces (mismo fix que TeacherForm/TermForm). El listado es `force-dynamic`.
    router.push(listHref);
  }, [state, router, listHref]);

  return (
    <form action={formAction} className="flex max-w-3xl flex-col gap-5">
      {isEdit && commission ? (
        <input type="hidden" name="id" value={commission.id} />
      ) : (
        <input type="hidden" name="termId" value={termId} />
      )}

      {!isEdit && (
        <Field label="Materia" htmlFor={ids.subjectId}>
          <select
            id={ids.subjectId}
            name="subjectId"
            required
            defaultValue=""
            className={inputClass}
          >
            <option value="">Elegí una materia</option>
            {(subjects ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.code} · {s.name} ({s.careerName}
                {s.planLabel ? ` · ${s.planLabel}` : ''})
              </option>
            ))}
          </select>
        </Field>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-[1.4fr_1fr_120px]">
        <Field label="Nombre de la comisión" htmlFor={ids.name} hint='Ej: "A", "B", "Noche".'>
          <input
            id={ids.name}
            name="name"
            required
            maxLength={100}
            defaultValue={commission?.name ?? ''}
            className={inputClass}
          />
        </Field>
        <Field label="Modalidad" htmlFor={ids.modality}>
          <select
            id={ids.modality}
            name="modality"
            required
            defaultValue={commission?.modality ?? ''}
            className={inputClass}
          >
            <option value="">Elegí una modalidad</option>
            {COMMISSION_MODALITIES.map((m) => (
              <option key={m} value={m}>
                {COMMISSION_MODALITY_LABELS[m]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Cupo" htmlFor={ids.capacity} hint="Opcional.">
          <input
            id={ids.capacity}
            name="capacity"
            type="number"
            min={1}
            defaultValue={commission?.capacity ?? ''}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Notas" htmlFor={ids.notes} hint="Opcional. Uso interno del equipo de gestión.">
        <textarea
          id={ids.notes}
          name="notes"
          rows={3}
          maxLength={2000}
          defaultValue={commission?.notes ?? ''}
          className={`${inputClass} resize-y`}
        />
      </Field>

      <div className="flex flex-col gap-2.5 border-t border-line pt-4">
        <div className="flex items-center justify-between">
          <h2 className="m-0 text-[13px] font-medium text-ink">Docentes</h2>
          <Button type="button" variant="ghost" size="sm" onClick={addTeacherRow}>
            + Agregar docente
          </Button>
        </div>
        {teacherRows.length === 0 && (
          <p className="m-0 text-[12px] text-ink-3">Sin docentes asignados todavía.</p>
        )}
        {teacherRows.map((row) => (
          <TeacherRowFields
            key={row.key}
            row={row}
            teachers={teachers}
            onRemove={() => removeTeacherRow(row.key)}
          />
        ))}
      </div>

      <div className="flex flex-col gap-2.5 border-t border-line pt-4">
        <div className="flex items-center justify-between">
          <h2 className="m-0 text-[13px] font-medium text-ink">Horario</h2>
          <Button type="button" variant="ghost" size="sm" onClick={addScheduleRow}>
            + Agregar bloque
          </Button>
        </div>
        {scheduleRows.length === 0 && (
          <p className="m-0 text-[12px] text-ink-3">Sin horario cargado todavía.</p>
        )}
        {scheduleRows.map((row) => (
          <ScheduleRowFields key={row.key} row={row} onRemove={() => removeScheduleRow(row.key)} />
        ))}
      </div>

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
          onClick={() => router.push(listHref)}
        >
          Cancelar
        </Button>
        <Button type="submit" size="sm" disabled={isPending || !hydrated}>
          {isPending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear comisión'}
        </Button>
      </div>
    </form>
  );
}

function TeacherRowFields({
  row,
  teachers,
  onRemove,
}: {
  row: TeacherRowState;
  teachers: CommissionTeacherOption[];
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <select
        name="teacherId"
        required
        defaultValue={row.teacherId}
        aria-label="Docente"
        className={cn(inputClass, 'flex-1')}
      >
        <option value="">Elegí un docente</option>
        {teachers.map((t) => (
          <option key={t.id} value={t.id}>
            {t.lastName}, {t.firstName}
          </option>
        ))}
      </select>
      <select
        name="teacherRole"
        required
        defaultValue={row.role}
        aria-label="Rol"
        className={cn(inputClass, 'w-32 flex-shrink-0')}
      >
        <option value="">Rol</option>
        {COMMISSION_TEACHER_ROLES.map((role) => (
          <option key={role} value={role}>
            {COMMISSION_TEACHER_ROLE_LABELS[role]}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={onRemove}
        aria-label="Quitar docente"
        className="shrink-0 rounded px-1.5 py-0.5 text-[13px] text-ink-3 hover:bg-st-failed-bg hover:text-st-failed-fg"
      >
        ×
      </button>
    </div>
  );
}

function ScheduleRowFields({ row, onRemove }: { row: ScheduleRowState; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <select
        name="scheduleDay"
        required
        defaultValue={row.day}
        aria-label="Día"
        className={cn(inputClass, 'flex-1')}
      >
        <option value="">Elegí un día</option>
        {COMMISSION_DAYS.map((day) => (
          <option key={day} value={day}>
            {COMMISSION_DAY_LABELS[day]}
          </option>
        ))}
      </select>
      <input
        type="time"
        name="scheduleStart"
        required
        defaultValue={row.start}
        aria-label="Hora de inicio"
        className={cn(inputClass, 'w-32 flex-shrink-0')}
      />
      <input
        type="time"
        name="scheduleEnd"
        required
        defaultValue={row.end}
        aria-label="Hora de fin"
        className={cn(inputClass, 'w-32 flex-shrink-0')}
      />
      <button
        type="button"
        onClick={onRemove}
        aria-label="Quitar bloque horario"
        className="shrink-0 rounded px-1.5 py-0.5 text-[13px] text-ink-3 hover:bg-st-failed-bg hover:text-st-failed-fg"
      >
        ×
      </button>
    </div>
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
