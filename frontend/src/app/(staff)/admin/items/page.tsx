import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { itemCatalogQueries } from '@/features/curate-items/api';
import { fetchItemsServer } from '@/features/curate-items/api.server';
import { ItemCatalog } from '@/features/curate-items/components/item-catalog';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Preguntas · planb' };

/**
 * Preguntas (SC-029, US-198). El catálogo de lo que el producto pregunta, editable en un solo lugar.
 *
 * Es la pantalla más cara de equivocar del backoffice: una pregunta mal definida no rompe una fila, sino
 * todas las fichas que lo usan, y lo hace en silencio. Por eso editar no es un formulario suelto
 * sino una declaración de qué se está cambiando (ver `ItemEditor`): afinar la redacción conserva la
 * serie, cambiar lo que se pregunta la corta, y esa diferencia no la puede deducir el sistema.
 *
 * El guard de `(staff)/layout.tsx` ya filtró sesión y rol admin; esta página asume los dos.
 *
 * El catálogo se prefetchea acá y se hidrata (mismo queryKey que consume `ItemCatalog`): guardar lo
 * invalida y refetchea client-side, que es lo único que refleja el cambio de forma confiable en
 * prod build (ADR-0021 + ADR-0046).
 */
export default async function AdminItemsPage() {
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: itemCatalogQueries.all().queryKey,
    queryFn: fetchItemsServer,
  });

  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 py-8">
      <div className="mb-5">
        <p className="mb-1 text-xs text-ink-3">Cuestionarios</p>
        <h1 className="mb-1 font-serif text-[24px] font-semibold text-ink">Preguntas</h1>
        <p className="max-w-[640px] text-[13px] leading-relaxed text-ink-2">
          Administrá las preguntas del cuestionario de cursada, sus opciones de respuesta y la capa
          a la que pertenecen.
        </p>
        <p className="mt-1.5 max-w-[640px] text-[11.5px] leading-relaxed text-ink-3">
          Corregir la redacción conserva las respuestas anteriores. Cambiar el significado crea otra
          pregunta y una versión nueva del cuestionario; sus respuestas se cuentan por separado.
        </p>
      </div>

      <HydrationBoundary state={dehydrate(queryClient)}>
        <ItemCatalog />
      </HydrationBoundary>
    </div>
  );
}
