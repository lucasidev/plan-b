import Link from 'next/link';
import { AuthSplit } from '@/components/layout/auth-split';
import { Button, DisplayHeading, Lede } from '@/components/ui';
import { ResetPasswordForm } from '@/features/reset-password';

type Props = {
  searchParams: Promise<{ token?: string }>;
};

/**
 * /reset-password?token=... (US-033-f). Server component that reads the
 * raw token from the URL and hands it to the (client) form. If the token
 * is missing we render a "this link is broken" landing without even
 * rendering the form: the action would 400 anyway, but the visual cue
 * is clearer than letting a blank form fail silently.
 *
 * If the user is already signed in, the (auth) layout guard redirects to
 * /home before this page renders. That covers the edge case of an
 * attacker holding Lucía's link while she's logged in elsewhere: the
 * attacker can't see the form, and the backend's RevokeAllForUserAsync
 * cuts any stale session in case the guard ever misfires.
 */
export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <AuthSplit
        heading={
          <DisplayHeading>
            Falta el <em>link</em>
          </DisplayHeading>
        }
        description="Llegaste a esta página sin un link válido. Pedí uno nuevo desde la pantalla de recuperación."
      >
        <div className="space-y-6">
          <header className="space-y-2">
            <DisplayHeading as="h2" size={28}>
              Pedí un link nuevo
            </DisplayHeading>
            <Lede>
              El link tiene que venir del mail que te mandamos. Si lo perdiste, podés generar uno
              nuevo en un par de clicks.
            </Lede>
          </header>
          <div className="flex flex-col gap-2">
            <Link href="/forgot-password" prefetch>
              <Button type="button" variant="accent" className="w-full justify-center">
                Pedir un link nuevo
              </Button>
            </Link>
            <Link href="/auth" prefetch>
              <Button type="button" variant="ghost" className="w-full justify-center">
                Volver a iniciar sesión
              </Button>
            </Link>
          </div>
        </div>
      </AuthSplit>
    );
  }

  return (
    <AuthSplit
      heading={
        <DisplayHeading>
          Elegí tu <em>nueva contraseña</em>
        </DisplayHeading>
      }
      description="Tiene que tener al menos 12 caracteres. Después de guardar te llevamos al inicio de sesión."
    >
      <ResetPasswordForm token={token} />
    </AuthSplit>
  );
}
