import { cn } from '@/lib/utils';

/**
 * Supported modalities, aligned with the `v2-shell.jsx::V2_MOD_LABEL` mock. When the
 * academic plan uses a new modality (e.g. trimestral), add it here and extend
 * `MOD_LABEL` and `MOD_PALETTE`.
 */
export type Modality = 'anual' | '1c' | '2c' | '1s' | '2s' | 'bim1' | 'bim2' | 'bim3' | 'bim4';

const MOD_LABEL: Record<Modality, string> = {
  '1c': 'Cuatri 1',
  '2c': 'Cuatri 2',
  '1s': 'Sem 1',
  '2s': 'Sem 2',
  anual: 'Anual',
  bim1: 'Bim 1',
  bim2: 'Bim 2',
  bim3: 'Bim 3',
  bim4: 'Bim 4',
};

/**
 * Tailwind classes per modality. Keeps the spirit of the mock (warm for term 1, cool
 * for term 2, green for anual, amber for bims) using existing design-system tokens
 * instead of the literal OKLCH from the mock.
 */
const MOD_PALETTE: Record<Modality, string> = {
  '1c': 'bg-st-coursing-bg text-st-coursing-fg',
  '2c': 'bg-st-regularized-bg text-st-regularized-fg',
  '1s': 'bg-st-coursing-bg text-st-coursing-fg',
  '2s': 'bg-st-regularized-bg text-st-regularized-fg',
  anual: 'bg-st-approved-bg text-st-approved-fg',
  bim1: 'bg-st-failed-bg text-st-failed-fg',
  bim2: 'bg-st-failed-bg text-st-failed-fg',
  bim3: 'bg-st-failed-bg text-st-failed-fg',
  bim4: 'bg-st-failed-bg text-st-failed-fg',
};

type Props = {
  mod: Modality | string;
  className?: string;
};

/**
 * Compact modality pill. Port of `V2Mod` from the `v2-screens.jsx` mock. If it
 * receives a value outside `Modality` (e.g. a mock built wrong with `'trimestral'`),
 * it falls back to the neutral palette with the literal label.
 */
export function ModPill({ mod, className }: Props) {
  const isKnown = (Object.keys(MOD_LABEL) as Modality[]).includes(mod as Modality);
  const palette = isKnown ? MOD_PALETTE[mod as Modality] : 'bg-line text-ink-3';
  const label = isKnown ? MOD_LABEL[mod as Modality] : mod || '-';
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-[2px] rounded-pill font-mono text-[10.5px] font-medium tracking-wide',
        palette,
        className,
      )}
    >
      {label}
    </span>
  );
}
