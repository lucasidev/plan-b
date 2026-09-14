import {
  CanonicalCareerGroups,
  ExploreLensSwitch,
  groupCareersByCanonical,
  SingleInstitutionCareerList,
} from '@/features/browse-catalog';
import { fetchCatalogCoverageServer } from '@/features/browse-catalog/api.server';

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
 */
export default async function CareersPage() {
  const careers = await fetchCatalogCoverageServer();
  const { multiInstitution, singleInstitution } = groupCareersByCanonical(careers);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8 sm:px-6">
      <ExploreLensSwitch active="careers" />
      <header>
        <p className="font-mono text-[11px] tracking-[0.04em] text-ink-3">Explorar</p>
        <h1 className="mt-1.5 font-display text-[26px] font-semibold leading-tight text-ink">
          Carreras
        </h1>
        <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-ink-2">
          Cada carrera, se dicte en una institución o en varias.
        </p>
      </header>
      {careers.length === 0 ? (
        <p className="text-[13px] text-ink-3">Todavía no hay carreras cargadas en el catálogo.</p>
      ) : (
        <>
          <CanonicalCareerGroups groups={multiInstitution} />
          <SingleInstitutionCareerList careers={singleInstitution} />
        </>
      )}
    </div>
  );
}
