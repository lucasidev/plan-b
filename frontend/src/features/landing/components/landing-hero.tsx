import Link from 'next/link';
import { GlobalSearch } from '@/features/global-search';
import { cn } from '@/lib/utils';

/**
 * Hero de la entrada (US-221, bloque 1 de SC-004): qué es plan-b en palabras de lector, y los dos
 * caminos para llegar a una ficha.
 *
 * El copy no usa vocabulario de producto ni de tesis, que es un requisito de la story y no una
 * preferencia de tono: quien llega no sabe qué es un instrumento, una cátedra publicando ni un piso
 * de publicación. Sabe que en su grupo de WhatsApp alguien dijo que no dieron las clases.
 *
 * Los dos caminos a una ficha son explorar y buscar (bloque 2 de SC-004). El buscador es el mismo
 * que el del producto adentro: pega al endpoint público de catálogo y lleva a materias, cátedras y
 * docentes. Que sea el mismo importa: si la entrada tuviera un buscador propio, el que llega
 * probaría uno y después usaría otro distinto.
 *
 * Los dos CTA son de **lectura** y no de registro. Pedirle cuenta a alguien que todavía no entendió
 * qué es esto invierte el orden: primero se ve el dato, y recién si cursaste tiene sentido reseñar
 * lo tuyo (US-168).
 *
 * El "diez" del título es el piso de publicación real (ADR-0083), no una cifra retórica. Cualquier
 * otro número quedaría contradicho un scroll más abajo, donde las preguntas explican por qué una
 * cátedra con nueve reseñas todavía no publica.
 */
export function LandingHero() {
  return (
    <section style={{ padding: '72px 48px 40px', maxWidth: 920, margin: '0 auto' }}>
      <div
        className="font-mono uppercase text-accent-ink"
        style={{ fontSize: 11, letterSpacing: '0.08em', marginBottom: 16 }}
      >
        01 · qué es esto
      </div>
      <h1
        style={{
          margin: 0,
          fontSize: 52,
          fontWeight: 600,
          letterSpacing: '-0.025em',
          lineHeight: 1.05,
        }}
      >
        Uno diciéndolo es
        <br />
        una anécdota.
        <br />
        <span className="text-accent-ink">Diez, un hecho.</span>
      </h1>
      <p
        className="text-ink-2"
        style={{ marginTop: 22, fontSize: 16.5, maxWidth: '58ch', lineHeight: 1.6 }}
      >
        Lo que sabés de una materia porque la cursaste hoy vive suelto en grupos y en pasillos, y se
        pierde con cada camada. Acá se junta: cuántos dicen lo mismo, de qué años, y cuántos son.
        Nunca un puntaje ni un ranking, porque un puntaje se discute y un conteo no.
      </p>

      <div className="flex flex-wrap" style={{ gap: 12, marginTop: 30 }}>
        <Link
          href="/universities"
          prefetch
          className={cn(
            'inline-flex items-center justify-center font-medium rounded-pill shadow-card transition-colors',
            'bg-accent text-white border border-accent hover:bg-accent-hover',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft',
          )}
          style={{ padding: '11px 22px', fontSize: 14 }}
        >
          Explorar carreras y materias
        </Link>
        <a
          href="#sample"
          className={cn(
            'inline-flex items-center justify-center font-medium rounded-pill transition-colors',
            'bg-transparent text-ink-2 border border-line hover:bg-line-2 hover:text-ink',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft',
          )}
          style={{ padding: '11px 22px', fontSize: 14 }}
        >
          Ver una ficha de verdad →
        </a>
      </div>

      <div style={{ marginTop: 28 }}>
        <p className="text-ink-2" style={{ margin: '0 0 8px', fontSize: 13.5 }}>
          O bien, si ya sabés qué buscar:
        </p>
        <GlobalSearch />
      </div>

      <p
        className="font-mono text-ink-3"
        style={{ marginTop: 26, fontSize: 11.5, letterSpacing: '0.04em' }}
      >
        Leer no pide cuenta. Ni acá, ni en ninguna ficha.
      </p>
    </section>
  );
}
