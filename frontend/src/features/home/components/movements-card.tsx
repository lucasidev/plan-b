import { Card } from '@/components/ui/card';
import type { Movement } from '../data/movements';

type Props = {
  movements: Movement[];
};

/**
 * "Movimientos" block of the v2 Home. Compact feed of recent notifs / events from the
 * student's environment. Literal port of lines 248-272 of the V2Inicio mock. Each
 * item is a 56px/1fr grid (timestamp on the left, body on the right).
 *
 * Empty state keeps the card visible so the layout does not jump when the student is
 * caught up.
 */
export function MovementsCard({ movements }: Props) {
  return (
    <Card className="p-5">
      <h2 className="font-display font-semibold text-base text-ink mb-2 mt-0">Movimientos</h2>
      {movements.length === 0 ? (
        <p className="text-[13px] text-ink-3 italic">Sin novedades por ahora.</p>
      ) : (
        <div className="flex flex-col">
          {movements.map((m, i) => (
            <div
              key={m.id}
              className={`grid grid-cols-[56px_1fr] gap-[10px] py-2 ${
                i ? 'border-t border-line' : ''
              }`}
            >
              <span className="font-mono text-[10.5px] text-ink-3 tracking-wide">
                {m.timestamp}
              </span>
              <span className="text-[12.5px] text-ink-2 leading-snug">{m.body}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
