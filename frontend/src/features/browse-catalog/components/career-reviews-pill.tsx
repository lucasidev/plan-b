import { Pill } from '@/components/ui';
import { type CareerCoverageMeta, careerReviewsState } from '../lib/describe-career-coverage';

/**
 * El estado de reseñas de una oferta en la lente de Carreras (US-222, ADR-0096), en sus tres
 * formas: el conteo real ("3 reseñas"), que hay reseñas cargándose bajo el piso ("con reseñas",
 * sin decir cuántas, por privacidad), o que no hay ninguna. Nunca cobertura acá. La comparten "En
 * más de una institución" y "En una sola institución": la misma oferta se lee igual en las dos.
 */
export function CareerReviewsPill({
  career,
}: {
  career: Pick<CareerCoverageMeta, 'voiceCount' | 'hasReviewsBelowFloor'>;
}) {
  const state = careerReviewsState(career);

  if (state.kind === 'reviewed') {
    return <Pill tone="good">{state.label}</Pill>;
  }
  if (state.kind === 'pending') {
    return <Pill tone="neutral">con reseñas</Pill>;
  }
  return <Pill tone="neutral">sin reseñas todavía</Pill>;
}
