import { OFFICIAL_FACT_FIELDS } from '@/components/facts';
import { fetchOfficialFactsBySubjectTypeServer } from '@/components/facts/official-facts.server';
import {
  computeDataHighlights,
  DataHighlights,
  ExploreLensSwitch,
  institutionTypeLabel,
  summarizeUniversitiesCoverage,
  UniversityList,
} from '@/features/browse-catalog';
import {
  fetchCatalogCoverageServer,
  fetchUniversitiesServer,
} from '@/features/browse-catalog/api.server';

// Público, per-request: catálogo puede cambiar (admin de universidades). Visitantes anónimos.
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Universidades · planb',
};

/**
 * /universities (US-001, ADR-0096). Punto de entrada del catálogo público: todas las
 * universidades soportadas, cada una con su tipo institucional, cuántas carreras tiene y cuántas
 * de esas ya tienen reseñas (US-222, ficha de SC-003), antes de entrar. A la derecha, "Lo que los
 * datos dicen" interpreta el relevamiento oficial por institución y por carrera: un hecho de un
 * solo dato con su fuente, nunca un compuesto (THESIS, "Qué publicamos" 3 y 8).
 *
 * Sin auth, sin paginación (MVP: pocas unis seedeadas). Server-rendered, sin HydrationBoundary
 * (mismo patrón que `app/(public)/subjects/[id]/page.tsx`: server-fetch directo + render).
 */
export default async function UniversitiesPage() {
  const [universities, careers, institutionFacts, offeringFacts] = await Promise.all([
    fetchUniversitiesServer(),
    fetchCatalogCoverageServer(),
    fetchOfficialFactsBySubjectTypeServer('Institution'),
    fetchOfficialFactsBySubjectTypeServer('Offering'),
  ]);

  const institutionFactsById = new Map(institutionFacts.map((s) => [s.subjectId, s.facts]));
  const universitiesWithCoverage = summarizeUniversitiesCoverage(universities, careers).map(
    (university) => ({
      ...university,
      institutionType: institutionTypeLabel(
        institutionFactsById
          .get(university.id)
          ?.find((fact) => fact.field === OFFICIAL_FACT_FIELDS.institutionType),
      ),
    }),
  );

  const highlights = computeDataHighlights({
    universities,
    careers,
    institutionFacts,
    offeringFacts,
  });

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6">
      <header>
        <h1 className="font-display text-[28px] font-semibold leading-tight text-ink">Explorar</h1>
        <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-ink-2">
          {universities.length} instituciones con oferta en Tucumán, {careers.length} carreras, y lo
          que ya se puede leer de cada una.
        </p>
        <div className="mt-3.5">
          <ExploreLensSwitch active="universities" />
        </div>
      </header>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <UniversityList universities={universitiesWithCoverage} />
        <DataHighlights highlights={highlights} />
      </div>
    </div>
  );
}
