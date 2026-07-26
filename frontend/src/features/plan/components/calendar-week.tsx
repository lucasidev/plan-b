import {
  computeHourRange,
  layoutWeekBlocks,
  type PositionedWeekBlock,
} from '../lib/calendar-blocks';
import type { CalendarWeekBlock } from '../types';

/**
 * Weekly calendar with subject blocks (US-096, real data). 5 columns (Lun-Vie); el rango de horas
 * se ajusta a los bloques recibidos (`computeHourRange`). Cuando dos comisiones se superponen en el
 * tiempo (choque), cada una recibe su propio carril horizontal (`layoutWeekBlocks`) para que se vean
 * una al lado de la otra, nunca una tapando a la otra: es el caso central de esta feature.
 *
 * Antes renderizaba `simulation.blocks` de `data/mocks.ts` con horas enteras únicamente; ahora
 * consume directo el `schedule` real de POST /api/me/simulator/evaluate (o el mock de borradores,
 * ya reescrito al mismo shape), con minutos reales y soporte para bloques superpuestos.
 */
const DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];
const ROW_HEIGHT = 24;

const PALETTE: [string, string][] = [
  ['#fbe8e1', '#7a3922'],
  ['#eef0e0', '#475020'],
  ['#e0eef4', '#1e4d6b'],
  ['#eee1f2', '#4a2c5a'],
  ['#f5edd9', '#6b4f1b'],
];

/** Asigna un color estable por código de materia sin necesitar un mapa hardcodeado por código
 * real (los códigos varían por universidad/plan, a diferencia del mock original). */
function paletteFor(code: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    hash = (hash * 31 + code.charCodeAt(i)) | 0;
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export function CalendarWeek({ blocks }: { blocks: readonly CalendarWeekBlock[] }) {
  const positioned = layoutWeekBlocks(blocks);
  const { startHour, hourCount } = computeHourRange(positioned);
  const gridStartMinutes = startHour * 60;
  const bodyHeight = hourCount * ROW_HEIGHT;
  const hourMarks = Array.from({ length: hourCount + 1 }, (_, i) => startHour + i);

  return (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '40px repeat(5, 1fr)' }}>
        <div />
        {DAY_LABELS.map((d) => (
          <div
            key={d}
            style={{
              padding: '6px 8px',
              color: 'var(--ink-3)',
              borderBottom: '1px solid var(--line)',
              textAlign: 'center',
            }}
          >
            {d}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex' }}>
        <div style={{ width: 40, position: 'relative', height: bodyHeight }}>
          {hourMarks.map((h, i) => (
            <div
              key={h}
              style={{
                position: 'absolute',
                top: i * ROW_HEIGHT - 5,
                right: 8,
                color: 'var(--ink-4)',
                fontSize: 9.5,
              }}
            >
              {h}:00
            </div>
          ))}
        </div>
        {DAY_LABELS.map((label, dayIndex) => (
          <DayColumn
            // Label del día (string estable de DAY_LABELS, no el índice): Lun-Vie no se reordena.
            key={label}
            dayIndex={dayIndex}
            hourCount={hourCount}
            isFirst={dayIndex === 0}
            gridStartMinutes={gridStartMinutes}
            blocks={positioned.filter((b) => b.dayIndex === dayIndex)}
          />
        ))}
      </div>
    </div>
  );
}

function DayColumn({
  dayIndex,
  hourCount,
  isFirst,
  gridStartMinutes,
  blocks,
}: {
  dayIndex: number;
  hourCount: number;
  isFirst: boolean;
  gridStartMinutes: number;
  blocks: PositionedWeekBlock[];
}) {
  return (
    <div
      style={{
        flex: 1,
        position: 'relative',
        borderLeft: isFirst ? '1px solid var(--line)' : 'none',
        borderRight: '1px solid var(--line)',
      }}
    >
      {Array.from({ length: hourCount }, (_, i) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: líneas de grilla decorativas, cantidad fija.
          key={i}
          style={{ height: ROW_HEIGHT, borderTop: i ? '1px dashed var(--line)' : 'none' }}
        />
      ))}
      {blocks.map((block) => (
        <BlockPill
          key={`${dayIndex}-${block.subjectCode}-${block.start}`}
          block={block}
          gridStartMinutes={gridStartMinutes}
        />
      ))}
    </div>
  );
}

function BlockPill({
  block,
  gridStartMinutes,
}: {
  block: PositionedWeekBlock;
  gridStartMinutes: number;
}) {
  const top = ((block.startMinutes - gridStartMinutes) / 60) * ROW_HEIGHT;
  const height = Math.max((block.durationMinutes / 60) * ROW_HEIGHT - 4, 16);
  const widthPct = 100 / block.laneCount;
  const leftPct = block.lane * widthPct;
  const [bg, fg] = paletteFor(block.subjectCode);

  return (
    <div
      style={{
        position: 'absolute',
        top: top + 2,
        left: `calc(${leftPct}% + 2px)`,
        width: `calc(${widthPct}% - 4px)`,
        height,
        overflow: 'hidden',
        background: bg,
        color: fg,
        borderRadius: 6,
        padding: '4px 6px',
        fontWeight: 600,
        fontSize: 10,
        outline: block.clashing ? '1.5px solid var(--accent-ink)' : 'none',
        outlineOffset: -1.5,
        zIndex: block.clashing ? 2 : 1,
      }}
    >
      {block.subjectCode}
    </div>
  );
}
