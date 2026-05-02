import { MailCheck } from 'lucide-react';
import Link from 'next/link';
import { ResendVerificationButton } from '@/features/resend-verification';
import { cn } from '@/lib/utils';

type Props = {
  searchParams: Promise<{ email?: string }>;
};

/**
 * Post-registration screen. The sign-up server action redirects here on 201,
 * passing the email via query string so we can echo "te mandamos un mail a
 * X". No backend call from here; the verification email is dispatched by
 * the backend's UserRegistered domain event handler asynchronously.
 *
 * Centered single-card layout (no AuthSplit). This is a transition screen,
 * not a marketing surface — the user already converted, we're just telling
 * them what to do next. The cream background + sutil radial glow keeps it
 * tonally aligned with /auth without re-using the heavier split layout.
 */
export default async function CheckInboxPage({ searchParams }: Props) {
  const { email } = await searchParams;

  return (
    <main
      className="relative min-h-screen overflow-hidden flex items-center justify-center"
      style={{
        background: 'linear-gradient(160deg,#fbe5d6_0%,#fbf3ec_60%)',
        padding: '48px 24px',
      }}
    >
      {/* Two radial glows for warmth, same recipe as AuthSplit's hero column. */}
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
          style={{
            width: 64,
            height: 64,
            borderRadius: 999,
            marginBottom: 28,
          }}
          aria-hidden
        >
          <MailCheck size={28} />
        </div>

        <h1
          className="text-ink"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 32,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            fontWeight: 600,
            margin: 0,
          }}
        >
          Revisá tu casilla
        </h1>

        <p
          className="text-ink-2"
          style={{ fontSize: 15, lineHeight: 1.55, marginTop: 14, maxWidth: '32ch' }}
        >
          {email ? (
            <>
              Te mandamos un mail a <b className="text-ink">{email}</b> con un link para confirmar
              tu cuenta.
            </>
          ) : (
            <>Te mandamos un mail con un link para confirmar tu cuenta.</>
          )}
        </p>

        <p
          className="text-ink-3"
          style={{ fontSize: 13, lineHeight: 1.55, marginTop: 18, maxWidth: '36ch' }}
        >
          Si no lo encontrás, mirá la carpeta de spam o promociones. El link expira en 24 horas.
        </p>

        <Link
          href="/auth"
          prefetch
          className={cn(
            'inline-flex items-center justify-center w-full',
            'bg-accent text-white border border-accent rounded-pill shadow-card',
            'transition-colors hover:bg-accent-hover',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft',
          )}
          style={{ padding: '12px 18px', fontSize: 13.5, fontWeight: 500, marginTop: 32 }}
        >
          Ir a iniciar sesión
        </Link>

        {email && (
          <div className="w-full" style={{ marginTop: 14 }}>
            <ResendVerificationButton email={email} variant="primary" />
          </div>
        )}

        <p className="text-ink-3" style={{ fontSize: 13, marginTop: 18 }}>
          ¿Te equivocaste de email?{' '}
          <Link
            href="/auth?mode=signup"
            prefetch
            className="text-accent-ink hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft rounded-sm"
            style={{ fontWeight: 500 }}
          >
            Volver a registrarme
          </Link>
        </p>
      </div>
    </main>
  );
}
