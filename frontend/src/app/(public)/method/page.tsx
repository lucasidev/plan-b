import { fetchPublishingRulesServer } from '@/features/method/api.server';
import { MethodSheet } from '@/features/method/components/method-sheet';
import { fetchCurrentInstrumentServer } from '@/features/write-course-review/api.server';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Método · planb',
  description: 'Cómo se calcula cada número que planb publica.',
};

/**
 * Método (SC-021, US-130). Pública y sin cuenta: poder auditar un número no puede depender de
 * tener usuario (US-168).
 *
 * El cuestionario sale del mismo endpoint que lee la pantalla de reseñar, y los pisos del backend
 * donde viven: publicar una copia escrita a mano garantizaría que un día diga algo distinto de lo
 * que el producto hace.
 */
export default async function MethodPage() {
  const [instrument, rules] = await Promise.all([
    fetchCurrentInstrumentServer(),
    fetchPublishingRulesServer(),
  ]);

  return (
    <MethodSheet
      instrument={instrument}
      chairFloor={rules.chairMinimumReviews}
      pairFloor={rules.subjectPairMinimumReviews}
    />
  );
}
