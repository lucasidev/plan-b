import { notFound } from 'next/navigation';
import { fetchOfficialFactsServer } from '@/components/facts';
import {
  fetchCareersByUniversityServer,
  fetchCatalogCoverageServer,
  fetchUniversitiesServer,
} from '@/features/browse-catalog/api.server';
import { InstitutionFactsSheet } from '@/features/institution-facts';
import { fetchInstitutionProfile } from '@/features/manage-universities/profile-api.server';

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
 * Cabecera (eyebrow, nombre, cuántas carreras en cuántas facultades) y el dato completo de
 * identidad institucional salen de academic (`fetchOfficialFactsServer`, sujeto `Institution`).
 * "Facultades y carreras" y "Por dónde empezar" cruzan las carreras de academic
 * (`fetchCareersByUniversityServer`) con `fetchCatalogCoverageServer` (reviews), filtrado por esta
 * universidad: sí hay endpoint para el conteo de reseñas por carrera, es `catalog-coverage`.
 */
export default async function UniversityCareersPage({ params }: { params: Params }) {
  const { slug } = await params;

  const universities = await fetchUniversitiesServer();
  const university = universities.find((u) => u.slug === slug);
  if (!university) {
    notFound();
  }

  const [careers, officialFacts, catalogCoverage, profile] = await Promise.all([
    fetchCareersByUniversityServer(university.id),
    fetchOfficialFactsServer('Institution', university.id),
    fetchCatalogCoverageServer(),
    fetchInstitutionProfile(university.id),
  ]);

  const universityCoverage = catalogCoverage.filter((c) => c.universityId === university.id);

  return (
    <InstitutionFactsSheet
      universityName={university.name}
      careers={careers}
      officialFacts={officialFacts}
      coverage={universityCoverage}
      profile={profile}
    />
  );
}
