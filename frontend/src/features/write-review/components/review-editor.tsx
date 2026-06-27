'use client';

import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';

import { DisplayHeading } from '@/components/ui/display-heading';
import { Lede } from '@/components/ui/lede';
import { type DeletableReview, DeleteReviewModal } from '@/features/delete-review';
import { publishReviewAction } from '../actions';
import { MOCK_ANONYMOUS_IDENTITY } from '../data/mocks';
import { REVIEW_FORM_DEFAULTS, reviewFormSchema } from '../schema';
import type {
  CommissionTeacherOption,
  EnrollmentContext,
  PublishReviewResult,
  ReviewDraft,
} from '../types';
import { PUBLISH_REVIEW_INITIAL_STATE } from '../types';
import { DifficultySteps } from './difficulty-steps';
import { EnrollmentContextCard } from './enrollment-context-card';
import { FieldHead } from './field-head';
import { HoursSlider } from './hours-slider';
import { PreviewCard } from './preview-card';
import { PrivacyCard } from './privacy-card';
import { RecommendationsToggles } from './recommendations-toggles';
import { StarRatingInput } from './star-rating-input';
import { TagsPicker } from './tags-picker';
import { TeacherPicker } from './teacher-picker';

/**
 * Editor mode. <c>write</c> calls the publish action and posts a new review;
 * <c>edit</c> calls a caller-provided action that PATCHes the existing review (US-018).
 *
 * The two modes share 100% of the layout and most of the form state. The differences
 * (header copy, CTA label, the id field name in the hidden input, the action that the
 * form submits to) are passed in as props so this component stays the single editor.
 */
export type ReviewEditorMode = 'write' | 'edit';

type ServerAction = (prev: PublishReviewResult, formData: FormData) => Promise<PublishReviewResult>;

/**
 * Review editor, feature orchestrator (US-049). Mounts the header with CTAs, the two
 * columns (form + preview/privacy) and owns the form state.
 *
 * Internal decisions:
 *  - State: a single useState with the full draft. For six fields we do not need
 *    TanStack Form: boilerplate cost outweighs the benefit. If US-018 (edit) introduces
 *    reactive field-level validation, we migrate to TanStack Form.
 *  - Validation: Zod at submit (in the server action). The client only disables the
 *    Publish button until rating, difficulty and the two toggles are valid.
 *  - Server action: see actions.ts. Today it is a stub (no backend); when the backend
 *    rework lands it can be wired in without touching this component.
 *  - Save-draft button: kept visible for parity with the mockup, but it opens a
 *    temporary alert. The backend does not support drafts yet (upcoming US).
 */
/**
 * The page resolves the route param (`enrollmentId`) and passes it to the editor as a
 * dedicated prop. The display-only context (subject, teacher, period) keeps coming from
 * the mock until a backend endpoint resolves the full enrollment detail. The id is what
 * the publish action sends to the backend, so this is the field that *must* be real.
 */
type Props = {
  ctx: EnrollmentContext;
  enrollmentId: string;
  /**
   * Teachers of the enrollment's commission, for the "who taught you" picker (write mode, US-065).
   * The selected one is sent as <c>docenteResenadoId</c>. Omitted in edit mode (the reviewed teacher
   * does not change on edit).
   */
  teachers?: CommissionTeacherOption[];
  /**
   * Editor mode. Defaults to <c>write</c> for backwards compatibility with the existing
   * US-049 publish flow.
   */
  mode?: ReviewEditorMode;
  /**
   * Optional initial draft. <c>edit</c> mode passes the persisted review's fields. The
   * defaults are merged in for any field the backend does not surface yet (rating,
   * hoursPerWeek, tags, recommendations), keeping the editor render-stable across the
   * lossy mapping.
   */
  initialDraft?: Partial<ReviewDraft>;
  /**
   * Server action that consumes the form's <c>FormData</c>. Defaults to the publish
   * action; <c>edit</c> mode passes the PATCH action from <c>features/edit-review</c>.
   */
  submitAction?: ServerAction;
  /**
   * Initial value for the action state. Same shape across modes (<c>PublishReviewResult</c>:
   * <c>idle | success | error</c>).
   */
  submitInitialState?: PublishReviewResult;
  /**
   * Name of the hidden input that carries the target id (the form's resource id). In
   * <c>write</c> mode it is the enrollment id (the new review will be anchored to it);
   * in <c>edit</c> mode it is the review id. The default keeps the publish flow intact.
   */
  idFieldName?: 'enrollmentId' | 'reviewId';
  /**
   * When set (edit mode), renders a "Borrar" trigger in the header that opens the
   * delete-review modal (US-055). Carries the real review data for the modal preview, so
   * it is the edit page (which fetched the review) that supplies it, not the mock context.
   */
  deleteTarget?: DeletableReview;
};

