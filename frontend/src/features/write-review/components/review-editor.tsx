'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';

import { DisplayHeading } from '@/components/ui/display-heading';
import { Lede } from '@/components/ui/lede';
import { publishReviewAction } from '../actions';
import { MOCK_ANONYMOUS_IDENTITY } from '../data/mocks';
import { REVIEW_FORM_DEFAULTS, reviewFormSchema } from '../schema';
import type { EnrollmentContext, ReviewDraft } from '../types';
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
};

export function ReviewEditor({ ctx, enrollmentId }: Props) {
  const [draft, setDraft] = useState<ReviewDraft>(REVIEW_FORM_DEFAULTS);
  const [state, formAction] = useActionState(publishReviewAction, PUBLISH_REVIEW_INITIAL_STATE);

  // Typed helper to set a single field while keeping the rest of the draft.
  const updateField = <K extends keyof ReviewDraft>(key: K, value: ReviewDraft[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const toggleTag = (tag: string) =>
    setDraft((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag],
    }));

  // Enable Publish only when the required fields are set: rating and difficulty are not
  // zero, and both toggles have a value (true/false are both valid). Plus a Zod sanity
  // check on the whole shape.
  const canPublish =
    draft.rating >= 1 &&
    draft.difficulty >= 1 &&
    typeof draft.wouldRecommendCourse === 'boolean' &&
    typeof draft.wouldRetakeTeacher === 'boolean';

  const parsed = reviewFormSchema.safeParse(draft);
  const isValidShape = parsed.success;

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
            <Link href="/reviews?tab=pending" className="hover:text-ink-2">
              Pendientes
            </Link>
            <span className="px-1 text-ink-4">{'>'}</span>
            <span className="text-ink-2">Nueva reseña</span>
          </div>
          <DisplayHeading>Reseñá tu cursada</DisplayHeading>
          <Lede className="mt-2">
            Una sola reseña por cursada: califica materia, docente, comisión y cuatri juntos. Es
            anónima para el resto.
          </Lede>
        </div>

        <form action={formAction} className="flex items-center gap-2">
          <input type="hidden" name="enrollmentId" value={enrollmentId} />
          <input type="hidden" name="payload" value={JSON.stringify(draft)} />
          <DraftButton />
          <PublishButton disabled={!canPublish || !isValidShape} />
        </form>
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
              hint="Lo que te hubiera gustado leer antes de inscribirte. Se publica anónimo."
              htmlFor="field-text"
            />
            <textarea
              id="field-text"
              value={draft.text ?? ''}
              onChange={(e) => updateField('text', e.target.value || undefined)}
              placeholder="¿Cómo era la dinámica de clase? ¿Cómo eran los parciales / TPs? ¿Algo que te sorprendió? ¿Recomendarías la cursada?"
              maxLength={4000}
              className="mt-3 min-h-[140px] w-full resize-y rounded border border-line bg-bg-card px-3.5 py-3 font-sans text-[13px] leading-relaxed text-ink outline-none focus:border-accent"
            />
            <div className="mt-1.5 flex justify-between text-[11px] text-ink-3">
              <span>Mínimo libre, sé respetuoso</span>
              <span className="font-mono">{(draft.text ?? '').length} caracteres</span>
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
              href="/reviews?tab=pending"
              className="text-[12px] text-ink-3 underline-offset-2 hover:text-ink-2 hover:underline"
            >
              Cancelar y volver a pendientes
            </Link>
          </div>
        </div>

        {/* ASIDE COL */}
        <aside className="flex flex-col gap-3.5 self-start">
          <PreviewCard
            rating={draft.rating}
            text={draft.text ?? ''}
            tags={draft.tags}
            identity={MOCK_ANONYMOUS_IDENTITY}
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

function PublishButton({ disabled }: { disabled: boolean }) {
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
      {pending ? 'Publicando...' : 'Publicar reseña'}
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
