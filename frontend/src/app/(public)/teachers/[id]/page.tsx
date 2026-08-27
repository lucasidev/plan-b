import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TeacherChairs, TeacherHeader } from '@/features/view-teacher';
import { fetchTeacherChairsServer, fetchTeacherServer } from '@/features/view-teacher/api.server';

// Pública y por request: las cátedras que integra cambian con el backoffice. Sin cuenta se ve igual.
export const dynamic = 'force-dynamic';

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { id } = await params;
  const result = await fetchTeacherServer(id);
  if (result.kind !== 'ok') {
    return { title: 'Docente · planb' };
  }
  return { title: `${result.teacher.firstName} ${result.teacher.lastName} · planb` };
}

/**
 * /teachers/[id] (US-003, US-132). Ficha pública de un docente: quién es y qué cátedras integra,
 * cada una con link a sus conteos.
 *
 * **No publica nada sobre la persona**: lo que se reseña y se publica es la cátedra (ADR-0083), así
 * que esta pantalla es el camino del apellido al sujeto, no un legajo con puntaje. El que busca a
 * alguien por su nombre llega igual, y sale hacia donde están los hechos.
 *
 * 404 cuando el id no existe. Un docente dado de baja (410 de la API) muestra el aviso "ya no
 * figura" en vez de un 404.
 */
export default async function TeacherPage({ params }: { params: Params }) {
  const { id } = await params;

  const result = await fetchTeacherServer(id);
  if (result.kind === 'notfound') {
    notFound();
  }
  if (result.kind === 'removed') {
    return <RemovedNotice />;
  }
  const teacher = result.teacher;
  const chairs = await fetchTeacherChairsServer(id);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
      <BackLink />
      <TeacherHeader teacher={teacher} />
      <TeacherChairs chairs={chairs} />
    </main>
  );
}

function BackLink() {
  return (
    <Link
      href="/"
      className="font-mono text-[11px] text-ink-3 underline-offset-2 hover:text-ink-2 hover:underline"
    >
      ← plan-b
    </Link>
  );
}

function RemovedNotice() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
      <BackLink />
      <section className="rounded-lg border border-line bg-bg-card p-10 text-center">
        <p className="font-display text-lg font-semibold text-ink m-0">
          Este docente ya no figura en el catálogo.
        </p>
        <p className="mt-2 text-sm text-ink-3">
          Lo que se contó de sus cátedras se conserva, pero el perfil fue dado de baja.
        </p>
      </section>
    </main>
  );
}
