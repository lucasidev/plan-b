import Link from 'next/link';
import { cn } from '@/lib/utils';

type Props = {
  code: string;
  name: string;
  /**
   * `ok` se usa para correlativas ya aprobadas (verde, check).
   * `next` se usa para materias que esta materia habilita (gris, flecha).
   */
  tone: 'ok' | 'next';
};

/**
 * Chip de correlativa para el drawer de materia (US-045-d). Port del
 * `V2CorrChip` del mock canvas. Linkea a `/mi-carrera/materia/[code]` para
 * permitir navegación entre detalles de materia (correlativa de B abre
 * drawer de B, browser back vuelve al drawer original).
 */
export function CorrelativaChip({ code, name, tone }: Props) {
  return (
    <Link
      href={`/mi-carrera/materia/${code}`}
      className={cn(
        'flex items-center gap-2 px-2.5 py-2 rounded-lg',
        'bg-bg-elev border border-line',
        'hover:border-accent transition-colors',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent',
      )}
    >
      <span
        className={cn(
          'w-5 h-5 rounded-full grid place-items-center text-[10px] font-semibold',
          tone === 'ok' && 'bg-st-approved-bg text-st-approved-fg',
          tone === 'next' && 'bg-bg-elev text-ink-2',
        )}
        aria-hidden
      >
        {tone === 'ok' ? '✓' : '→'}
      </span>
      <span className="font-mono text-[10.5px] tracking-wide text-ink-3 uppercase">{code}</span>
      <span className="text-sm text-ink">{name}</span>
    </Link>
  );
}
