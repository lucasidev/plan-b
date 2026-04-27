import Link from 'next/link';
import { AuthSplit } from '@/components/layout/auth-split';
import { Button, DisplayHeading, Lede } from '@/components/ui';

type Props = {
  searchParams: Promise<{ email?: string }>;
};

/**
 * Post-registration screen. The sign-up server action redirects here on 201,
 * passing the email via query string so we can echo "te mandamos un mail a
 * X". No backend call from here; the verification email is dispatched by
 * the backend's UserRegistered domain event handler asynchronously.
 *
 * If the URL has no `email` param (someone landed here directly via a
 * bookmark), we render a generic "revisá tu correo" without the address.
 * That's safer than showing a misleading "te mandamos un mail a undefined".
 */
export default async function CheckInboxPage({ searchParams }: Props) {
  const { email } = await searchParams;
  return (
    <AuthSplit
      heading={
        <DisplayHeading>
          Revisá tu <em>casilla</em>
        </DisplayHeading>
      }
      description={
        email
          ? `Te mandamos un mail a ${email} con un link para confirmar tu cuenta.`
          : 'Te mandamos un mail con un link para confirmar tu cuenta.'
      }
    >
      <div className="space-y-6">
        <header className="space-y-2">
          <DisplayHeading as="h2" size={26}>
            Casi listo
          </DisplayHeading>
          <Lede>
            Hacé click en el link del mail para activar tu cuenta. Si no lo encontrás, mirá la
            carpeta de spam o promociones.
          </Lede>
        </header>
        <div className="space-y-3 text-sm text-ink-2">
          <p>Una vez verificada la cuenta podés iniciar sesión.</p>
          <p>
            ¿No te llegó? Esperá un par de minutos. Si sigue sin aparecer, te podés registrar de
            nuevo con el mismo email para recibir otro link.
          </p>
        </div>
        <div className="flex flex-col gap-2 pt-2">
          <Link href="/sign-in" prefetch>
            <Button type="button" variant="primary" className="w-full justify-center">
              Ir a iniciar sesión
            </Button>
          </Link>
          <Link href="/sign-up" prefetch>
            <Button type="button" variant="ghost" className="w-full justify-center">
              Volver a registrarme
            </Button>
          </Link>
        </div>
      </div>
    </AuthSplit>
  );
}
