import { MOCK_CURSADA_CONTEXT, ReviewEditor } from '@/features/write-review';

export const metadata = {
  title: 'Escribir reseña · planb',
};

type Params = Promise<{ cursadaId: string }>;

/**
 * /resenas/escribir/[cursadaId] (US-049). Editor de reseña con 6 campos numerados y
 * preview vivo. La URL usa "resenas" (ASCII) en vez de "reseñas" porque el navegador
 * url-encodea la ñ a %C3%B1 y queda feo en el address bar; las strings de UI siguen
 * siendo "Reseñas".
 *
 * El [cursadaId] de la URL identifica al EnrollmentRecord que se va a reseñar. Hoy se
 * ignora (todo el editor corre contra `MOCK_CURSADA_CONTEXT`) porque el endpoint `GET
 * /api/me/pending-reviews/:cursadaId` que devuelve materia + docente + comisión + nota
 * todavía no existe (US-048 backend + rework del modelo de Review). Cuando aterrice, el
 * page hace prefetch y pasa el context real al editor.
 */
export default async function EscribirResenaPage({ params }: { params: Params }) {
  // Resuelvo el id para que Next.js no warn; lo dropeo intencionalmente hasta el wiring real.
  await params;

  return <ReviewEditor ctx={MOCK_CURSADA_CONTEXT} />;
}
