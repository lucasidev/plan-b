import { notFound } from 'next/navigation';
import { CareerList, CatalogBreadcrumb, CatalogTopbar } from '@/features/browse-catalog';
import {
  fetchCareersByUniversityServer,
  fetchUniversitiesServer,
} from '@/features/browse-catalog/api.server';

export const dynamic = 'force-dynamic';

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params;
  const universities = await fetchUniversitiesServer();
  const university = universities.find((u) => u.slug === slug);
  return { title: university ? `Carreras · ${university.name} · planb` : 'Carreras · planb' };
}

/**
 * /universities/[slug]/careers (US-001). No hay endpoint público "get university by slug": se
 * resuelve fetcheando el listado completo de universidades (barato, MVP con pocas unis) y
 * matcheando por `slug`. 404 si el slug no matchea ninguna.
 */
export default async function UniversityCareersPage({ params }: { params: Params }) {
  const { slug } = await params;

  const universities = await fetchUniversitiesServer();
  const university = universities.find((u) => u.slug === slug);
  if (!university) {
    notFound();
  }

  const careers = await fetchCareersByUniversityServer(university.id);

  return (
    <>
      <CatalogTopbar />
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
        <CatalogBreadcrumb
          items={[{ label: 'Universidades', href: '/universities' }, { label: university.name }]}
        />
        <header>
          <p className="font-mono text-[11px] tracking-[0.04em] text-ink-3">Carreras</p>
          <h1 className="mt-1.5 font-display text-[26px] font-semibold leading-tight text-ink">
            {university.name}
          </h1>
        </header>
        <CareerList careers={careers} />
      </main>
    </>
  );
}
