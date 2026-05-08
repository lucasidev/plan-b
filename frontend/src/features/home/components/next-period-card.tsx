import { Card } from '@/components/ui/card';

type Props = {
  /** Año a planificar (típicamente `currentPeriod.year + 1`). */
  nextYear: number;
};

/**
 * Bloque "Pensando en lo que viene" del Inicio v2. Card con CTA
 * "Planificar {nextYear} →" que invita a armar un borrador del próximo
 * año académico. Port directo de las líneas 234-246 del mock V2Inicio.
 *
 * El destino real (`/planificar?tab=borrador`) aterriza con US-016 / US-R-Planificar.
 * Mientras tanto, el botón queda disabled con tooltip "Próximamente".
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
      {/* TODO(US-016 + US-R-Planificar): enchufar link real a /planificar?tab=borrador */}
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
