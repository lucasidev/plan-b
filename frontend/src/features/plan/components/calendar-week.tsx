import type { CalendarBlock } from '../types';

/**
 * Mock weekly calendar with subject blocks. 5 days (Mon-Fri) x 9 hours (13:00-21:00).
 * Mirrors `v2-screens.jsx::V2MiniCalendar`. Visual derived from the v2 canvas.
 *
 * When US-016 (backend simulation) lands, the blocks come from the API; this
 * component stays the same visually.
 */
const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];
const START_HOUR = 13;
const HOURS = Array.from({ length: 9 }, (_, i) => START_HOUR + i);

const PALETTE: Record<string, [string, string]> = {
  ISW302: ['#fbe8e1', '#7a3922'],
  INT302: ['#eef0e0', '#475020'],
  MOV302: ['#e0eef4', '#1e4d6b'],
  SEG302: ['#eee1f2', '#4a2c5a'],
  MAT401: ['#f5edd9', '#6b4f1b'],
  ISW401: ['#fbe8e1', '#7a3922'],
  ARQ301: ['#e0eef4', '#1e4d6b'],
  ALG402: ['#f5edd9', '#6b4f1b'],
  PRO402: ['#eef0e0', '#475020'],
  BD402: ['#eee1f2', '#4a2c5a'],
};

export function CalendarWeek({ blocks }: { blocks: CalendarBlock[] }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '40px repeat(5, 1fr)',
        gap: 0,
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
      }}
    >
      <div />
      {DAYS.map((d) => (
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
      {HOURS.map((h, hi) => (
        <Row key={h} h={h} hi={hi} blocks={blocks} />
      ))}
    </div>
  );
}

function Row({ h, hi, blocks }: { h: number; hi: number; blocks: CalendarBlock[] }) {
  return (
    <>
      <div
        style={{
          padding: '4px 8px',
          color: 'var(--ink-4)',
          textAlign: 'right',
          fontSize: 9.5,
          borderTop: hi ? '1px dashed var(--line)' : 'none',
        }}
      >
        {h}:00
      </div>
      {DAYS.map((day, di) => {
        const blk = blocks.find((b) => b.day === di && b.h === h);
        return (
          <div
            // Day (stable string from the DAYS array) + the row hour make a unique
            // stable key per cell. Avoids react-doctor/no-array-index-key without
            // synthesizing IDs.
            key={`${day}-${h}`}
            style={{
              position: 'relative',
              minHeight: 24,
              borderTop: hi ? '1px dashed var(--line)' : 'none',
              borderLeft: di === 0 ? '1px solid var(--line)' : 'none',
              borderRight: '1px solid var(--line)',
            }}
          >
            {blk && (
              <div
                style={{
                  position: 'absolute',
                  inset: '2px',
                  height: blk.dur * 24 - 4,
                  background: (PALETTE[blk.code] ?? ['#eee', '#444'])[0],
                  color: (PALETTE[blk.code] ?? ['#eee', '#444'])[1],
                  borderRadius: 6,
                  padding: '4px 6px',
                  fontWeight: 600,
                  fontSize: 10,
                  outline: blk.warn ? '1.5px solid var(--accent-ink)' : 'none',
                  outlineOffset: -1.5,
                  zIndex: blk.warn ? 2 : 1,
                }}
              >
                {blk.code}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
