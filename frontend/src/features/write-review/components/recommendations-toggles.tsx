'use client';

/**
 * Editor field 6 (US-049): two Yes/No questions. Mirrors `V2YesNo`. Each pair is a
 * radiogroup with two options. Built with fieldset + native radios + enclosing label so
 * screen readers announce "Sí, 1 of 2" / "No, 2 of 2" without forced ARIA.
 *
 *  - "Recomendarías esta cursada (materia + comisión)" → wouldRecommendCourse.
 *  - "Volverías a tomar clases con este docente" → wouldRetakeTeacher.
 *
 * Default true (happy path); the student has to tap "No" when the course or teacher
 * went poorly.
 */
function YesNoToggle({
  question,
  value,
  onChange,
  groupId,
}: {
  question: string;
  value: boolean;
  onChange: (v: boolean) => void;
  groupId: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3.5 rounded bg-bg-elev px-3 py-2.5">
      <span className="flex-1 text-[12.5px] text-ink-2" id={`${groupId}-q`}>
        {question}
      </span>
      <fieldset
        className="m-0 flex flex-shrink-0 gap-1 border-0 p-0"
        aria-labelledby={`${groupId}-q`}
      >
        {([true, false] as const).map((v) => {
          const isSelected = value === v;
          return (
            <label
              key={String(v)}
              className="cursor-pointer rounded px-3.5 py-1 text-[11.5px] transition-colors focus-within:outline-none focus-within:ring-2 focus-within:ring-accent"
              style={{
                border: `1px solid ${isSelected ? 'var(--color-accent)' : 'var(--color-line)'}`,
                background: isSelected ? 'var(--color-accent-soft)' : 'var(--color-bg-card)',
                color: isSelected ? 'var(--color-accent-ink)' : 'var(--color-ink-2)',
                fontWeight: isSelected ? 600 : 400,
              }}
            >
              <input
                type="radio"
                name={groupId}
                value={String(v)}
                checked={isSelected}
                onChange={() => onChange(v)}
                className="sr-only"
              />
              {v ? 'Sí' : 'No'}
            </label>
          );
        })}
      </fieldset>
    </div>
  );
}

export function RecommendationsToggles({
  wouldRecommendCourse,
  wouldRetakeTeacher,
  onChangeRecommend,
  onChangeRetake,
  fieldId,
}: {
  wouldRecommendCourse: boolean;
  wouldRetakeTeacher: boolean;
  onChangeRecommend: (v: boolean) => void;
  onChangeRetake: (v: boolean) => void;
  fieldId: string;
}) {
  return (
    <div className="mt-3.5 flex flex-col gap-2.5" id={fieldId}>
      <YesNoToggle
        question="¿Recomendarías esta cursada (materia + comisión) a alguien que la tiene que hacer?"
        value={wouldRecommendCourse}
        onChange={onChangeRecommend}
        groupId={`${fieldId}-course`}
      />
      <YesNoToggle
        question="¿Volverías a tomar clases con este docente?"
        value={wouldRetakeTeacher}
        onChange={onChangeRetake}
        groupId={`${fieldId}-teacher`}
      />
    </div>
  );
}
