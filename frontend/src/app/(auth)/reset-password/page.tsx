import Link from 'next/link';
import { AuthShell } from '@/components/layout/auth-shell';
import { Button } from '@/components/ui';
import { FlowSteps } from '@/features/forgot-password/components/flow-steps';
import { ResetPasswordForm } from '@/features/reset-password';

type Props = {
  searchParams: Promise<{ token?: string }>;
};

// Hoisted para no crear refs nuevas por render (regla react-doctor/jsx-no-jsx-as-prop).
const FLOW_START = <FlowSteps active={1} />;
const FLOW_RESET = <FlowSteps active={3} />;
const BACK_TO_SIGNIN = (
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
 * /reset-password?token=... (US-033-f). Server component que lee el token de la
 * URL y lo pasa al form (client). Sin token renderea el estado "link roto" sin el
 * form. Si ya hay sesión, el guard del `(auth)` layout redirige a `/home` antes.
 *
 * Migrado al `AuthShell` v2 (paso final del flujo de recuperación, `FlowSteps
 * active={3}`) en US-059-f; el comportamiento (token, redirect, guard) no cambia.
 */
export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <AuthShell
        stepCode="03"
        stepName="Recuperar"
        leftPanel={FLOW_START}
        title="Falta el link"
        sub="Llegaste sin un link válido. Tiene que venir del mail que te mandamos; pedí uno nuevo en un par de clicks."
        foot={BACK_TO_SIGNIN}
      >
        <Link href="/forgot-password" prefetch>
          <Button type="button" variant="accent" className="w-full justify-center">
            Pedir un link nuevo
          </Button>
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      stepCode="03"
      stepName="Nueva contraseña"
      leftPanel={FLOW_RESET}
      title="Elegí tu nueva contraseña"
      sub="Tiene que tener al menos 12 caracteres. Después de guardar te llevamos al inicio de sesión."
      foot={BACK_TO_SIGNIN}
    >
      <ResetPasswordForm token={token} />
    </AuthShell>
  );
}
