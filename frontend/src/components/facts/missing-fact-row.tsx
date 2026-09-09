import { cn } from '@/lib/utils';

/**
 * Un dato oficial que ninguna afirmación cubre todavía para este sujeto puntual (ADR-0090), a
 * diferencia de `OfficialFactRow`, que siempre parte de una afirmación real. Misma forma visual
 * que el estado "no publicado" de `OfficialFactRow`, sin fecha porque acá no hubo ni siquiera un
 * relevamiento que decir "no publicado". La comparten Dónde estudiarla y la ficha de carrera: los
 * mismos campos, con la misma forma, en cualquier pantalla que publique estos datos.
 */
export function MissingFactRow({ label, last }: { label: string; last: boolean }) {
  return (
    <div className={cn('py-2.5', !last && 'border-b border-line-2')}>
      <p className="mb-1 text-[11px] text-ink-3">{label}</p>
      <p className="text-[13px] leading-relaxed text-ink-3">
        Todavía no se relevó para esta oferta.
      </p>
    </div>
  );
}
