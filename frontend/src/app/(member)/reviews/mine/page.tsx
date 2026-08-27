import { fetchMyCourseReviewsServer, MyReviewsList } from '@/features/my-course-reviews';
import { fetchCurrentInstrumentServer } from '@/features/write-course-review';

export const metadata = {
  title: 'Mis aportes · planb',
};

// Depende de la sesión y cambia con cada corrección: se sirve fresca.
export const dynamic = 'force-dynamic';

/**
 * Mis aportes (SC-017, US-165, US-166): lo que esta cuenta contó, para poder corregirlo o borrarlo.
 *
 * El cuestionario baja acá porque el editor lo necesita para dibujar las preguntas. Si todavía no
 * hay uno publicado, la lista se ve igual pero sin poder corregir: mostrar lo aportado no depende
 * de que exista un cuestionario vigente.
 *
 * Es también donde aterriza quien acaba de contar una cursada (`?published=1`): el acuse va acá y
 * no en la pantalla de contar porque lo que confirma es que la reseña ya está en la lista, con su
 * botón de corregir al lado.
 */
export default async function MyCourseReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ published?: string }>;
}) {
  const [{ published }, reviews, instrument] = await Promise.all([
    searchParams,
    fetchMyCourseReviewsServer(),
    fetchCurrentInstrumentServer(),
  ]);

  return (
    <div data-surface="bulletin" className="mx-auto w-full max-w-[560px] px-4 py-8">
      <div className="mb-[18px]">
        <h1 className="mb-0.5 font-serif text-[24px] font-semibold text-ink">Mis aportes</h1>
        <p className="text-[13px] leading-relaxed text-ink-2">
          Lo que contaste, y que solo ves vos. En las fichas nunca se muestra una reseña sola: se
          publican los conteos de todos juntos.
        </p>
      </div>

      {published === '1' && (
        <p
          role="status"
          className="mb-3 rounded-lg border border-line bg-bg-elev px-3.5 py-2.5 text-[13px] leading-relaxed text-ink"
        >
          Listo, quedó contada. Se suma a los conteos de su cátedra; acá la podés corregir o sacar
          cuando quieras.
        </p>
      )}

      <MyReviewsList reviews={reviews} instrument={instrument} />
    </div>
  );
}
