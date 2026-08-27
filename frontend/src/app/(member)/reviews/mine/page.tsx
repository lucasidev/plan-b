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
 */
export default async function MyCourseReviewsPage() {
  const [reviews, instrument] = await Promise.all([
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

      <MyReviewsList reviews={reviews} instrument={instrument} />
    </div>
  );
}
