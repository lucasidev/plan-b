'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';

import { DisplayHeading } from '@/components/ui/display-heading';
import { Lede } from '@/components/ui/lede';
import { publishReviewAction } from '../actions';
import { MOCK_ANONYMOUS_IDENTITY } from '../data/mocks';
import { REVIEW_FORM_DEFAULTS, reviewFormSchema } from '../schema';
import type { CursadaContext, ReviewDraft } from '../types';
import { PUBLISH_REVIEW_INITIAL_STATE } from '../types';
import { CursadaContextCard } from './cursada-context-card';
import { DifficultySteps } from './difficulty-steps';
import { FieldHead } from './field-head';
import { HoursSlider } from './hours-slider';
import { PreviewCard } from './preview-card';
import { PrivacyCard } from './privacy-card';
import { RecommendationsToggles } from './recommendations-toggles';
import { StarRatingInput } from './star-rating-input';
import { TagsPicker } from './tags-picker';

/**
 * Editor de resena, orchestrator del feature (US-049). Monta el header con CTAs, las
 * dos columnas (form + preview/privacy) y maneja el estado del form.
 *
 * Decisiones internas:
 *  - Estado: un unico useState con el draft completo. Para 6 campos no necesitamos
 *    TanStack Form, el costo de boilerplate supera el beneficio. Si en US-018 (editar)
 *    aparece field-level validation reactiva, migramos a TanStack Form.
 *  - Validacion: zod al submit (en el server action). El client solo deshabilita el
 *    boton Publicar hasta que rating, difficulty y las recomendaciones estan OK.
 *  - Server action: ver actions.ts. Hoy es stub (no toca backend); cuando aterrice el
 *    rework backend se acopla sin tocar este componente.
 *  - Boton Guardar borrador: queda visible para coherencia con el mockup, pero abre un
 *    alert temporal. El backend no soporta drafts todavia (US futura).
 */
export function ReviewEditor({ ctx }: { ctx: CursadaContext }) {
  const [draft, setDraft] = useState<ReviewDraft>(REVIEW_FORM_DEFAULTS);
  const [state, formAction] = useActionState(publishReviewAction, PUBLISH_REVIEW_INITIAL_STATE);

  // Helper tipado para setear un solo campo manteniendo el resto.
  const updateField = <K extends keyof ReviewDraft>(key: K, value: ReviewDraft[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const toggleTag = (tag: string) =>
    setDraft((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag],
    }));

  // Habilita Publicar solo cuando los obligatorios estan: rating y difficulty no son 0,
  // y las dos toggles tienen valor (true/false ambos validos). Sanity check zod tambien.
  const canPublish =
    draft.rating >= 1 &&
    draft.difficulty >= 1 &&
    typeof draft.wouldRecommendCourse === 'boolean' &&
    typeof draft.wouldRetakeTeacher === 'boolean';

  const parsed = reviewFormSchema.safeParse(draft);
  const isValidShape = parsed.success;

  return (
    <div className="py-6">
      {/* Header: eyebrow breadcrumb + titulo + subtitulo + acciones */}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 text-[12px] text-ink-3">
            {/* TODO US-048: estos links van a /reseñas?tab=pendientes cuando exista. */}
            <span className="hover:text-ink-2">Reseñas</span>
            <span className="px-1 text-ink-4">{'>'}</span>
            <span className="hover:text-ink-2">Pendientes</span>
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
        {/* COL FORM */}
        <div className="flex flex-col gap-3.5">
          <CursadaContextCard ctx={ctx} />

          {/* Campo 1: Rating */}
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

          {/* Campo 2: Dificultad */}
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

          {/* Campo 3: Horas */}
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

          {/* Campo 4: Tags */}
          <Card>
            <FieldHead
              n={4}
              label="Etiquetá la cursada"
              hint={`Marcá las que apliquen, ayudan a otros a saber qué esperar. (${draft.tags.length} seleccionadas)`}
              htmlFor="field-tags"
            />
            <TagsPicker fieldId="field-tags" selected={draft.tags} onToggle={toggleTag} />
          </Card>

          {/* Campo 5: Texto */}
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

          {/* Campo 6: Recomendaciones */}
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

          {/* Footer del form: Cancelar */}
          <div className="mt-1 flex justify-start">
            {/* TODO US-048: a /reseñas?tab=pendientes cuando exista; por ahora /inicio. */}
            <Link
              href="/inicio"
              className="text-[12px] text-ink-3 underline-offset-2 hover:text-ink-2 hover:underline"
            >
              Cancelar y volver al inicio
            </Link>
          </div>
        </div>

        {/* COL ASIDE */}
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
 * Boton Guardar borrador stub. El backend no soporta drafts todavia (US futura).
 * Mantenemos el boton visible para coherencia con el mockup pero abre un alert temporal.
 * Cuando aterrice la US del backend, se enchufa una server action separada.
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
