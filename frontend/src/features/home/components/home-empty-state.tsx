import Link from 'next/link';
import type { CareerFacts } from '@/features/career-facts/types';
import { CareerCoverageCard } from './career-coverage-card';

type Props = {
  firstName: string;
  facts: CareerFacts | null;
};

/**
 * Inicio sin ninguna reseña todavía (US-231 N1, SC-011). No es el mismo layout con menos cosas
 * ni una lista vacía: es una pantalla propia, centrada, que dice qué hace falta para que una
 * cátedra publique, ofrece una sola acción, y cierra con la cobertura de la carrera, porque leer
 * no depende de que reseñes.
 *
 * La cobertura enlaza a la ficha de la carrera, pero eso no cuenta como una segunda acción de
 * esta pantalla: es la lectura de lo que ya existe, no una alternativa a reseñar.
 */
export function HomeEmptyState({ firstName, facts }: Props) {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-[420px] flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="font-serif text-[24px] font-semibold leading-tight text-ink">
        Hola {firstName}.
      </h1>
      <p className="mt-3 text-[13.5px] leading-relaxed text-ink-2">
        Una cátedra publica sus conteos a partir de diez reseñas. Hasta ahí, lo que se sabe de ella
        queda en cero.
      </p>
      <Link
        href="/reviews/new"
        className="mt-5 inline-block rounded-lg px-3.5 py-[9px] text-[13px] font-medium"
        style={{ background: 'var(--color-ink)', color: 'var(--color-bg-card)' }}
      >
        Reseñar una cursada
      </Link>
      {facts && (
        <div className="mt-10 w-full text-left">
          <CareerCoverageCard facts={facts} />
        </div>
      )}
    </div>
  );
}
