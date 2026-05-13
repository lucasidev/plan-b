import type { SubjectModality } from '@/features/mi-carrera/data/plan';

const label: Record<SubjectModality, string> = {
  anual: 'anual',
  '1c': '1c',
  '2c': '2c',
};

/**
 * Badge mono de la modalidad de cursada. Aparece en la esquina superior
 * derecha de cada celda del plan grid. Es la SOURCE OF TRUTH de cómo se
 * cursa la materia (la cátedra la define). Variantes: anual / 1c / 2c.
 */
export function ModalityBadge({ modality }: { modality: SubjectModality }) {
  return (
    <span
      className="font-mono uppercase tracking-wider text-ink-3"
      style={{ fontSize: 9.5, letterSpacing: '0.06em' }}
    >
      {label[modality]}
    </span>
  );
}
