import { Logo } from '@/components/ui';
import { cn } from '@/lib/utils';

type SubjectRow = {
  code: string;
  name: string;
  difficulty: number;
  commission: string;
};

// Data hardcodeada del mock (US-054-f): DemoSim es un visual estático, sin fetch.
const SUBJECTS: SubjectRow[] = [
  { code: 'ISW302', name: 'Ing. de Software II', difficulty: 4, commission: 'A' },
  { code: 'MOV302', name: 'Aplicaciones Móviles', difficulty: 3, commission: 'A' },
  { code: 'INT302', name: 'Inteligencia Artificial I', difficulty: 5, commission: 'A' },
  { code: 'SEG302', name: 'Seguridad Informática', difficulty: 3, commission: 'B' },
];

type ScheduleBlock = {
  day: number;
  start: number;
  span: number;
  code: string;
  bg: string;
  fg: string;
  warn?: boolean;
};

// Bloques de calendario simplificados. Colores literales del mock (no tokens):
// codifican cada materia, no un estado del design system.
const SCHEDULE_BLOCKS: ScheduleBlock[] = [
  { day: 0, start: 0, span: 3, code: 'INT302', bg: '#eef0e0', fg: '#475020' },
  { day: 0, start: 5, span: 2, code: 'ISW302', bg: '#fbe8e1', fg: '#7a3922', warn: true },
  { day: 1, start: 5, span: 2, code: 'MOV302', bg: '#e0eef4', fg: '#1e4d6b' },
  { day: 2, start: 5, span: 2, code: 'ISW302', bg: '#fbe8e1', fg: '#7a3922' },
  { day: 3, start: 5, span: 2, code: 'SEG302', bg: '#eee1f2', fg: '#4a2c5a' },
  { day: 4, start: 0, span: 3, code: 'INT302', bg: '#eef0e0', fg: '#475020' },
  { day: 4, start: 5, span: 2, code: 'MOV302', bg: '#e0eef4', fg: '#1e4d6b', warn: true },
];

const WEEK_DAYS = [
  { id: 'mon', label: 'L' },
  { id: 'tue', label: 'M' },
  { id: 'wed', label: 'M' },
  { id: 'thu', label: 'J' },
  { id: 'fri', label: 'V' },
] as const;

const STATS = [
  { label: 'choque', value: '1', tone: 'accent' },
  { label: 'semanales', value: '18h', tone: 'ink' },
  { label: 'aprob. esp.', value: '52%', tone: 'ink' },
] as const;

type DifficultyTone = 'hi' | 'mid' | 'lo';

function difficultyTone(value: number): DifficultyTone {
  if (value >= 4) return 'hi';
  if (value === 3) return 'mid';
  return 'lo';
}

// El mock distingue 3 clases (`diff-hi/mid/lo`) sin CSS asociado en el canvas:
// portadas acá a tokens existentes, graduando el peso visual según severidad.
const DIFFICULTY_CLASSES: Record<DifficultyTone, string> = {
  hi: 'bg-accent-soft text-accent-ink',
  mid: 'bg-bg-elev text-ink-2',
  lo: 'bg-line-2 text-ink-3',
};

/**
 * Mock visual del planificador embebido en el hero de la landing (US-054-f). Port
 * de `MiniSim` (docs/design/reference/canvas-mocks/landing.jsx, líneas 17-168):
 * selección de materias + stats + mini calendario semanal, todo hardcodeado.
 *
 * No es interactivo (sin drag, sin combinar comisiones): esa versión queda para
 * una US futura del planificador público. `.mp`/`.dot`/`.diff-hi/mid/lo` del mock
 * no existen como clases reales, portadas acá inline con `MpPill`.
 */
