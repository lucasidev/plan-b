import { Card } from '@/components/ui/card';
import type { Movement } from '../data/movements';

type Props = {
  movements: Movement[];
};

/**
 * Bloque "Movimientos" del Inicio v2. Feed compacto de notifs / eventos
 * recientes del entorno del alumno. Port literal de las líneas 248-272
 * del mock V2Inicio. Cada item es un grid 56px/1fr (timestamp izquierda,
 * body derecha).
 *
 * Empty state mantiene la card visible para no saltar el layout cuando
 * el alumno está al día.
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
