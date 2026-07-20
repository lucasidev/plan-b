import { CatalogTopbar, UniversityList } from '@/features/browse-catalog';
import { fetchUniversitiesServer } from '@/features/browse-catalog/api.server';

// Público, per-request: catálogo puede cambiar (admin de universidades). Visitantes anónimos.
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Universidades · planb',
};

/**
 * /universities (US-001). Punto de entrada del catálogo público: todas las universidades
 * soportadas. Sin auth, sin paginación (MVP: pocas unis seedeadas, ver
 * `ListUniversitiesEndpoint`). Server-rendered, sin HydrationBoundary (mismo patrón que
 * `app/(public)/subjects/[id]/page.tsx`: server-fetch directo + render).
 */
export default async function UniversitiesPage() {
  const universities = await fetchUniversitiesServer();

  return (
    <>
      <CatalogTopbar />
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
        <header>
          <p className="font-mono text-[11px] tracking-[0.04em] text-ink-3">Catálogo</p>
          <h1 className="mt-1.5 font-display text-[26px] font-semibold leading-tight text-ink">
            Universidades
          </h1>
          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-ink-2">
            Elegí tu universidad para ver sus carreras, planes de estudio y materias.
          </p>
        </header>
        <UniversityList universities={universities} />
      </main>
    </>
  );
}
