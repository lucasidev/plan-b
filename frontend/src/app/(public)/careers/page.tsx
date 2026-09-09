import {
  CareerCoverageList,
  CatalogTopbar,
  ExploreLensSwitch,
  groupCareersByUniversity,
} from '@/features/browse-catalog';
import { fetchCatalogCoverageServer } from '@/features/browse-catalog/api.server';

// Público, per-request: el catálogo puede cambiar (crowdsourcing, admin). Visitantes anónimos.
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Carreras · planb',
};

/**
 * /careers (US-222, V03: Explorar tenía una sola lente y esta ruta respondía 404 aunque había
 * links que llevaban acá). La segunda lente de Explorar, por carrera en vez de por institución:
 * Valentina no tiene una universidad, tiene a lo sumo una carrera.
 *
 * Un solo viaje (`fetchCatalogCoverageServer`, ficha de SC-003): antes se armaba pidiendo las
 * carreras de cada institución del catálogo en paralelo (N requests, uno por universidad), lo que
 * escalaba con la cantidad de instituciones. El nuevo endpoint ya trae identidad + cobertura de
 * las 230 carreras juntas, así que agrupar por institución es puro trabajo en memoria.
 *
 * Agrupar por institución, y no un único listado plano de 230 carreras, es la respuesta al volumen
 * real: nombra dónde se dicta cada una (US-222 E2) sin repetirlo carrera por carrera, y separa el
 * "institución" de la lente de universidades sin duplicar esa pantalla.
 */
export default async function CareersPage() {
  const careers = await fetchCatalogCoverageServer();
  const groups = groupCareersByUniversity(careers);

  return (
    <>
      <CatalogTopbar />
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
        <ExploreLensSwitch active="careers" />
        <header>
          <p className="font-mono text-[11px] tracking-[0.04em] text-ink-3">Catálogo</p>
          <h1 className="mt-1.5 font-display text-[26px] font-semibold leading-tight text-ink">
            Carreras
          </h1>
          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-ink-2">
            Elegí tu carrera para ver su ficha, sin pasar antes por una universidad.
          </p>
        </header>
        {groups.length === 0 ? (
          <p className="text-[13px] text-ink-3">Todavía no hay carreras cargadas en el catálogo.</p>
        ) : (
          <div className="flex flex-col gap-8">
            {groups.map((group) => (
              <section key={group.universityId} aria-label={group.universityName}>
                <h2 className="font-display text-[16px] font-semibold text-ink">
                  {group.universityName}
                </h2>
                <div className="mt-3">
                  <CareerCoverageList careers={group.careers} />
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
