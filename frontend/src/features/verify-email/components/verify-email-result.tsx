import Link from 'next/link';
import { Button, DisplayHeading, Lede } from '@/components/ui';
import type { VerifyEmailOutcome } from '../types';

type Props = {
  result: VerifyEmailOutcome;
};

/**
 * Renders the outcome of /api/identity/verify-email. Server component:
 * the page hands a VerifyEmailOutcome and we map kind → copy + CTA. The
 * resend-verification endpoint doesn't exist yet (US-021 backlog), so
 * the workaround for any error case is to nudge the user back to /sign-up
 * with the same email to receive a fresh link.
 */
export function VerifyEmailResult({ result }: Props) {
  if (result.kind === 'success') {
    return (
      <div className="space-y-6">
        <header className="space-y-2">
          <DisplayHeading as="h2" size={28}>
            ¡Listo!
          </DisplayHeading>
          <Lede>Tu cuenta quedó verificada. Ya podés iniciar sesión.</Lede>
        </header>
        <Link href="/sign-in" prefetch>
          <Button type="button" variant="accent" className="w-full justify-center">
            Iniciar sesión
          </Button>
        </Link>
      </div>
    );
  }

  if (result.kind === 'already_consumed') {
    // Tratamos esto como cuasi-éxito: la cuenta ya está verificada, simplemente el link
    // se reusó. El call-to-action es ir directo a iniciar sesión.
    return (
      <div className="space-y-6">
        <header className="space-y-2">
          <DisplayHeading as="h2" size={28}>
            Tu cuenta ya estaba verificada
          </DisplayHeading>
          <Lede>Este link ya se usó. Andá a iniciar sesión sin vueltas.</Lede>
        </header>
        <Link href="/sign-in" prefetch>
          <Button type="button" variant="accent" className="w-full justify-center">
            Iniciar sesión
          </Button>
        </Link>
      </div>
    );
  }

  const errorCopy = ERROR_COPY[result.kind] ?? FALLBACK_ERROR_COPY;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <DisplayHeading as="h2" size={28}>
          {errorCopy.heading}
        </DisplayHeading>
        <Lede>{errorCopy.body}</Lede>
      </header>
      <div className="flex flex-col gap-2">
        <Link href="/sign-up" prefetch>
          <Button type="button" variant="accent" className="w-full justify-center">
            Registrarme de nuevo
          </Button>
        </Link>
        <Link href="/sign-in" prefetch>
          <Button type="button" variant="ghost" className="w-full justify-center">
            Volver a iniciar sesión
          </Button>
        </Link>
      </div>
    </div>
  );
}

type ErrorKind = Exclude<VerifyEmailOutcome['kind'], 'success' | 'already_consumed'>;

const ERROR_COPY: Record<ErrorKind, { heading: string; body: string }> = {
  missing_token: {
    heading: 'Falta el link de verificación',
    body: 'Llegaste a esta página sin el link del mail. Pegalo entero o registrate de nuevo para recibir uno nuevo.',
  },
  invalid: {
    heading: 'Ese link no es válido',
    body: 'El link no figura en nuestros registros. Si lo copiaste a mano, revisá que esté completo. Si no, registrate de nuevo para recibir uno nuevo.',
  },
  expired: {
    heading: 'Ese link ya expiró',
    body: 'Los links duran 24 horas. Registrate de nuevo con el mismo email y te mandamos uno nuevo.',
  },
  invalidated: {
    heading: 'Hay un link más nuevo',
    body: 'Pediste otra verificación después de este link, así que este quedó invalidado. Buscá el último mail que recibiste.',
  },
  unknown: {
    heading: 'No pudimos verificar tu cuenta',
    body: 'Algo falló de nuestro lado. Probá de nuevo en un rato; si sigue, registrate otra vez para recibir un link nuevo.',
  },
};

const FALLBACK_ERROR_COPY = ERROR_COPY.unknown;
