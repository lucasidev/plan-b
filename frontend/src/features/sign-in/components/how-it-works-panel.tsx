import { cn } from '@/lib/utils';

/**
 * Panel izquierdo del sign-in (`AuthShell` leftPanel). Vidriera de marketing: le muestra
 * las tres herramientas a quien llega a ingresar, con demos de las features.
 *
 * Datos de EJEMPLO, no del corpus: esto es marketing (la cara de venta), no la herramienta
 * real. Los códigos, docentes y números son ilustrativos y no salen del backend. Ver
 * `docs/domain/ubiquitous-language.md` > "datos demo". Reemplaza al `LastActivityPanel`
 * viejo, que fingía la actividad de una cuenta que el sign-in todavía no conoce.
 */
export function HowItWorksPanel() {
  return (
    <div className="flex flex-col" style={{ gap: 20, maxWidth: 420 }}>
      <div>
        <h3
          className="text-ink"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: '-0.018em',
            margin: '0 0 6px',
          }}
        >
          Así funciona plan-b.
        </h3>
        <p className="text-ink-2" style={{ fontSize: 13.5, lineHeight: 1.55, margin: 0 }}>
          Un vistazo de lo que vas a poder hacer una vez adentro.
        </p>
      </div>

      <Step n="01" title="Leé quién ya pasó por esa materia">
        <ReviewDemo />
      </Step>
      <Step n="02" title="Armá tu cuatri y evitá los choques">
        <ScheduleDemo />
      </Step>
      <Step n="03" title="Elegí con quién cursás">
        <RankingDemo />
      </Step>
    </div>
  );
}

function Step({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div className="grid" style={{ gridTemplateColumns: '22px 1fr', gap: 12 }}>
      <div
        className="font-mono text-accent-ink"
        style={{ fontSize: 11.5, fontWeight: 600, paddingTop: 1 }}
      >
        {n}
      </div>
      <div style={{ minWidth: 0 }}>
        <div className="text-ink" style={{ fontSize: 13.5, fontWeight: 500, marginBottom: 8 }}>
          {title}
        </div>
        {children}
      </div>
    </div>
  );
}

function ReviewDemo() {
  return (
    <div
      className="bg-bg-card border border-line"
      style={{ borderRadius: 10, padding: '12px 14px' }}
    >
      <div className="flex items-center" style={{ gap: 6, marginBottom: 8 }}>
        <span className="font-mono text-ink-3" style={{ fontSize: 10.5, letterSpacing: '0.02em' }}>
          ISW302 · Brandt
        </span>
        <span className="flex-1" />
        <span className="text-accent" style={{ fontSize: 11, letterSpacing: '1px' }}>
          ★★★★
        </span>
      </div>
      <div className="text-ink" style={{ fontSize: 12.5, fontWeight: 500, marginBottom: 4 }}>
        &ldquo;Pesada pero te enseña de verdad&rdquo;
      </div>
      <p className="text-ink-3" style={{ fontSize: 11.5, lineHeight: 1.5, margin: '0 0 8px' }}>
        El TP integrador es exigente pero salís sabiendo trabajar en equipo.
      </p>
      <div className="flex" style={{ gap: 5, flexWrap: 'wrap' }}>
        <Tag>TP grupal</Tag>
        <Tag>dificultad 4</Tag>
      </div>
    </div>
  );
}

const WEEK = [
  { id: 'lun', label: 'L' },
  { id: 'mar', label: 'M' },
  { id: 'mie', label: 'M' },
  { id: 'jue', label: 'J' },
  { id: 'vie', label: 'V' },
] as const;

// Bloques del mini calendario (datos de ejemplo). `col` = día, `top`/`h` en px dentro de la
// columna. Colores literales por materia (no tokens): mismo criterio que el demo del
// planificador en la landing. `warn` marca el choque.
type Block = {
  col: number;
  top: number;
  h: number;
  code: string;
  bg: string;
  fg: string;
  warn?: boolean;
};

