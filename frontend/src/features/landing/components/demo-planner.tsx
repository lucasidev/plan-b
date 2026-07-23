// Datos de ejemplo de las facetas (datos demo, no del corpus).
const METRICS = [
  { value: '18h', label: 'semanales' },
  { value: '3.8', label: 'dificultad' },
  { value: '52%', label: 'aprob. esperada' },
] as const;

const COMMISSIONS = [
  { com: 'Com A', prof: 'Iturralde', schedule: 'Lun 14-18', rating: '4.1' },
  { com: 'Com B', prof: 'Vázquez', schedule: 'Mar 18-22', rating: '3.4' },
] as const;

// Días del mini calendario. `id` distingue los dos con label 'M' (martes y miércoles).
const WEEK_DAYS = [
  { id: 'lun', label: 'L' },
  { id: 'mar', label: 'M' },
  { id: 'mie', label: 'M' },
  { id: 'jue', label: 'J' },
  { id: 'vie', label: 'V' },
] as const;

// Alto del label del día: los `top` de los bloques se miden debajo de él.
const WEEK_LABEL_H = 16;

// Bloques sueltos de la semana (`col` = día, `top`/`h` en px dentro de la columna).
// Colores literales por materia (no tokens): mismo criterio que `DemoSim`.
type WeekBlock = { col: number; top: number; h: number; code: string; bg: string; fg: string };

const WEEK_BLOCKS: WeekBlock[] = [
  { col: 0, top: 2, h: 40, code: 'ISW', bg: '#fbe8e1', fg: '#7a3922' },
  { col: 2, top: 26, h: 42, code: 'INT', bg: '#eef0e0', fg: '#475020' },
  { col: 4, top: 2, h: 38, code: 'SEG', bg: '#eee1f2', fg: '#4a2c5a' },
];

// El choque: dos materias en la misma franja del martes, lado a lado, con el borde
// de warning envolviendo al par.
const WEEK_CLASH = {
  col: 1,
  top: 50,
  h: 34,
  items: [
    { code: 'MOV', bg: '#e0eef4', fg: '#1e4d6b' },
    { code: 'MAT', bg: '#fbe8e1', fg: '#7a3922' },
  ],
} as const;

// Un ciclo de 20s, cada slide visible ~5s. Los delays escalonados (0/5/10/15s) hacen
// la rotación; con prefers-reduced-motion queda fija la semana.
//
// Las ventanas NO se superponen: cada cara hace un fade corto (0.2s) contra el fondo
// del panel y recién ahí entra la siguiente. Un crossfade clásico acá encima el texto
// de dos caras a la vez (los slides no tienen fondo opaco propio) y se lee como sopa.
const CAROUSEL_CSS = `
@keyframes demo-planner-cycle {
  0% { opacity: 0; }
  1% { opacity: 1; }
  24% { opacity: 1; }
  25% { opacity: 0; }
  100% { opacity: 0; }
}
.demo-planner-slide {
  position: absolute;
  inset: 0;
  opacity: 0;
  animation: demo-planner-cycle 20s linear infinite;
}
.demo-planner-slide:nth-of-type(2) { animation-delay: 5s; }
.demo-planner-slide:nth-of-type(3) { animation-delay: 10s; }
.demo-planner-slide:nth-of-type(4) { animation-delay: 15s; }
@media (prefers-reduced-motion: reduce) {
  .demo-planner-slide { animation: none; }
  .demo-planner-slide:first-of-type { opacity: 1; }
}
`;

/**
 * Demo embebido de la feature "Planificador" (US-054-f). Carousel CSS puro que rota las
 * cuatro facetas de la herramienta: semana simulada con su choque, métricas de la
 * combinación, correlativas bloqueantes y comparador de comisiones. Visual puro, sin
 * fetch ni JS de cliente: la rotación es un keyframe con delays escalonados.
 */
