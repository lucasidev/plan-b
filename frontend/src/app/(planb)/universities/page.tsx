import { OFFICIAL_FACT_FIELDS } from '@/components/facts';
import { fetchOfficialFactsBySubjectTypeServer } from '@/components/facts/official-facts.server';
import { PageFrame } from '@/components/layout/page-frame';
import {
  computeDataHighlights,
  DataHighlights,
  ExploreLensSwitch,
  institutionTypeLabel,
  numberInWords,
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
 * /universities (US-001, ADR-0096, maqueta aprobada: `V.explore`, lente Universidades). Punto de
 * entrada del catálogo público: todas las universidades soportadas, cada una con su tipo
 * institucional, cuántas carreras tiene y cuántas de esas ya tienen reseñas (US-222, ficha de
 * SC-003), antes de entrar. A la derecha, "Lo que los datos dicen" interpreta el relevamiento
 * oficial por institución y por carrera: un hecho de un solo dato con su fuente, nunca un
 * compuesto (THESIS, "Qué publicamos" 3 y 8). Va en las dos lentes de Explorar, con los mismos
 * datos.
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

  // "Cinco instituciones..." (ADR-0096, maqueta aprobada: números chicos en palabras, mayúscula
  // inicial porque abre la oración).
  const institutionsWord = numberInWords(universities.length);
  const institutionsWordCapitalized =
    institutionsWord.charAt(0).toUpperCase() + institutionsWord.slice(1);

  return (
    <PageFrame
      head={
        <>
          <h1 className="pb-serif">Explorar</h1>
          <p className="pb-h-sub">
            {institutionsWordCapitalized} instituciones con oferta en Tucumán, {careers.length}{' '}
            carreras, y lo que ya se puede leer de cada una.
          </p>
          <div style={{ marginTop: 14 }}>
            <ExploreLensSwitch active="universities" />
          </div>
        </>
      }
      main={<UniversityList universities={universitiesWithCoverage} />}
      aside={<DataHighlights highlights={highlights} />}
    />
  );
}
