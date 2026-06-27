import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { TeacherVerifier } from '@/features/teacher-claim/components/teacher-verifier';

// Consume el token del query string contra /api/me (autenticado), por request.
export const dynamic = 'force-dynamic';

export const metadata = { title: 'Verificar docente · planb' };

/**
 * /verify-teacher?token=... (US-031). Destino del link del mail de verificación docente. Vive bajo
 * (member): el user tiene que estar logueado con la cuenta que reclamó. Sin token, muestra un aviso.
 */
export default async function VerifyTeacherPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 px-4 py-12 sm:px-6">
      {token ? (
        <TeacherVerifier token={token} />
      ) : (
        <section className="flex flex-col items-center gap-3 rounded-lg border border-line bg-bg-card p-8 text-center">
          <h1 className="m-0 font-display text-lg font-semibold text-ink">Link incompleto</h1>
          <p className="m-0 text-sm text-ink-3">
            Este link no trae el token de verificación. Abrí el link tal cual te llegó al mail.
          </p>
          <Link href="/teacher-claim">
            <Button variant="secondary" size="sm">
              Ir a mis reclamos
            </Button>
          </Link>
        </section>
      )}
    </main>
  );
}
