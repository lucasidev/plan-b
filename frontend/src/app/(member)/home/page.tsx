import Link from 'next/link';
import { fetchCareerFactsServer } from '@/features/career-facts/api.server';
import { fetchMyReviewedChairTalliesServer } from '@/features/home/api.server';
import { CareerCoverageCard } from '@/features/home/components/career-coverage-card';
import { HomeEmptyState } from '@/features/home/components/home-empty-state';
import { ReviewedChairsCard } from '@/features/home/components/reviewed-chairs-card';
import { greetingNameFromEmail } from '@/features/home/lib/greeting';
import { groupByChair } from '@/features/home/lib/reviewed-chairs';
import { fetchMyReviewsServer } from '@/features/my-reviews/api.server';
import { getSession } from '@/lib/session';
import { fetchStudentProfile } from '@/lib/student-profile';

/**
 * Inicio (`/home`, SC-011, US-231). Contesta la única pregunta con la que alguien vuelve: leer no
 * pide cuenta, así que nadie entra acá a leer, entra a ver qué pasó con lo que reseñó.
 *
 * Dos bloques: las cátedras que esta cuenta reseñó, con cuántas voces junta cada una y si ya
 * publica, y cuánto de su carrera está medido. Los conteos salen de `GET /api/reviews/chairs/mine`
 * en una sola consulta; si esa no llega, la fila se dibuja con el slot inerte en vez de con un
 * cero, que diría que la cátedra no tiene reseñas cuando puede tener doce.
 *
 * Sin reseñas la pantalla no muestra listas vacías: cae en `HomeEmptyState`, una pantalla propia
 * y centrada que dice qué hace falta para que una cátedra publique. La cobertura se muestra
 * igual, al pie, porque leer no depende de que reseñes.
 *
 * El guard de `(member)/layout.tsx` ya filtró sesión y rol; esta página asume los dos.
 *
 * `data-surface="bulletin"` va en el contenedor de ancho completo y no en la columna, mismo
 * criterio documentado en `ChairFactsSheet`: el `<main>` del AppShell no lleva la superficie, así
 * que si el atributo lo lleva solo la columna de 560px, el resto del área queda con el fondo del
 * chasis anterior (Apricot), que es otra paleta.
 */
export default async function HomePage() {
  const [session, profile, reviews, tallies] = await Promise.all([
    getSession(),
    fetchStudentProfile(),
    fetchMyReviewsServer(),
    fetchMyReviewedChairTalliesServer(),
  ]);

  const firstName = session ? greetingNameFromEmail(session.email) : 'alumno';
  const chairs = groupByChair(reviews, tallies);

  // La cobertura cuelga de la carrera declarada. Si el perfil quedó colgado, el bloque no se
  // dibuja en vez de mostrar "0 de 0", que diría que la carrera no tiene materias.
  const facts = profile ? await fetchCareerFactsServer(profile.careerId) : null;

  if (chairs.length === 0) {
    return (
      <div data-surface="bulletin" className="min-h-full w-full">
        <HomeEmptyState firstName={firstName} facts={facts} />
      </div>
    );
  }

  return (
    <div data-surface="bulletin" className="min-h-full w-full">
      <div className="mx-auto w-full max-w-[560px] px-4 py-8">
        <div className="mb-[18px]">
          <p className="font-mono text-[11px] tracking-[0.04em] text-ink-3">Inicio</p>
          <h1 className="mt-1.5 font-serif text-[24px] font-semibold leading-tight text-ink">
            Hola {firstName}.
          </h1>
          <p className="mt-2 text-[13.5px] leading-relaxed text-ink-2">
            Esto es lo que pasó con lo que reseñaste.
          </p>
        </div>

        <ReviewedChairsCard chairs={chairs} />
        {facts && <CareerCoverageCard facts={facts} />}

        <Link
          href="/reviews/new"
          className="inline-block rounded-lg px-3.5 py-[9px] text-[13px] font-medium"
          style={{ background: 'var(--color-ink)', color: 'var(--color-bg-card)' }}
        >
          Reseñar una cursada
        </Link>
      </div>
    </div>
  );
}
