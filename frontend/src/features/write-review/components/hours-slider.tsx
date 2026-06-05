'use client';

/**
 * Editor field 3 (US-049): optional weekly study hours outside class.
 * Range slider 0..20 with a monospaced live value next to it and visual ticks (0 / 10 / 20+).
 *
 * The mockup uses accent-color on the native input (`accent-accent`). The large number
 * uses font-mono and updates on-change. No onBlur, no debounce.
 *
 * The US-049 doc says 0..30, but the mockup settled on 0..20 because more than 20 hs/week
 * outside class is an outlier and the slider loses legibility. We keep the mockup as the
 * source of truth.
 */
export function HoursSlider({
  value,
  onChange,
  fieldId,
}: {
  value: number;
  onChange: (v: number) => void;
  fieldId: string;
}) {
  return (
    <div className="mt-3.5">
      <div className="flex items-baseline gap-3.5">
        <input
          id={fieldId}
          type="range"
          min={0}
          max={20}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 accent-accent"
          aria-label="Horas de estudio por semana"
        />
        <div className="min-w-[80px] text-right font-mono text-lg font-semibold text-ink">
          {value} <small className="font-normal text-[11px] text-ink-3">hs/sem</small>
        </div>
      </div>
      <div className="mt-1 flex justify-between font-mono text-[10.5px] text-ink-3">
        <span>0</span>
        <span>10</span>
        <span>20+</span>
      </div>
    </div>
  );
}
