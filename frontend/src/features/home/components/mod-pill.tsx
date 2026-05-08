import { cn } from '@/lib/utils';

/**
 * Modalidades soportadas, alineadas al mock `v2-shell.jsx::V2_MOD_LABEL`.
 * Cuando el plan académico use una modalidad nueva (ej. trimestral), agregar
 * acá + extender `MOD_LABEL` y `MOD_PALETTE`.
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
 * Tailwind classes per modality. Mantiene el espíritu del mock (warm para
 * cuatri 1, cool para cuatri 2, green para anual, ámbar para bims) usando
 * tokens del design system existentes en lugar de OKLCH literal del mock.
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
 * Pill compacta de modalidad. Port de `V2Mod` del mock `v2-screens.jsx`.
 * Si recibe un valor fuera de `Modality` (ej. mock mal armado con
 * `'trimestral'`), cae al fallback neutral con label literal.
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
