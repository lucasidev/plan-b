import { notFound } from 'next/navigation';
import { CatalogTopbar } from '@/features/browse-catalog';
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
 * /teachers/[id] (US-132, SC-035). La pantalla pública de un docente: quién es y qué cátedras integra,
 * cada una con link a sus conteos.
 *
 * **No publica nada sobre la persona**: lo que se reseña y se publica es la cátedra (ADR-0083), así
 * que esta pantalla es el camino del apellido al sujeto, no un legajo con puntaje. El que busca a
 * alguien por su nombre llega igual, y sale hacia donde están los hechos.
 *
 * 404 cuando el id no existe. Un docente dado de baja (410 de la API) muestra el aviso "ya no
 * figura" en vez de un 404.
 *
 * Lleva el `CatalogTopbar` por el mismo motivo que las fichas de materia y de cátedra: una ficha sin
 * él es una calle sin salida, sin buscador y sin puerta para entrar.
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
    <>
      <CatalogTopbar />
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
        <TeacherHeader teacher={teacher} />
        <TeacherChairs chairs={chairs} />
      </main>
    </>
  );
}

function RemovedNotice() {
  return (
    <>
      <CatalogTopbar />
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
        <section className="rounded-lg border border-line bg-bg-card p-10 text-center">
          <p className="font-display text-lg font-semibold text-ink m-0">
            Este docente ya no figura en el catálogo.
          </p>
          <p className="mt-2 text-sm text-ink-3">
            Lo que se reseñó de sus cátedras se conserva, pero el perfil fue dado de baja.
          </p>
        </section>
      </main>
    </>
  );
}
