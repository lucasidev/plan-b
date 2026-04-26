'use client';

import { useMutation } from '@tanstack/react-query';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { VerifyEmailError, type VerifyEmailErrorCode, verifyEmail } from '../api';

const ERROR_COPY: Record<VerifyEmailErrorCode, { title: string; detail: string }> = {
  'identity.verification.invalid': {
    title: 'Link de verificación inválido',
    detail: 'El link no corresponde a ningún registro pendiente. Probablemente venga incompleto.',
  },
  'identity.verification.expired': {
    title: 'El link expiró',
    detail: 'Los links son válidos por 24hs. Pedinos uno nuevo y revisá tu correo.',
  },
  'identity.verification.already_consumed': {
    title: 'Este link ya se usó',
    detail: 'Si tu cuenta quedó verificada, podés iniciar sesión. Si no, pedinos un link nuevo.',
  },
  'identity.verification.invalidated': {
    title: 'El link fue reemplazado',
    detail: 'Pediste un link más nuevo después de este. Revisá el último mail que recibiste.',
  },
  'identity.verification.token_required': {
    title: 'Link de verificación inválido',
    detail: 'El link no contiene un token válido.',
  },
  unknown: {
    title: 'No pudimos verificar tu cuenta',
    detail: 'Hubo un problema inesperado. Probá de nuevo en unos minutos.',
  },
};

/**
 * Auto-fires the verify-email mutation on mount. Lives in a client component on purpose:
 * if we did this server-side, email previewers (Outlook Safe Links, Gmail prefetch) would
 * silently consume the token before the user even clicks. Bots don't run JS, so the
 * mutation only fires for a real visitor.
 */
export function VerifyEmailFlow({ token }: { token: string }) {
  const mutation = useMutation({
    mutationFn: () => verifyEmail(token),
    retry: false,
  });

  // useRef guard so React 19's strict-mode double-render doesn't fire twice in dev.
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    mutation.mutate();
  }, [mutation.mutate]);

  if (mutation.isIdle || mutation.isPending) {
    return (
      <Card>
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" aria-hidden />
        <h1 className="font-bold text-2xl">Verificando tu correo</h1>
        <p className="text-muted-foreground">Esto suele tardar un par de segundos.</p>
      </Card>
    );
  }

  if (mutation.isSuccess) {
    return (
      <Card>
        <CheckCircle2 className="h-10 w-10 text-green-600" aria-hidden />
        <h1 className="font-bold text-2xl">Cuenta verificada</h1>
        <p className="text-muted-foreground">
          Tu correo quedó confirmado. Ya podés iniciar sesión y armar tu cuatrimestre.
        </p>
        <PrimaryLink href="/sign-in">Iniciar sesión</PrimaryLink>
      </Card>
    );
  }

  const code: VerifyEmailErrorCode =
    mutation.error instanceof VerifyEmailError ? mutation.error.code : 'unknown';
  const copy = ERROR_COPY[code];

  return (
    <Card>
      <XCircle className="h-10 w-10 text-destructive" aria-hidden />
      <h1 className="font-bold text-2xl">{copy.title}</h1>
      <p className="text-muted-foreground">{copy.detail}</p>
      <PrimaryLink href="/sign-up">Reenviar verificación</PrimaryLink>
    </Card>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-lg border bg-card p-8 text-center shadow-sm">
      {children}
    </div>
  );
}

function PrimaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="mt-2 inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 font-medium text-primary-foreground text-sm transition-colors hover:bg-primary/90"
    >
      {children}
    </Link>
  );
}