export function ReviewEditor({
  ctx,
  enrollmentId,
  teachers,
  mode = 'write',
  initialDraft,
  submitAction = publishReviewAction,
  submitInitialState = PUBLISH_REVIEW_INITIAL_STATE,
  idFieldName = 'enrollmentId',
  deleteTarget,
}: Props) {
  const [draft, setDraft] = useState<ReviewDraft>({
    ...REVIEW_FORM_DEFAULTS,
    ...(initialDraft ?? {}),
  });
  // Selected teacher (write mode only): preselect when the commission has exactly one, so the
  // common single-titular case needs no extra tap.
  const [docenteResenadoId, setDocenteResenadoId] = useState<string | null>(
    teachers?.length === 1 ? teachers[0].teacherId : null,
  );
  const [state, formAction] = useActionState(submitAction, submitInitialState);
  const queryClient = useQueryClient();
  const router = useRouter();

  // The actions are pure mutations (no server-side revalidatePath/redirect; see
  // write-review/actions.ts for why). On success, the client owns the consequences:
  // invalidate the lists the mutation touched and navigate via a plain flight request.
  useEffect(() => {
    if (state.status !== 'success') return;
    queryClient.invalidateQueries({ queryKey: ['pending-reviews'] });
    queryClient.invalidateQueries({ queryKey: ['my-reviews'] });
    router.push(mode === 'edit' ? '/reviews?tab=mine' : '/reviews?tab=pending');
  }, [state.status, queryClient, router, mode]);

  // Typed helper to set a single field while keeping the rest of the draft.
  const updateField = <K extends keyof ReviewDraft>(key: K, value: ReviewDraft[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const toggleTag = (tag: string) =>
    setDraft((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag],
    }));

  // Enable the CTA when required fields are set. In write mode the v2 layout asks for
  // rating + difficulty + both toggles; in edit mode only the backend-mappable fields
  // (difficulty + subject text) are mandatory because the lossy mapping never sends
  // rating / tags / hoursPerWeek / recommendations to the server.
  // El texto es obligatorio al publicar: el aggregate Review exige al menos un texto y el editor
  // sólo recolecta este (50..2000 chars, ReviewText). Sin esto el botón se habilitaba y el publish
  // rebotaba 400 con un mensaje genérico.
  const hasValidText = !!draft.text && draft.text.trim().length >= 50;
  const canPublish =
    mode === 'edit'
      ? draft.difficulty >= 1
      : draft.rating >= 1 &&
        draft.difficulty >= 1 &&
        docenteResenadoId !== null &&
        hasValidText &&
        typeof draft.wouldRecommendCourse === 'boolean' &&
        typeof draft.wouldRetakeTeacher === 'boolean';

  const parsed = reviewFormSchema.safeParse(draft);
  // Zod requires rating >= 1 even in edit, so we skip the shape check there: the lossy
  // mapping makes the rating field meaningless for the backend until the rework lands.
  const isValidShape = mode === 'edit' ? true : parsed.success;

  return (
    <div className="py-6">
      {/* Header: eyebrow breadcrumb + title + subtitle + actions */}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 text-[12px] text-ink-3">
            <Link href="/reviews" className="hover:text-ink-2">
              Reseñas
            </Link>
            <span className="px-1 text-ink-4">{'>'}</span>
            <Link
              href={mode === 'edit' ? '/reviews?tab=mine' : '/reviews?tab=pending'}
              className="hover:text-ink-2"
            >
              {mode === 'edit' ? 'Mis reseñas' : 'Pendientes'}
            </Link>
            <span className="px-1 text-ink-4">{'>'}</span>
            <span className="text-ink-2">{mode === 'edit' ? 'Editar reseña' : 'Nueva reseña'}</span>
          </div>
          <DisplayHeading>
            {mode === 'edit' ? 'Editá tu reseña' : 'Reseñá tu cursada'}
          </DisplayHeading>
          <Lede className="mt-2">
            {mode === 'edit'
              ? 'Cambiá lo que quieras corregir o ampliar. Se vuelve a chequear el contenido al publicar.'
              : 'Una sola reseña por cursada: califica materia, docente, comisión y cuatri juntos. Es anónima para el resto.'}
          </Lede>
        </div>

        <div className="flex items-center gap-2">
          {mode === 'edit' && deleteTarget && <DeleteReviewModal review={deleteTarget} />}
          <form action={formAction} className="flex items-center gap-2">
            <input type="hidden" name={idFieldName} value={enrollmentId} />
            <input type="hidden" name="payload" value={JSON.stringify(draft)} />
            {mode === 'write' && (
              <input type="hidden" name="docenteResenadoId" value={docenteResenadoId ?? ''} />
            )}
            {mode === 'write' && <DraftButton />}
            <PublishButton
              disabled={!canPublish || !isValidShape}
              label={mode === 'edit' ? 'Guardar cambios' : 'Publicar reseña'}
              pendingLabel={mode === 'edit' ? 'Guardando...' : 'Publicando...'}
            />
          </form>
        </div>
      </div>

      {state.status === 'error' && (
        <div className="mb-4 rounded border border-st-failed-fg/30 bg-st-failed-bg px-4 py-3 text-sm text-st-failed-fg">
          {state.message}
        </div>
      )}

      <div className="grid gap-4" style={{ gridTemplateColumns: 'minmax(0, 1fr) 320px' }}>
        {/* FORM COL */}
        <div className="flex flex-col gap-3.5">
          <EnrollmentContextCard ctx={ctx} />

          {/* Docente picker (write mode): a quién reseñás de la comisión (US-065). */}
          {mode === 'write' && teachers && (
            <Card>
              <div className="flex items-baseline gap-1">
                <span className="text-[13px] font-medium text-ink">¿Quién te dio la cursada?</span>
                <span className="text-accent-ink" aria-hidden="true">
                  *
                </span>
              </div>
              <p className="mt-0.5 text-[12px] text-ink-3">
                Tu reseña queda asociada a este docente de la comisión.
              </p>
              <TeacherPicker
                teachers={teachers}
                selected={docenteResenadoId}
                onSelect={setDocenteResenadoId}
              />
            </Card>
          )}

          {/* Field 1: Rating */}
          <Card>
            <FieldHead
              n={1}
              label="¿Cómo te pareció la cursada en general?"
              required
              htmlFor="field-rating"
            />
            <StarRatingInput
              fieldId="field-rating"
              value={draft.rating}
              onChange={(v) => updateField('rating', v)}
            />
          </Card>

          {/* Field 2: Difficulty */}
          <Card>
            <FieldHead
              n={2}
              label="¿Qué tan difícil te resultó?"
              required
              htmlFor="field-difficulty"
            />
            <DifficultySteps
              fieldId="field-difficulty"
              value={draft.difficulty}
              onChange={(v) => updateField('difficulty', v)}
            />
          </Card>

          {/* Field 3: Hours */}
          <Card>
            <FieldHead
              n={3}
              label="¿Cuántas horas estudiabas por semana? (fuera de clase)"
              htmlFor="field-hours"
            />
            <HoursSlider
              fieldId="field-hours"
              value={draft.hoursPerWeek ?? 0}
              onChange={(v) => updateField('hoursPerWeek', v)}
            />
          </Card>

          {/* Field 4: Tags */}
          <Card>
            <FieldHead
              n={4}
              label="Etiquetá la cursada"
              hint={`Marcá las que apliquen, ayudan a otros a saber qué esperar. (${draft.tags.length} seleccionadas)`}
              htmlFor="field-tags"
            />
            <TagsPicker fieldId="field-tags" selected={draft.tags} onToggle={toggleTag} />
          </Card>

          {/* Field 5: Free text */}
          <Card>
            <FieldHead
              n={5}
              label="Contá tu experiencia"
              required={mode === 'write'}
              hint="Lo que te hubiera gustado leer antes de inscribirte. Se publica anónimo."
              htmlFor="field-text"
            />
            <textarea
              id="field-text"
              value={draft.text ?? ''}
              onChange={(e) => updateField('text', e.target.value || undefined)}
              placeholder="¿Cómo era la dinámica de clase? ¿Cómo eran los parciales / TPs? ¿Algo que te sorprendió? ¿Recomendarías la cursada?"
              maxLength={2000}
              className="mt-3 min-h-[140px] w-full resize-y rounded border border-line bg-bg-card px-3.5 py-3 font-sans text-[13px] leading-relaxed text-ink outline-none focus:border-accent"
            />
            <div className="mt-1.5 flex justify-between text-[11px] text-ink-3">
              <span>Mínimo 50 caracteres, sé respetuoso</span>
              <span className="font-mono">{(draft.text ?? '').length} / 2000</span>
            </div>
          </Card>

          {/* Field 6: Recommendations */}
          <Card>
            <FieldHead n={6} label="Dos preguntas rápidas" htmlFor="field-recommendations" />
            <RecommendationsToggles
              fieldId="field-recommendations"
              wouldRecommendCourse={draft.wouldRecommendCourse}
              wouldRetakeTeacher={draft.wouldRetakeTeacher}
              onChangeRecommend={(v) => updateField('wouldRecommendCourse', v)}
              onChangeRetake={(v) => updateField('wouldRetakeTeacher', v)}
            />
          </Card>

          {/* Form footer: Cancel */}
          <div className="mt-1 flex justify-start">
            <Link
              href={mode === 'edit' ? '/reviews?tab=mine' : '/reviews?tab=pending'}
              className="text-[12px] text-ink-3 underline-offset-2 hover:text-ink-2 hover:underline"
            >
              {mode === 'edit'
                ? 'Cancelar y volver a Mis reseñas'
                : 'Cancelar y volver a pendientes'}
            </Link>
          </div>
        </div>

        {/* ASIDE COL */}
        <aside className="flex flex-col gap-3.5 self-start">
          <PreviewCard
            rating={draft.rating}
            text={draft.text ?? ''}
            tags={draft.tags}
            identity={{
              // Period is real (from the enrollment). Year + career stay placeholders until
              // the session carries them (US-012); the sidebar hardcodes them for the same
              // reason. Wiring real values here is part of that US, not this one.
              year: MOCK_ANONYMOUS_IDENTITY.year,
              career: MOCK_ANONYMOUS_IDENTITY.career,
              period: ctx.period ?? MOCK_ANONYMOUS_IDENTITY.period,
            }}
          />
          <PrivacyCard />
        </aside>
      </div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg border border-line bg-bg-card p-4">{children}</div>;
}

function PublishButton({
  disabled,
  label,
  pendingLabel,
}: {
  disabled: boolean;
  label: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="rounded px-4 py-2 text-[13px] font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
      style={{
        background: 'var(--color-accent)',
      }}
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

/**
 * Save-draft button stub. The backend does not support drafts yet (upcoming US). We keep
 * the button visible to match the mockup but it opens a temporary alert. When the
 * backend US lands, a dedicated server action will be wired in.
 */
function DraftButton() {
  return (
    <button
      type="button"
      onClick={() =>
        alert('Guardar borrador llega en una proxima entrega. Por ahora, deja la pestana abierta.')
      }
      className="rounded border border-line bg-bg-card px-4 py-2 text-[13px] text-ink-2 transition-colors hover:bg-bg-elev"
    >
      Guardar borrador
    </button>
  );
}
