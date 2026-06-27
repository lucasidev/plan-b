'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { verifyTeacherClaim } from '../actions';
import type { VerifyResult } from '../types';

type State = VerifyResult | { status: 'pending' };

/**
 * Consume el token del link de mail (US-031 paso 2) y muestra el estado. Corre al montar: la página
 * /verify-teacher vive bajo (member), así que el user ya está autenticado cuando llega acá (si no, el
 * guard del layout lo manda a sign-in antes de renderizar).
 */
export function TeacherVerifier({ token }: { token: string }) {
  const [state, setState] = useState<State>({ status: 'pending' });

  useEffect(() => {
    let active = true;
    verifyTeacherClaim(token).then((result) => {
      if (active) setState(result);
    });
    return () => {
      active = false;
    };
  }, [token]);

  if (state.status === 'pending') {
    return <Card title="Verificando tu cuenta..." body="Dame un segundo." />;
  }

  if (state.status === 'success') {
    return (
      <Card
        title="¡Listo! Ya sos docente verificado"
        body="Ahora podés responder las reseñas sobre tus materias."
      >
        <Link href="/teacher-claim">
          <Button size="sm">Ir a mis reclamos</Button>
        </Link>
      </Card>
    );
  }

  if (state.status === 'unauthenticated') {
    return (
      <Card
        title="Iniciá sesión para verificarte"
        body="Tenés que estar logueado con la cuenta que reclamó el docente."
      >
        <Link href="/sign-in">
          <Button size="sm">Iniciar sesión</Button>
        </Link>
      </Card>
    );
  }

  return (
    <Card title="No pudimos verificarte" body={state.message}>
      <Link href="/teacher-claim">
        <Button variant="secondary" size="sm">
          Volver a mis reclamos
        </Button>
      </Link>
    </Card>
  );
}

function Card({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="flex flex-col items-center gap-3 rounded-lg border border-line bg-bg-card p-8 text-center">
      <h1 className="m-0 font-display text-lg font-semibold text-ink">{title}</h1>
      <p className="m-0 text-sm text-ink-3">{body}</p>
      {children}
    </section>
  );
}
