import { fetchOfficialFactsBySubjectTypeServer } from '@/components/facts/official-facts.server';
import { PageFrame } from '@/components/layout/page-frame';
import {
  CanonicalCareerGroups,
  computeDataHighlights,
  DataHighlights,
  ExploreLensSwitch,
  groupCareersByCanonical,
  SingleInstitutionCareerList,
  universityShortName,
} from '@/features/browse-catalog';
import {
  fetchCatalogCoverageServer,
  fetchUniversitiesServer,
} from '@/features/browse-catalog/api.server';

// Público, per-request: el catálogo puede cambiar (crowdsourcing, admin). Visitantes anónimos.
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Carreras · planb',
};

/**
 * /careers (US-222, V03: Explorar tenía una sola lente y esta ruta respondía 404 aunque había
 * links que llevaban acá; ADR-0096, maqueta aprobada: `V.explore`, lente Carreras). La segunda
 * lente de Explorar, por carrera en vez de por institución: Valentina no tiene una universidad,
 * tiene a lo sumo una carrera.
 *
 * Un solo viaje (`fetchCatalogCoverageServer`, ficha de SC-003): antes se armaba pidiendo las
 * carreras de cada institución del catálogo en paralelo (N requests, uno por universidad), lo que
 * escalaba con la cantidad de instituciones. El endpoint ya trae identidad + cobertura de las
 * carreras juntas, así que agrupar es puro trabajo en memoria.
 *
 * Agrupa por carrera canónica (US-195), no por institución: lo que se dicta en más de una se
 * compara lado a lado ("En más de una institución"), el resto queda en una lista compacta ("En una
 * sola institución"). Antes agrupaba por institución, duplicando la lente de Universidades sin
 * decir nada que esa lente no dijera ya.
 *
 * `fetchUniversitiesServer` se suma para el nombre corto de cada institución (ADR-0096, maqueta
 * aprobada: `universityShortName`, por slug: las carreras no lo traen) y para "Lo que los datos
 * dicen", la misma columna de la lente Universidades, con los mismos datos.
 */
export default async function CareersPage() {
  const [careers, universities, institutionFacts, offeringFacts] = await Promise.all([
    fetchCatalogCoverageServer(),
    fetchUniversitiesServer(),
    fetchOfficialFactsBySubjectTypeServer('Institution'),
    fetchOfficialFactsBySubjectTypeServer('Offering'),
  ]);
  const { multiInstitution, singleInstitution } = groupCareersByCanonical(careers);
  const universityShortNames = new Map(
    universities.map((university) => [university.id, universityShortName(university)]),
  );
  const highlights = computeDataHighlights({
    universities,
    careers,
    institutionFacts,
    offeringFacts,
  });

  return (
    <PageFrame
      head={
        <>
          <h1 className="pb-serif">Explorar</h1>
          <p className="pb-h-sub">
            Las {careers.length} ofertas agrupadas por carrera: la misma carrera en varias
            instituciones, lado a lado, sin ganador.
          </p>
          <div style={{ marginTop: 14 }}>
            <ExploreLensSwitch active="careers" />
          </div>
        </>
      }
      main={
        careers.length === 0 ? (
          <p className="text-[13px] text-ink-3">Todavía no hay carreras cargadas en el catálogo.</p>
        ) : (
          <>
            <CanonicalCareerGroups
              groups={multiInstitution}
              universityShortNames={universityShortNames}
            />
            <SingleInstitutionCareerList
              careers={singleInstitution}
              universityShortNames={universityShortNames}
            />
          </>
        )
      }
      aside={<DataHighlights highlights={highlights} />}
    />
  );
}
