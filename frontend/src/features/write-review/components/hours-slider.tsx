'use client';

/**
 * Campo 3 del editor (US-049): horas de estudio fuera de clase por semana, opcional.
 * Slider 0..20 con valor monoespaciado al lado y ticks visuales (0 / 10 / 20+).
 *
 * El mockup usa accent-color sobre el input nativo (`accent-accent`). El número grande
 * usa font-mono y se actualiza on-change. Sin onBlur, sin debounce.
 *
 * El doc de US-049 dice 0..30, pero el mockup zanjó 0..20 porque > 20 hs/sem fuera de
 * clase es outlier y el slider pierde legibilidad. Mantenemos el mockup como fuente.
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
