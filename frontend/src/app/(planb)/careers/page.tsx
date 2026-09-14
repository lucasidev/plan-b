import {
  CanonicalCareerGroups,
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
 * links que llevaban acá; ADR-0096). La segunda lente de Explorar, por carrera en vez de por
 * institución: Valentina no tiene una universidad, tiene a lo sumo una carrera.
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
 * `fetchUniversitiesServer` se suma solo para armar el nombre corto de cada institución (ADR-0096,
 * maqueta aprobada: `universityShortName`, por slug): las carreras no lo traen.
 */
export default async function CareersPage() {
  const [careers, universities] = await Promise.all([
    fetchCatalogCoverageServer(),
    fetchUniversitiesServer(),
  ]);
  const { multiInstitution, singleInstitution } = groupCareersByCanonical(careers);
  const universityShortNames = new Map(
    universities.map((university) => [university.id, universityShortName(university)]),
  );

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8 sm:px-6">
      <header>
        <h1 className="font-display text-[28px] font-semibold leading-tight text-ink">Explorar</h1>
        <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-ink-2">
          Las que se dictan en más de una institución, para comparar lado a lado, y las que se
          dictan en una sola.
        </p>
        <div className="mt-3.5">
          <ExploreLensSwitch active="careers" />
        </div>
      </header>
      {careers.length === 0 ? (
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
      )}
    </div>
  );
}
