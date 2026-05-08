import { Card } from '@/components/ui/card';
import type { ActiveSubject } from '../data/active-subjects';
import { ModPill } from './mod-pill';

type Props = {
  subjects: ActiveSubject[];
};

/**
 * Bloque "Más adelante" del Inicio v2. Port de las líneas 161-185 del mock
 * `v2-screens.jsx::V2Inicio`. Lista compacta de materias que arrancan
 * después en el período (típicamente las del 2° cuatri vistas desde el 1°).
 *
 * Renderiza solo si recibe items (`subjects.length > 0`). El responsable
 * de filtrar `s.week === 0` y decidir si renderearlo es la página padre,
 * no el componente. El componente aplica una guard adicional por
 * defensividad: si llega array vacío por error, devuelve null.
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
