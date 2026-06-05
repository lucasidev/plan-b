import type { Modality } from '../types';

/**
 * Pill compacta de modalidad (1c/2c/anual/bim). Color por tipo. Espejo de
 * `v2-screens.jsx::V2Mod`.
 */
const PALETTE: Record<Modality, [string, string]> = {
  '1c': ['oklch(0.93 0.06 70)', 'oklch(0.45 0.12 60)'],
  '2c': ['oklch(0.93 0.05 250)', 'oklch(0.42 0.12 260)'],
  anual: ['oklch(0.94 0.05 145)', 'oklch(0.42 0.09 145)'],
  bim1: ['oklch(0.94 0.04 30)', 'oklch(0.45 0.13 30)'],
  bim2: ['oklch(0.94 0.04 30)', 'oklch(0.45 0.13 30)'],
  bim3: ['oklch(0.94 0.04 30)', 'oklch(0.45 0.13 30)'],
  bim4: ['oklch(0.94 0.04 30)', 'oklch(0.45 0.13 30)'],
};

const LABEL: Record<Modality, string> = {
  '1c': '1er cuatri',
  '2c': '2do cuatri',
  anual: 'anual',
  bim1: '1er bim',
  bim2: '2do bim',
  bim3: '3er bim',
  bim4: '4to bim',
};

export function ModalityPill({ mod }: { mod: Modality }) {
  const [bg, fg] = PALETTE[mod];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '2px 8px',
        borderRadius: 999,
        background: bg,
        color: fg,
        fontSize: 10.5,
        fontWeight: 500,
        fontFamily: 'var(--font-mono)',
        letterSpacing: '0.02em',
      }}
    >
      {LABEL[mod]}
    </span>
  );
}
