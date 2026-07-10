import { TONE_PRESENTATION } from '../reasons';
import type { ReportTone } from '../types';

/** Dot de urgencia de la fila (US-050). Color del canvas; el label va al aria para lectores. */
export function ToneDot({ tone }: { tone: ReportTone }) {
  const { dotColor, label } = TONE_PRESENTATION[tone];
  return (
    <span
      className="inline-block h-2 w-2 rounded-full"
      style={{ backgroundColor: dotColor }}
      role="img"
      aria-label={`Urgencia ${label}`}
    />
  );
}
