import Link from 'next/link';
import { cn } from '@/lib/utils';
import { TONE_PRESENTATION } from '../reasons';
import type { ReportQueueCounts, ReportQueueFilters, ReportTone } from '../types';

const BASE = '/admin/moderacion/reportes';
const TONES: ReportTone[] = ['urgent', 'normal', 'low'];

/**
 * Filter chips de la cola (US-050). Son Links puros (sin estado cliente): cambian los query params y la
 * RSC re-fetchea con el filtro aplicado. Los de status (abiertos/cerrados) preservan el tono activo;
 * los de tono togglean (click de nuevo lo saca). El count de cada chip viene del read model.
 */
function hrefFor(status: 'open' | 'closed', tone: ReportTone | null): string {
  const params = new URLSearchParams();
  if (status !== 'open') {
    params.set('status', status);
  }
  if (tone) {
    params.set('tone', tone);
  }
  const qs = params.toString();
  return qs ? `${BASE}?${qs}` : BASE;
}

function Chip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-pressed={active}
      className={cn(
        'inline-flex h-7 items-center gap-1.5 rounded-pill px-3 text-[12px] transition-colors',
        active
          ? 'bg-ink text-white'
          : 'border border-line bg-bg-card text-ink-2 hover:border-ink hover:text-ink',
      )}
    >
      {children}
    </Link>
  );
}

function Count({ children }: { children: number }) {
  return <span className="font-mono text-[11px] opacity-60">{children}</span>;
}

export function FilterChips({
  counts,
  active,
}: {
  counts: ReportQueueCounts;
  active: ReportQueueFilters;
}) {
  const toneCount: Record<ReportTone, number> = {
    urgent: counts.urgentCount,
    normal: counts.normalCount,
    low: counts.lowCount,
  };

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <Chip href={hrefFor('open', active.tone)} active={active.status === 'open'}>
        Abiertos <Count>{counts.openCount}</Count>
      </Chip>
      <Chip href={hrefFor('closed', active.tone)} active={active.status === 'closed'}>
        Cerrados (7d) <Count>{counts.closedLast7d}</Count>
      </Chip>

      <div className="flex-1" />

      {TONES.map((tone) => {
        const isActive = active.tone === tone;
        const { emoji, chipLabel } = TONE_PRESENTATION[tone];
        return (
          <Chip key={tone} href={hrefFor(active.status, isActive ? null : tone)} active={isActive}>
            <span aria-hidden="true">{emoji}</span> {chipLabel} <Count>{toneCount[tone]}</Count>
          </Chip>
        );
      })}
    </div>
  );
}