export function DemoPlanner() {
  return (
    <div className="bg-bg" style={{ borderRadius: 10, padding: '12px 14px' }}>
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: CSS estático de autoría propia, sin input externo. */}
      <style dangerouslySetInnerHTML={{ __html: CAROUSEL_CSS }} />
      <div className="relative" style={{ height: 132 }}>
        <div className="demo-planner-slide">
          <div className="flex items-center" style={{ marginBottom: 8 }}>
            <span
              className="font-mono uppercase text-ink-3"
              style={{ fontSize: 9.5, letterSpacing: '0.08em' }}
            >
              Semana simulada
            </span>
            <span className="flex-1" />
            <span className="text-accent-ink" style={{ fontSize: 10.5 }}>
              ⚠ 1 choque
            </span>
          </div>
          <div className="grid grid-cols-5" style={{ gap: 4, height: 104 }}>
            {WEEK_DAYS.map((day, col) => (
              <div key={day.id} className="bg-bg-card relative" style={{ borderRadius: 5 }}>
                <div
                  className="font-mono text-ink-4 text-center"
                  style={{ fontSize: 8.5, padding: '2px 0' }}
                >
                  {day.label}
                </div>
                {WEEK_BLOCKS.filter((b) => b.col === col).map((b) => (
                  <div
                    key={b.code}
                    className="absolute font-mono font-semibold"
                    style={{
                      left: 3,
                      right: 3,
                      top: WEEK_LABEL_H + b.top,
                      height: b.h,
                      background: b.bg,
                      color: b.fg,
                      borderRadius: 4,
                      fontSize: 8,
                      padding: '2px 3px',
                    }}
                  >
                    {b.code}
                  </div>
                ))}
                {col === WEEK_CLASH.col && (
                  <div
                    className="absolute flex"
                    style={{
                      left: 3,
                      right: 3,
                      top: WEEK_LABEL_H + WEEK_CLASH.top,
                      height: WEEK_CLASH.h,
                      gap: 2,
                      padding: 2,
                      borderRadius: 5,
                      border: '1.5px solid var(--color-accent-ink)',
                    }}
                  >
                    {WEEK_CLASH.items.map((item) => (
                      <div
                        key={item.code}
                        className="font-mono font-semibold"
                        style={{
                          flex: 1,
                          minWidth: 0,
                          background: item.bg,
                          color: item.fg,
                          borderRadius: 3,
                          fontSize: 8,
                          padding: '2px 3px',
                        }}
                      >
                        {item.code}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="demo-planner-slide">
          <SlideHeader>Tu combinación</SlideHeader>
          <div className="grid grid-cols-3" style={{ gap: 6 }}>
            {METRICS.map((metric) => (
              <div
                key={metric.label}
                className="bg-bg-card border border-line"
                style={{ borderRadius: 8, padding: '10px 10px' }}
              >
                <div
                  className="font-mono text-ink"
                  style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1 }}
                >
                  {metric.value}
                </div>
                <div className="text-ink-3" style={{ fontSize: 10, marginTop: 4 }}>
                  {metric.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="demo-planner-slide">
          <SlideHeader>Antes de anotarte</SlideHeader>
          <div
            className="bg-bg-card border border-line"
            style={{ borderRadius: 8, padding: '10px 12px' }}
          >
            <div className="text-ink" style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>
              Esta combinación no se puede cursar
            </div>
            <div className="font-mono text-ink-2" style={{ fontSize: 11 }}>
              ISW401 · Arquitectura de Software
            </div>
            <div className="text-ink-3" style={{ fontSize: 11, marginTop: 2, lineHeight: 1.45 }}>
              Te falta regularizar ISW302 · Ing. de Software II
            </div>
          </div>
        </div>

        <div className="demo-planner-slide">
          <SlideHeader>INT302 · elegí comisión</SlideHeader>
          <div className="flex flex-col" style={{ gap: 6 }}>
            {COMMISSIONS.map((option) => (
              <div
                key={option.com}
                className="bg-bg-card border border-line flex items-center"
                style={{ borderRadius: 8, padding: '8px 12px', gap: 8 }}
              >
                <span className="text-ink" style={{ fontSize: 12, fontWeight: 600 }}>
                  {option.com}
                </span>
                <span className="text-ink-3" style={{ fontSize: 11 }}>
                  {option.prof}
                </span>
                <span className="flex-1" />
                <span className="font-mono text-ink-3" style={{ fontSize: 10.5 }}>
                  {option.schedule}
                </span>
                <span className="font-mono text-ink" style={{ fontSize: 11.5 }}>
                  {option.rating} <span className="text-accent">★</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SlideHeader({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="font-mono uppercase text-ink-3"
      style={{ fontSize: 9.5, letterSpacing: '0.08em', marginBottom: 8 }}
    >
      {children}
    </div>
  );
}
