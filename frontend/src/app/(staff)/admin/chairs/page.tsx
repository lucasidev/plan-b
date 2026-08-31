import { fetchAdminChairsServer } from '@/features/manage-chairs/api.server';
import { ChairList } from '@/features/manage-chairs/components/chair-list';
import { CreateChairForm } from '@/features/manage-chairs/components/create-chair-form';
import { SubjectPicker } from '@/features/manage-chairs/components/subject-picker';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Cátedras · planb' };

type Props = {
  searchParams: Promise<{ subjectId?: string }>;
};

/**
 * Cátedras (SC-027, US-196). Backoffice: se cargan las cátedras de una materia y su equipo docente.
 *
 * **Se entra por materia y con el buscador**, no por la cascada de universidad y término que usa
 * comisiones: la cátedra es de una materia y persiste entre períodos, así que colgarla de un
 * período modelaría mal lo que se está cargando.
 *
 * El guard de `(staff)/layout.tsx` ya filtró sesión y rol admin; esta página asume los dos.
 */
export default async function AdminChairsPage({ searchParams }: Props) {
  const { subjectId } = await searchParams;
  const chairs = subjectId ? await fetchAdminChairsServer(subjectId) : [];

  return (
    <div className="mx-auto w-full max-w-[720px] px-4 py-8">
      <div className="mb-5">
        <h1 className="mb-1 font-serif text-[24px] font-semibold text-ink">Cátedras</h1>
        <p className="text-[13px] leading-relaxed text-ink-2">
          El equipo docente a cargo de una materia, con su titular. Persiste entre períodos, a
          diferencia de la comisión, que es la oferta de un cuatrimestre y muere con él.
        </p>
      </div>

      {!subjectId ? (
        <SubjectPicker />
      ) : (
        <div className="flex flex-col gap-5">
          <CreateChairForm subjectId={subjectId} />
          <ChairList chairs={chairs} />
          <SubjectPicker />
        </div>
      )}
    </div>
  );
}
