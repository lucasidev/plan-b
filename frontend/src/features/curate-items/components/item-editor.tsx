'use client';

import { useActionState, useEffect, useState } from 'react';
import { useHydrated } from '@/lib/use-hydrated';
import { editItemAction, supersedeItemAction } from '../actions';
import { ITEM_LAYERS, OPTION_VALENCES } from '../schema';
import { type CatalogItem, type ChangeKind, initialCurateItemState } from '../types';

const LAYER_LABELS: Record<(typeof ITEM_LAYERS)[number], string> = {
  Context: 'Contexto de la cursada',
  ChairConduct: 'Qué hizo la cátedra',
  StudentExperience: 'Qué te pasó a vos',
};

const VALENCE_LABELS: Record<(typeof OPTION_VALENCES)[number], string> = {
  None: 'sin valencia',
  Positive: 'buena',
  Neutral: 'neutra',
  Negative: 'mala',
};

type DraftOption = { value: number; label: string; valence: (typeof OPTION_VALENCES)[number] };

/**
 * Editar una frase del catálogo (US-198).
 *
 * <p>
 * <b>La pantalla arranca preguntando qué estás cambiando, y esa es toda la decisión de diseño.</b>
 * El sistema no puede saber si cambió el significado de una pregunta: puede ver que el texto es
 * distinto, pero no si sigue preguntando lo mismo. Solo lo sabe quien edita. Adivinarlo tiene dos
 * formas de salir mal, y las dos son caras: cortar una serie que no había que cortar tira a la
 * basura la comparabilidad de todo lo respondido, y no cortar una que sí mezcla en un mismo
 * porcentaje respuestas a dos preguntas distintas.
 * </p>
 *
 * <p>
 * Por eso se declara, y por eso el aviso del corte nombra la consecuencia con su código y sus
 * respuestas, en vez de decir "esta acción es irreversible": lo irreversible no le dice a nadie qué
 * va a pasar, y "las respuestas de antes se quedan bajo el código viejo" sí se entiende.
 * </p>
 */
export function ItemEditor({ item, onDone }: { item: CatalogItem; onDone: () => void }) {
  const [kind, setKind] = useState<ChangeKind | null>(null);

  // Cambiar de frase en el catálogo vuelve a la declaración: la respuesta anterior era sobre otra
  // pregunta, y arrastrarla dejaría el aviso del corte armado sobre algo que nadie declaró.
  // biome-ignore lint/correctness/useExhaustiveDependencies: el reset es por frase, no por su contenido
  useEffect(() => setKind(null), [item.id]);

  if (!item.isActive) {
    return <RetiredNotice item={item} />;
  }

  return (
    <div>
      <header className="mb-4">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-ink-3">
          {item.code}
        </p>
        <h2 className="mt-0.5 text-[15px] leading-snug text-ink">{item.text}</h2>
        <p className="mt-1 text-[11.5px] text-ink-3">
          {LAYER_LABELS[item.layer as (typeof ITEM_LAYERS)[number]] ?? item.layer} ·{' '}
          {answers(item.answerCount)}
          {item.lastChangedBy ? (
            <>
              {' '}
              · último cambio: {item.lastChangedBy}, {formatDate(item.updatedAt)}
            </>
          ) : null}
        </p>
      </header>

      <fieldset className="mb-4">
        <legend className="mb-2 text-[13px] font-medium text-ink">¿Qué estás cambiando?</legend>
        <div className="grid grid-cols-2 gap-2.5">
          <KindCard
            selected={kind === 'wording'}
            onSelect={() => setKind('wording')}
            title="Cómo está escrito"
            detail="La misma pregunta, mejor redactada. Conserva su código y todo lo respondido se sigue contando junto."
          />
          <KindCard
            selected={kind === 'meaning'}
            onSelect={() => setKind('meaning')}
            title="Lo que pregunta"
            detail="Otra pregunta. Abre un código nuevo y lo de antes deja de compararse con lo de ahora."
          />
        </div>
      </fieldset>

      {kind === 'wording' && <WordingForm item={item} onDone={onDone} />}
      {kind === 'meaning' && <MeaningForm item={item} onDone={onDone} />}
    </div>
  );
}

/** Una de las dos declaraciones. Es un botón y no un radio para que la tarjeta entera sea el blanco. */
function KindCard({
  selected,
  onSelect,
  title,
  detail,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  detail: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className="rounded-lg border p-3 text-left"
      style={{
        borderColor: selected ? 'var(--color-accent)' : 'var(--color-line)',
        background: selected ? 'var(--color-accent-soft)' : 'var(--color-bg-card)',
      }}
    >
      <span className="block text-[12.5px] font-medium text-ink">{title}</span>
      <span className="mt-1 block text-[11px] leading-relaxed text-ink-3">{detail}</span>
    </button>
  );
}

