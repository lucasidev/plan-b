import Link from 'next/link';
import { AuthShell } from '@/components/layout/auth-shell';
import { ForgotPasswordForm } from '@/features/forgot-password';
import { FlowSteps } from '@/features/forgot-password/components/flow-steps';

// Hoisted para no crear refs nuevas por render (regla react-doctor/jsx-no-jsx-as-prop).
const LEFT_PANEL = <FlowSteps active={1} />;
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
 * `/forgot-password` (US-033-f). Server component que arma el `AuthShell` v2
 * (eyebrow "03 · Recuperar" + `FlowSteps active={1}`) y delega el form a
 * `<ForgotPasswordForm>`. La acción es un POST puro con anti-enumeración; en
 * éxito redirige a `/forgot-password/check-inbox`. Migración al canvas v2 en
 * US-059-f; el comportamiento no cambia.
 */
export default function ForgotPasswordPage() {
  return (
    <AuthShell
      stepCode="03"
      stepName="Recuperar"
      leftPanel={LEFT_PANEL}
      title="Recuperar contraseña"
      sub="Ingresá el email con el que te registraste y te mandamos un link para elegir una nueva. Si la cuenta existe, te llega el mail."
      foot={FOOT}
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
