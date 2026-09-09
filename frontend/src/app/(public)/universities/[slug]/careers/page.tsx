import { notFound } from 'next/navigation';
import { fetchOfficialFactsServer } from '@/components/facts';
import { CareerList, CatalogBreadcrumb, CatalogTopbar } from '@/features/browse-catalog';
import {
  fetchCareersByUniversityServer,
  fetchUniversitiesServer,
} from '@/features/browse-catalog/api.server';
import {
  InstitutionIdentity,
  ReviewCta,
  TransparencyChecklist,
} from '@/features/institution-facts';
import { reviewCtaHref } from '@/features/write-review';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params;
  const universities = await fetchUniversitiesServer();
  const university = universities.find((u) => u.slug === slug);
  return { title: university ? `${university.name} · planb` : 'Institución · planb' };
}

/**
 * /universities/[slug]/careers (SC-005, ADR-0090). **Pública, sin cuenta.** No hay endpoint
 * público "get university by slug": se resuelve fetcheando el listado completo de universidades
 * (barato, MVP con pocas unis) y matcheando por `slug`. 404 si el slug no matchea ninguna.
 *
 * Cabecera de identidad y checklist de transparencia salen de academic
 * (`fetchOfficialFactsServer`, sujeto `Institution`). La navegación de carreras sigue siendo el
 * listado simple de US-001: la tarjeta con cantidad de reseñas por carrera que dibuja el boceto
 * de SC-005 necesita ese conteo agregado, que hoy no expone ningún endpoint, y no es parte de
 * esta tarea (R6, #486).
 */
export default async function UniversityCareersPage({ params }: { params: Params }) {
  const { slug } = await params;

  const universities = await fetchUniversitiesServer();
  const university = universities.find((u) => u.slug === slug);
  if (!university) {
    notFound();
  }

  const [careers, officialFacts, session] = await Promise.all([
    fetchCareersByUniversityServer(university.id),
    fetchOfficialFactsServer('Institution', university.id),
    getSession(),
  ]);

  return (
    <div data-surface="bulletin" className="min-h-screen w-full">
      <CatalogTopbar />
      <div className="mx-auto w-full max-w-[560px] px-4 py-8">
        <div className="mb-4">
          <CatalogBreadcrumb
            items={[{ label: 'Universidades', href: '/universities' }, { label: university.name }]}
          />
        </div>
        <InstitutionIdentity name={university.name} facts={officialFacts} />
        <section className="mb-5">
          <p className="mb-2 text-[12px] text-ink-3">Carreras</p>
          <CareerList careers={careers} />
        </section>
        <TransparencyChecklist facts={officialFacts} />
        <ReviewCta href={reviewCtaHref(session)} />
      </div>
    </div>
  );
}
