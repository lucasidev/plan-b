import { Card } from '@/components/ui/card';
import type { ActiveSubject } from '../data/active-subjects';
import { ModPill } from './mod-pill';

type Props = {
  subjects: ActiveSubject[];
};

/**
 * "Más adelante" block of the v2 Home. Port of lines 161-185 of the
 * `v2-screens.jsx::V2Inicio` mock. Compact list of subjects that start later in the
 * period (typically the 2nd-term ones seen from the 1st).
 *
 * Renders only when it receives items (`subjects.length > 0`). Filtering
 * `s.week === 0` and deciding whether to render is the parent page's
 * responsibility, not the component's. The component still keeps a defensive guard:
 * if an empty array arrives by mistake, it returns null.
 */
export function UpcomingSubjectsCard({ subjects }: Props) {
  if (subjects.length === 0) return null;
  return (
    <Card className="p-5">
      <h2 className="font-display font-semibold text-base text-ink mb-2 mt-0">Más adelante</h2>
      <div className="flex flex-col">
        {subjects.map((s, i) => (
          <div
            key={s.code}
            className={`flex justify-between items-center py-[9px] ${
              i ? 'border-t border-line' : ''
            }`}
          >
            <div className="flex items-center gap-[10px]">
              <span className="font-mono text-[10.5px] text-ink-3">{s.code}</span>
              <ModPill mod={s.mod} />
              <span className="text-[13px] text-ink-2">{s.name}</span>
            </div>
            <span className="text-[11.5px] text-ink-3 font-mono">{s.next}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
