import Link from 'next/link';
import { AuthShell } from '@/components/layout/auth-shell';
import { FlowSteps } from '@/features/forgot-password/components/flow-steps';

type Props = {
  searchParams: Promise<{ email?: string }>;
};

// Hoisted para no crear refs nuevas por render (regla react-doctor/jsx-no-jsx-as-prop).
const LEFT_PANEL = <FlowSteps active={2} />;
const FOOT = (
  <Link
    href="/sign-in"
    prefetch
    className="text-accent-ink hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft rounded-sm"
    style={{ fontWeight: 500 }}
  >
    ← Volver a ingresar
  </Link>
);

/**
 * Post-forgot-password screen (`/forgot-password/check-inbox`). La server action
 * redirige acá en el 204 silent-success (anti-enumeración de US-033: mismo
 * resultado exista o no la cuenta).
 *
 * Migrada al `AuthShell` v2 (eyebrow "04 · Mail enviado" + `FlowSteps active={2}`)
 * en US-059-f. El copy anti-enumeración se conserva a propósito: no se afirma que
 * el mail salió a una cuenta puntual, solo "si tenés una cuenta con...".
 */
export default async function CheckInboxPage({ searchParams }: Props) {
  const { email } = await searchParams;

  const sub = email
    ? `Si tenés una cuenta con ${email}, te mandamos un link para elegir una contraseña nueva.`
    : 'Si tenés una cuenta con ese email, te mandamos un link para elegir una nueva.';

  return (
    <AuthShell
      stepCode="04"
      stepName="Mail enviado"
      leftPanel={LEFT_PANEL}
      title="Revisá tu casilla"
      sub={sub}
      foot={FOOT}
    >
      <div
        className="text-ink-2"
        style={{
          fontSize: 13,
          lineHeight: 1.6,
          background: 'var(--color-bg-elev)',
          border: '1px solid var(--color-line)',
          borderRadius: 12,
          padding: '14px 16px',
          marginBottom: 18,
        }}
      >
        Si no llega, mirá la carpeta de spam o promociones. El link expira en 30 minutos y se puede
        usar una sola vez.
      </div>
      <p className="text-ink-3" style={{ fontSize: 13 }}>
        ¿Te equivocaste de email?{' '}
        <Link
          href="/forgot-password"
          prefetch
          className="text-accent-ink hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft rounded-sm"
          style={{ fontWeight: 500 }}
        >
          Pedí otro link
        </Link>
      </p>
    </AuthShell>
  );
}
