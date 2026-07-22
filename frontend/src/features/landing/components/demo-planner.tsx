// Datos de ejemplo de las tres facetas (datos demo, no del corpus).
const METRICS = [
  { value: '18h', label: 'semanales' },
  { value: '3.8', label: 'dificultad' },
  { value: '52%', label: 'aprob. esperada' },
] as const;

const COMMISSIONS = [
  { com: 'Com A', prof: 'Iturralde', schedule: 'Lun 14-18', rating: '4.1' },
  { com: 'Com B', prof: 'Vázquez', schedule: 'Mar 18-22', rating: '3.4' },
] as const;

// Un ciclo de 15s, cada slide visible ~5s con crossfade. Los delays escalonados
// (0/5/10s) hacen la rotación; con prefers-reduced-motion queda fijo el primero.
const CAROUSEL_CSS = `
@keyframes demo-planner-cycle {
  0% { opacity: 0; }
  3% { opacity: 1; }
  31% { opacity: 1; }
  36% { opacity: 0; }
  100% { opacity: 0; }
}
.demo-planner-slide {
  position: absolute;
  inset: 0;
  opacity: 0;
  animation: demo-planner-cycle 15s linear infinite;
}
.demo-planner-slide:nth-of-type(2) { animation-delay: 5s; }
.demo-planner-slide:nth-of-type(3) { animation-delay: 10s; }
@media (prefers-reduced-motion: reduce) {
  .demo-planner-slide { animation: none; }
  .demo-planner-slide:first-of-type { opacity: 1; }
}
`;

/**
 * Demo embebido de la feature "Planificador" (US-054-f). Carousel CSS puro que rota las
 * tres facetas de la herramienta: métricas de la combinación, correlativas bloqueantes y
 * comparador de comisiones. Visual puro, sin fetch ni JS de cliente: la rotación es un
 * keyframe con delays escalonados.
 *
 * La semana con choques no está acá a propósito: esa cara ya la muestra el `DemoSim` del
 * hero; el card rota lo que el hero no muestra.
 */
export function DemoPlanner() {
  return (
    <div className="bg-bg" style={{ borderRadius: 10, padding: '12px 14px' }}>
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: CSS estático de autoría propia, sin input externo. */}
      <style dangerouslySetInnerHTML={{ __html: CAROUSEL_CSS }} />
      <div className="relative" style={{ height: 132 }}>
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