/** El camino que NO corta la serie: mismo código, mismas respuestas comparables. */
function WordingForm({ item, onDone }: { item: CatalogItem; onDone: () => void }) {
  const [state, action, pending] = useActionState(editItemAction, initialCurateItemState);
  const [options, setOptions] = useState<DraftOption[]>(() => toDraft(item));
  const hydrated = useHydrated();

  useEffect(() => setOptions(toDraft(item)), [item]);

  useEffect(() => {
    if (state.status === 'saved') onDone();
  }, [state.status, onDone]);

  const disabled = pending || !hydrated;

  return (
    <form action={action}>
      <input type="hidden" name="itemId" value={item.id} />
      <OptionsField options={options} />

      <Fields item={item} options={options} setOptions={setOptions} disabled={disabled} />

      <div className="mt-4 flex items-center gap-3">
        <button
          type="submit"
          disabled={disabled}
          className="rounded-lg px-3.5 py-2 text-[13px] font-medium disabled:opacity-60"
          style={{ background: 'var(--color-ink)', color: 'var(--color-bg-card)' }}
        >
          {pending ? 'Guardando…' : 'Guardar el cambio'}
        </button>
        <span className="text-[11.5px] text-ink-3">
          Sigue siendo <span className="font-mono">{item.code}</span>, con sus{' '}
          {answers(item.answerCount)}.
        </span>
      </div>

      {state.status === 'error' && <ErrorNote message={state.message} />}
    </form>
  );
}

/** El camino que SÍ corta la serie. El aviso va antes del submit, no después. */
function MeaningForm({ item, onDone }: { item: CatalogItem; onDone: () => void }) {
  const [state, action, pending] = useActionState(supersedeItemAction, initialCurateItemState);
  const [options, setOptions] = useState<DraftOption[]>(() => toDraft(item));
  const [code, setCode] = useState(() => `${item.code}_B`);
  const hydrated = useHydrated();

  useEffect(() => {
    setOptions(toDraft(item));
    setCode(`${item.code}_B`);
  }, [item]);

  useEffect(() => {
    if (state.status === 'cut') onDone();
  }, [state.status, onDone]);

  const disabled = pending || !hydrated;

  return (
    <form action={action}>
      <input type="hidden" name="itemId" value={item.id} />
      <OptionsField options={options} />

      <label htmlFor="item-code" className="mb-1 block text-[12.5px] text-ink-2">
        El código nuevo
      </label>
      <input
        id="item-code"
        name="code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        disabled={disabled}
        className="mb-3 w-full rounded-lg border border-line bg-bg px-3 py-2 font-mono text-[12.5px] text-ink disabled:opacity-60"
      />

      <Fields item={item} options={options} setOptions={setOptions} disabled={disabled} />

      {/* El aviso dice la consecuencia con nombre y número. "Esta acción es irreversible" no le
          dice a nadie qué va a pasar con lo que ya se respondió, que es lo único que importa acá. */}
      <div
        className="mt-4 rounded-lg border p-3"
        style={{ borderColor: 'var(--color-accent)', background: 'var(--color-accent-soft)' }}
      >
        <p className="text-[12.5px] font-medium" style={{ color: 'var(--color-accent-ink)' }}>
          Esto corta la serie
        </p>
        <ul className="mt-1.5 space-y-1 text-[11.5px] leading-relaxed text-ink-2">
          <li>
            Nace <span className="font-mono">{code || 'el código nuevo'}</span> y arranca en cero,
            en el mismo lugar del cuestionario.
          </li>
          <li>
            <span className="font-mono">{item.code}</span> deja de ofrecerse y se queda con sus{' '}
            {answers(item.answerCount)}, que no se borran.
          </li>
          <li>
            La ficha de cada cátedra va a mostrar los dos tramos separados, diciendo que no se
            comparan entre sí.
          </li>
        </ul>
      </div>

      <div className="mt-3">
        <button
          type="submit"
          disabled={disabled}
          className="rounded-lg px-3.5 py-2 text-[13px] font-medium disabled:opacity-60"
          style={{ background: 'var(--color-accent-ink)', color: '#fff' }}
        >
          {pending ? 'Abriendo…' : 'Abrir el código nuevo'}
        </button>
      </div>

      {state.status === 'error' && <ErrorNote message={state.message} />}
    </form>
  );
}