const BLOCKS: Block[] = [
  { col: 0, top: 2, h: 30, code: 'ISW', bg: '#fbe8e1', fg: '#7a3922' },
  { col: 1, top: 2, h: 26, code: 'NOV', bg: '#e0eef4', fg: '#1e4d6b' },
  { col: 1, top: 30, h: 26, code: 'MAT', bg: '#fbe8e1', fg: '#7a3922', warn: true },
  { col: 2, top: 34, h: 30, code: 'INT', bg: '#eef0e0', fg: '#475020' },
  { col: 4, top: 2, h: 30, code: 'SEG', bg: '#eee1f2', fg: '#4a2c5a' },
];

function ScheduleDemo() {
  return (
    <div
      className="bg-bg-card border border-line"
      style={{ borderRadius: 10, padding: '12px 14px' }}
    >
      <div className="flex items-center" style={{ marginBottom: 8 }}>
        <span
          className="font-mono uppercase text-ink-3"
          style={{ fontSize: 9.5, letterSpacing: '0.08em' }}
        >
          Semana tipo
        </span>
        <span className="flex-1" />
        <span className="text-accent-ink" style={{ fontSize: 10.5 }}>
          ⚠ 1 choque
        </span>
      </div>
      <div className="grid grid-cols-5" style={{ gap: 4, height: 90 }}>
        {WEEK.map((day, col) => (
          <div
            key={day.id}
            className="bg-bg relative"
            style={{ borderRadius: 5, overflow: 'hidden' }}
          >
            <div
              className="font-mono text-ink-4 text-center"
              style={{ fontSize: 8.5, padding: '2px 0' }}
            >
              {day.label}
            </div>
            {BLOCKS.filter((b) => b.col === col).map((b) => (
              <div
                key={b.code}
                className="absolute font-mono font-semibold"
                style={{
                  left: 2,
                  right: 2,
                  top: 16 + b.top,
                  height: b.h,
                  background: b.bg,
                  color: b.fg,
                  borderRadius: 3,
                  fontSize: 8,
                  padding: '2px 3px',
                  outline: b.warn ? '1.5px solid var(--color-accent-ink)' : 'none',
                  outlineOffset: -1.5,
                }}
              >
                {b.code}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

const RANKING = [
  { rank: 1, name: 'Castro', subject: 'Móviles', rating: '4.8' },
  { rank: 2, name: 'Castellanos', subject: 'Bases de Datos', rating: '4.6' },
  { rank: 3, name: 'Brandt', subject: 'Ing. de SW', rating: '4.1' },
] as const;

function RankingDemo() {
  return (
    <div
      className="bg-bg-card border border-line"
      style={{ borderRadius: 10, padding: '12px 14px' }}
    >
      <div
        className="font-mono uppercase text-ink-3"
        style={{ fontSize: 9.5, letterSpacing: '0.08em', marginBottom: 10 }}
      >
        Mejores docentes
      </div>
      <div className="flex flex-col" style={{ gap: 9 }}>
        {RANKING.map((t) => (
          <div key={t.name} className="flex items-center" style={{ gap: 10 }}>
            <span className="font-mono text-ink-4" style={{ fontSize: 11 }}>
              {t.rank}
            </span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="text-ink" style={{ fontSize: 12.5, fontWeight: 500 }}>
                {t.name}
              </div>
              <div className="text-ink-3" style={{ fontSize: 10.5 }}>
                {t.subject}
              </div>
            </div>
            <span className="font-mono text-ink" style={{ fontSize: 12 }}>
              {t.rating} <span className="text-accent">★</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span
      className={cn('inline-flex items-center font-mono bg-bg-elev text-ink-2')}
      style={{ fontSize: 10, letterSpacing: '0.02em', padding: '2px 7px', borderRadius: 4 }}
    >
      {children}
    </span>
  );
}
