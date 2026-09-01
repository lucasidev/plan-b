import Link from 'next/link';
import { CURATION_PAGE_SIZE, fetchFreeTextsServer } from '@/features/curation/api.server';
import { DistilItemForm } from '@/features/curation/components/distil-item-form';
import { FreeTextList } from '@/features/curation/components/free-text-list';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Curaduría · planb' };

type Props = {
  searchParams: Promise<{ skip?: string }>;
};

/**
 * Curaduría (ADR-0084). El campo libre de las reseñas, para que el equipo lo lea.
 *
 * El ADR le prometió dos salidas al campo libre (destilar ítems nuevos para la versión siguiente
 * del instrumento, y escribir notas editoriales sin nombres) y ninguna se puede hacer sin leerlo.
 * Hasta acá lo único que lo leía era su propio autor.
 *
 * El guard de `(staff)/layout.tsx` ya filtró sesión y rol admin; esta página asume los dos.
 */
export default async function CurationPage({ searchParams }: Props) {
  const { skip: rawSkip } = await searchParams;
  const skip = Math.max(0, Number.parseInt(rawSkip ?? '0', 10) || 0);

  const { items, total } = await fetchFreeTextsServer(skip);
  const from = total === 0 ? 0 : skip + 1;
  const to = skip + items.length;

  return (
    <div className="mx-auto w-full max-w-[720px] px-4 py-8">
      <div className="mb-5">
        <h1 className="mb-1 font-serif text-[24px] font-semibold text-ink">Curaduría</h1>
        <p className="text-[13px] leading-relaxed text-ink-2">
          Lo que la gente escribió al final de su reseña. <b>No se publica en ninguna ficha</b>: se
          lee acá para descubrir qué habría que estar preguntando y no preguntamos, y para escribir
          notas del equipo sin nombres.
        </p>
        <p className="mt-1.5 text-[11.5px] text-ink-3">
          Quién escribió cada uno no llega hasta acá, y no es una omisión de esta pantalla: el dato
          no sale de la base.
        </p>
      </div>

      <div className="mb-5">
        <DistilItemForm />
      </div>

      {total > 0 && (
        <p className="mb-2 font-mono text-[11px] text-ink-3">
          {from} a {to} de {total}
        </p>
      )}

      <FreeTextList texts={items} />

      {total > CURATION_PAGE_SIZE && (
        <nav className="mt-4 flex items-center gap-3 text-[12.5px]">
          {skip > 0 && (
            <Link
              href={`/admin/curation?skip=${Math.max(0, skip - CURATION_PAGE_SIZE)}`}
              className="text-ink-2 underline-offset-2 hover:text-ink hover:underline"
            >
              Anteriores
            </Link>
          )}
          {to < total && (
            <Link
              href={`/admin/curation?skip=${skip + CURATION_PAGE_SIZE}`}
              className="text-ink-2 underline-offset-2 hover:text-ink hover:underline"
            >
              Siguientes
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