/** Los campos que los dos caminos comparten: el enunciado, la ayuda, la capa y las opciones. */
function Fields({
  item,
  options,
  setOptions,
  disabled,
}: {
  item: CatalogItem;
  options: DraftOption[];
  setOptions: (options: DraftOption[]) => void;
  disabled: boolean;
}) {
  return (
    <>
      <label htmlFor="item-text" className="mb-1 block text-[12.5px] text-ink-2">
        La pregunta
      </label>
      <textarea
        id="item-text"
        name="text"
        required
        rows={2}
        maxLength={200}
        defaultValue={item.text}
        disabled={disabled}
        className="mb-3 w-full rounded-lg border border-line bg-bg px-3 py-2 text-[13.5px] leading-relaxed text-ink disabled:opacity-60"
      />

      <label htmlFor="item-help" className="mb-1 block text-[12.5px] text-ink-2">
        Aclaración <span className="text-ink-3">(opcional)</span>
      </label>
      <input
        id="item-help"
        name="help"
        maxLength={500}
        defaultValue={item.help ?? ''}
        disabled={disabled}
        className="mb-3 w-full rounded-lg border border-line bg-bg px-3 py-2 text-[13px] text-ink disabled:opacity-60"
      />

      <label htmlFor="item-layer" className="mb-1 block text-[12.5px] text-ink-2">
        La capa <span className="text-ink-3">(decide qué bloque de la ficha lo cuenta)</span>
      </label>
      <select
        id="item-layer"
        name="layer"
        defaultValue={item.layer}
        disabled={disabled}
        className="mb-3 w-full rounded-lg border border-line bg-bg px-3 py-2 text-[13px] text-ink disabled:opacity-60"
      >
        {ITEM_LAYERS.map((layer) => (
          <option key={layer} value={layer}>
            {LAYER_LABELS[layer]}
          </option>
        ))}
      </select>

      <p className="mb-1.5 text-[12.5px] text-ink-2">Las opciones</p>
      <div className="space-y-1.5">
        {options.map((option, index) => (
          <div key={option.value} className="flex items-center gap-2">
            <input
              aria-label={`Etiqueta de la opción ${index + 1}`}
              value={option.label}
              disabled={disabled}
              onChange={(e) =>
                setOptions(
                  options.map((o, i) => (i === index ? { ...o, label: e.target.value } : o)),
                )
              }
              className="flex-1 rounded-lg border border-line bg-bg px-3 py-1.5 text-[13px] text-ink disabled:opacity-60"
            />
            <select
              aria-label={`Lado de la opción ${index + 1}`}
              value={option.valence}
              disabled={disabled}
              onChange={(e) =>
                setOptions(
                  options.map((o, i) =>
                    i === index
                      ? { ...o, valence: e.target.value as (typeof OPTION_VALENCES)[number] }
                      : o,
                  ),
                )
              }
              className="rounded-lg border border-line bg-bg px-2 py-1.5 text-[12px] text-ink-2 disabled:opacity-60"
            >
              {OPTION_VALENCES.map((valence) => (
                <option key={valence} value={valence}>
                  {VALENCE_LABELS[valence]}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
      <p className="mt-1.5 text-[11px] leading-relaxed text-ink-3">
        A una opción que ya tiene respuestas se le puede corregir la etiqueta, pero no se la puede
        sacar: las reseñas viejas la apuntan.
      </p>
    </>
  );
}

/**
 * Las opciones viajan como JSON en un campo oculto: son un array de largo variable y `FormData` no
 * lo expresa sin inventar una convención de nombres.
 */
function OptionsField({ options }: { options: DraftOption[] }) {
  return (
    <input
      type="hidden"
      name="options"
      value={JSON.stringify(
        options.map((option, index) => ({
          value: option.value,
          order: index + 1,
          label: option.label,
          valence: option.valence,
        })),
      )}
    />
  );
}

/**
 * Una frase retirada se lee y no se edita: su texto es el enunciado bajo el que se respondió, y la
 * ficha lo muestra al lado de sus conteos.
 */
function RetiredNotice({ item }: { item: CatalogItem }) {
  return (
    <div>
      <p className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-ink-3 line-through">
        {item.code}
      </p>
      <h2 className="mt-0.5 text-[15px] leading-snug text-ink-2">{item.text}</h2>
      <p className="mt-3 text-[12.5px] leading-relaxed text-ink-2">
        Retirada{item.retiredAt ? ` el ${formatDate(item.retiredAt)}` : ''}
        {item.supersededByCode ? (
          <>
            , reemplazada por <span className="font-mono">{item.supersededByCode}</span>
          </>
        ) : null}
        . Conserva sus {answers(item.answerCount)}, que se siguen publicando como el tramo anterior
        de la pregunta de hoy.
      </p>
      <p className="mt-2 text-[11.5px] leading-relaxed text-ink-3">
        No se edita: este texto es la pregunta que esas respuestas contestaron. Cambiarlo sería
        reescribir lo que se preguntó.
      </p>
    </div>
  );
}

function ErrorNote({ message }: { message: string }) {
  return (
    <p role="alert" className="mt-2.5 text-[12.5px] text-accent-ink">
      {message}
    </p>
  );
}

/**
 * Las opciones de la frase como las edita el form. El `value` se conserva porque es lo que las
 * respuestas guardaron: reasignarlo dejaría huérfano todo lo contestado.
 */
function toDraft(item: CatalogItem): DraftOption[] {
  return item.options.map((option) => ({
    value: option.value,
    label: option.label,
    valence: option.valence as (typeof OPTION_VALENCES)[number],
  }));
}

function answers(count: number): string {
  return count === 1 ? '1 respuesta' : `${count} respuestas`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
