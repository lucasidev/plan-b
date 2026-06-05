import type { SubjectModality } from '@/features/my-career/data/plan';

const label: Record<SubjectModality, string> = {
  anual: 'anual',
  '1c': '1c',
  '2c': '2c',
};

/**
 * Mono badge for the course modality. Appears in the top-right corner of each
 * plan-grid cell. It is the SOURCE OF TRUTH for how the subject is taken (the cátedra
 * defines it). Variants: anual / 1c / 2c.
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
