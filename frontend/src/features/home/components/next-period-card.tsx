import { Card } from '@/components/ui/card';

type Props = {
  /** Year to plan (typically `currentPeriod.year + 1`). */
  nextYear: number;
};

/**
 * "Pensando en lo que viene" block of the v2 Home. Card with a "Planificar {nextYear}
 * →" CTA that invites the student to draft the next academic year. Direct port of
 * lines 234-246 of the V2Inicio mock.
 *
 * The real destination (`/plan?tab=draft`) lands with US-016 / US-R-Planificar.
 * Meanwhile the button stays disabled with the "Próximamente" tooltip.
 */
export function NextPeriodCard({ nextYear }: Props) {
  return (
    <Card className="p-5">
      <div className="font-mono text-[10.5px] text-ink-3 tracking-[0.08em] uppercase mb-[6px]">
        Pensando en lo que viene
      </div>
      <p className="text-sm text-ink-2 leading-relaxed mb-3">
        Armá un borrador de {nextYear} y comparalo con vos antes de inscribirte.
      </p>
      {/* TODO(US-016 + US-R-Planificar): wire up the real link to /plan?tab=draft */}
      <button
        type="button"
        disabled
        title="Próximamente"
        className="block w-full text-center px-[14px] py-2 text-[12.5px] font-medium border border-line rounded text-ink-3 cursor-not-allowed"
      >
        Planificar {nextYear} →
      </button>
    </Card>
  );
}
