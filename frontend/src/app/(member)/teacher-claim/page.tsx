import { TeacherClaimPanel } from '@/features/teacher-claim';
import { fetchMyTeacherClaimsServer } from '@/features/teacher-claim/api.server';

// Lee el estado vivo de los claims del user (pendiente / verificado), por request.
export const dynamic = 'force-dynamic';

export const metadata = { title: 'Soy docente · planb' };

/**
 * /teacher-claim (US-030). Donde un member reclama identidad sobre un docente del catálogo. Es el
 * destino al que el layout (teacher) manda a los members todavía no verificados: desde acá reclaman
 * y, una vez verificados (US-031), desbloquean responder reseñas.
 */
export default async function TeacherClaimPage() {
  const claims = await fetchMyTeacherClaimsServer();

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="flex flex-col gap-1.5">
        <h1 className="m-0 font-display text-2xl font-semibold text-ink">¿Sos docente?</h1>
        <p className="m-0 text-sm text-ink-3">
          Reclamá tu identidad sobre un docente del catálogo. Después vas a poder verificarte por
          email institucional y responder las reseñas sobre tus materias.
        </p>
      </header>
      <TeacherClaimPanel claims={claims} />
    </main>
  );
}
