import { signOutAction } from '@/features/sign-out';
import { getSession } from '@/lib/session';

/**
 * Placeholder dashboard. Real /dashboard lands in F3 (member home).
 * For now this page exists so:
 *   1. The sign-in action's redirect to /dashboard doesn't 404.
 *   2. There's a place to put a sign-out button while the rest of the
 *      member area is being built (otherwise dev has to clear cookies
 *      manually between tests).
 *
 * The (member) layout already gates this on getSession() returning a
 * member-role session, so reaching here implies a valid login.
 */
export default async function DashboardPage() {
  const session = await getSession();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-bg p-12">
      <div className="w-full max-w-md flex flex-col gap-6">
        <div className="space-y-2">
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--color-ink-3)',
            }}
          >
            Dashboard placeholder
          </p>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 32,
              letterSpacing: '-0.02em',
              fontWeight: 600,
              margin: 0,
            }}
          >
            Sesión activa
          </h1>
          <p style={{ fontSize: 14, color: 'var(--color-ink-2)' }}>
            Estás logueado como <b>{session?.email}</b>. La home real del alumno (mi cuatrimestre,
            simulador, reseñas) llega en F3. Por ahora este es solo el destino del redirect del
            sign-in.
          </p>
        </div>

        <form action={signOutAction}>
          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 bg-ink text-white border border-ink rounded-pill shadow-card transition-colors hover:bg-[#1a110a] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft"
            style={{ padding: '12px 18px', fontSize: 13.5, fontWeight: 500 }}
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </main>
  );
}
