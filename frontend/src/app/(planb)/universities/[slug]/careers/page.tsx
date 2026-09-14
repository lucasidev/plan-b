import { notFound } from 'next/navigation';
import { fetchOfficialFactsServer } from '@/components/facts';
import { CatalogBreadcrumb } from '@/features/browse-catalog';
import {
  fetchCareersByUniversityServer,
  fetchCatalogCoverageServer,
  fetchUniversitiesServer,
} from '@/features/browse-catalog/api.server';
import {
  CareersByFaculty,
  CareersStartHere,
  InstitutionIdentity,
  InstitutionNumbers,
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
 * Cabecera (eyebrow, nombre, cantidad de unidades académicas) y el dato completo de identidad
 * institucional salen de academic (`fetchOfficialFactsServer`, sujeto `Institution`). Cuántas
 * carreras tienen reseñas por unidad académica y "Por dónde empezar" cruzan las carreras de
 * academic (`fetchCareersByUniversityServer`) con `fetchCatalogCoverageServer` (reviews), filtrado
 * por esta universidad: sí hay endpoint para el conteo de reseñas por carrera, es `catalog-coverage`.
 */
export default async function UniversityCareersPage({ params }: { params: Params }) {
  const { slug } = await params;

  const universities = await fetchUniversitiesServer();
  const university = universities.find((u) => u.slug === slug);
  if (!university) {
    notFound();
  }

  const [careers, officialFacts, catalogCoverage, session] = await Promise.all([
    fetchCareersByUniversityServer(university.id),
    fetchOfficialFactsServer('Institution', university.id),
    fetchCatalogCoverageServer(),
    getSession(),
  ]);

  const universityCoverage = catalogCoverage.filter((c) => c.universityId === university.id);
  const academicUnitCount = new Set(
    careers.map((c) => c.academicUnitName).filter((name): name is string => name !== null),
  ).size;
  const careersWithReviews = universityCoverage.filter(
    (c) => c.voiceCount > 0 || c.hasReviewsBelowFloor,
  ).length;

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-4xl px-4 py-8">
        <div className="mb-4">
          <CatalogBreadcrumb
            items={[{ label: 'Universidades', href: '/universities' }, { label: university.name }]}
          />
        </div>
        <InstitutionIdentity
          name={university.name}
          facts={officialFacts}
          academicUnitCount={academicUnitCount}
        />
        <InstitutionNumbers
          facts={officialFacts}
          totalCareers={careers.length}
          careersWithReviews={careersWithReviews}
        />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_300px]">
          <div className="min-w-0">
            <section className="mb-5">
              <p className="mb-2 text-[12px] text-ink-3">Facultades y carreras</p>
              <CareersByFaculty careers={careers} coverage={universityCoverage} />
            </section>
          </div>
          <div className="flex flex-col gap-5">
            <CareersStartHere coverage={universityCoverage} />
            <TransparencyChecklist facts={officialFacts} />
          </div>
        </div>
        <div className="mt-5">
          <ReviewCta href={reviewCtaHref(session)} />
        </div>
      </div>
    </div>
  );
}