export function DemoSim() {
  return (
    <div
      className="bg-bg-card border border-line overflow-hidden"
      style={{
        borderRadius: 18,
        boxShadow: '0 1px 2px rgba(120,40,10,0.06), 0 24px 60px -20px rgba(120,40,10,0.18)',
      }}
    >
      {/* topbar emulada */}
      <div
        className="flex items-center bg-bg border-b border-line"
        style={{ padding: '14px 18px', gap: 12 }}
      >
        <Logo size={16} />
        <span
          className="flex items-center bg-bg-card text-ink-2 shadow-card"
          style={{ borderRadius: 999, padding: '4px 10px', fontSize: 11, gap: 7 }}
        >
          <span className="inline-block rounded-full bg-accent" style={{ width: 5, height: 5 }} />
          2026·1c · borrador
        </span>
        <span className="flex-1" />
        <span className="font-mono text-ink-3" style={{ fontSize: 10.5 }}>
          preview en vivo →
        </span>
      </div>

      {/* contenido */}
      <div className="grid" style={{ gridTemplateColumns: '250px 1fr', gap: 14, padding: 14 }}>
        {/* selección */}
        <div
          className="bg-bg-card border border-line"
          style={{ borderRadius: 12, padding: '12px 14px' }}
        >
          <div
            className="flex justify-between"
            style={{ fontSize: 12, fontWeight: 600, marginBottom: 10 }}
          >
            Selección
            <small className="text-ink-3" style={{ fontWeight: 400 }}>
              4 / 6
            </small>
          </div>
          {SUBJECTS.map((subject) => (
            <div key={subject.code} className="border-b border-line" style={{ padding: '8px 0' }}>
              <div
                className="font-mono text-ink-3"
                style={{ fontSize: 10, letterSpacing: '0.04em' }}
              >
                {subject.code}
              </div>
              <div style={{ fontSize: 12, marginBottom: 5 }}>{subject.name}</div>
              <div className="flex flex-wrap" style={{ gap: 4 }}>
                <MpPill className="bg-line-2 text-ink-2">Com {subject.commission}</MpPill>
                <MpPill className={DIFFICULTY_CLASSES[difficultyTone(subject.difficulty)]}>
                  <Dot />
                  dif {subject.difficulty}
                </MpPill>
              </div>
            </div>
          ))}
        </div>

        {/* lado derecho: stats + calendario */}
        <div className="flex flex-col" style={{ gap: 10 }}>
          <div className="grid grid-cols-3" style={{ gap: 8 }}>
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="bg-bg-card border border-line"
                style={{ borderRadius: 10, padding: '10px 12px' }}
              >
                <div
                  className={cn(
                    'font-mono',
                    stat.tone === 'accent' ? 'text-accent-ink' : 'text-ink',
                  )}
                  style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1 }}
                >
                  {stat.value}
                </div>
                <div className="text-ink-3" style={{ fontSize: 10.5, marginTop: 4 }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* mini calendario */}
          <div
            className="bg-bg-card border border-line"
            style={{ borderRadius: 10, padding: '10px 12px' }}
          >
            <div
              className="flex justify-between text-ink-3"
              style={{ fontSize: 11.5, marginBottom: 6 }}
            >
              <span>Distribución semanal</span>
              <span className="text-accent-ink">⚠ 1 choque</span>
            </div>
            <div className="grid grid-cols-5" style={{ gap: 4, height: 150, position: 'relative' }}>
              {WEEK_DAYS.map((day, dayIndex) => (
                <div
                  key={day.id}
                  className="bg-bg flex flex-col relative"
                  style={{ borderRadius: 6 }}
                >
                  <div
                    className="font-mono text-ink-3 text-center"
                    style={{ fontSize: 9.5, padding: '3px 0' }}
                  >
                    {day.label}
                  </div>
                  {SCHEDULE_BLOCKS.flatMap((block) =>
                    block.day === dayIndex
                      ? [
                          <div
                            key={block.code}
                            className="absolute font-mono font-semibold"
                            style={{
                              left: 2,
                              right: 2,
                              top: 16 + block.start * 18,
                              height: block.span * 18 - 2,
                              background: block.bg,
                              color: block.fg,
                              borderRadius: 4,
                              fontSize: 8.5,
                              padding: '3px 4px',
                              outline: block.warn ? '1.5px solid var(--color-accent-ink)' : 'none',
                              outlineOffset: -1.5,
                            }}
                          >
                            {block.code}
                          </div>,
                        ]
                      : [],
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Port de `.mp` (mono pill): no existe como clase real, ver notas del feature.
function MpPill({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn('inline-flex items-center font-mono', className)}
      style={{ gap: 4, fontSize: 10, letterSpacing: '0.02em', padding: '2px 6px', borderRadius: 4 }}
    >
      {children}
    </span>
  );
}

// Port de `.dot`: toma el color del pill que lo contiene vía currentColor.
function Dot() {
  return <span className="inline-block rounded-full bg-current" style={{ width: 4, height: 4 }} />;
}
