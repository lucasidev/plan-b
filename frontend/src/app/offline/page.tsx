import { WifiOff } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * Offline fallback. Plain route at /offline. Shown by the service worker
 * when the user navigates while offline (the SW catches the failed fetch
 * and serves this cached page). Mientras no exista un service worker
 * registrado, esta ruta queda como placeholder que la capa de ops puede
 * redirigir desde el proxy ante problemas de red, o que se puede pre-cachear
 * para uso futuro.
 */
export default function OfflinePage() {
  return (
    <main
      className="relative min-h-screen overflow-hidden flex items-center justify-center"
      style={{
        background: 'linear-gradient(160deg,#fbe5d6_0%,#fbf3ec_60%)',
        padding: '48px 24px',
      }}
    >
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 80% 20%, rgb(224 122 77 / 18%) 0, transparent 40%), radial-gradient(circle at 20% 90%, rgb(224 122 77 / 12%) 0, transparent 35%)',
        }}
      />

      <div
        className="relative z-10 flex flex-col items-center text-center bg-bg-card border border-line shadow-card"
        style={{
          width: '100%',
          maxWidth: 480,
          padding: '48px 40px',
          borderRadius: 18,
        }}
      >
        <div
          className="inline-flex items-center justify-center bg-accent-soft text-accent-ink"
          style={{ width: 64, height: 64, borderRadius: 999, marginBottom: 28 }}
          aria-hidden
        >
          <WifiOff size={28} />
        </div>

        <p
          className="text-ink-3"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            margin: 0,
          }}
        >
          Sin conexión
        </p>

        <h1
          className="text-ink"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 28,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            fontWeight: 600,
            margin: '8px 0 0',
          }}
        >
          Estás sin internet
        </h1>

        <p
          className="text-ink-2"
          style={{ fontSize: 15, lineHeight: 1.55, marginTop: 14, maxWidth: '34ch' }}
        >
          No podemos cargar la pantalla porque tu conexión cayó. Probá reconectarte; cuando vuelvas
          retomamos donde dejaste.
        </p>

        <Link
          href="/auth"
          prefetch
          className={cn(
            'inline-flex items-center justify-center w-full',
            'bg-ink text-white border border-ink rounded-pill shadow-card',
            'transition-colors hover:bg-[#1a110a]',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft',
          )}
          style={{ padding: '12px 18px', fontSize: 13.5, fontWeight: 500, marginTop: 32 }}
        >
          Reintentar
        </Link>
      </div>
    </main>
  );
}
