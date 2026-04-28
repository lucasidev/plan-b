import { Loader2 } from 'lucide-react';

/**
 * Root-level loading boundary. Next.js renders this while the active
 * route segment streams in. A spinner is the right shape for the auth
 * surfaces (login, sign-up, verify, check-inbox) — they're all small
 * server components and rarely show this for more than a frame.
 *
 * Heavier surfaces (simulator, plan grid, review lists in F3+) should
 * ship their own `loading.tsx` with a skeleton that matches their
 * layout. This root file is the safety net.
 */
export default function Loading() {
  return (
    <main
      className="relative min-h-screen overflow-hidden flex items-center justify-center"
      style={{ background: 'linear-gradient(160deg,#fbe5d6_0%,#fbf3ec_60%)' }}
      aria-busy="true"
      aria-live="polite"
    >
      <Loader2 className="text-accent-ink animate-spin" size={32} aria-label="Cargando" />
    </main>
  );
}
