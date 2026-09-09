import { CatalogLoadingSkeleton, CatalogTopbar } from '@/features/browse-catalog';

// Mismo ancho y superficie que la ficha de institución (SC-005), para que el esqueleto no
// parpadee a otro palette ni a otro ancho cuando el contenido real reemplaza esta pantalla.
export default function Loading() {
  return (
    <div data-surface="bulletin" className="min-h-screen w-full">
      <CatalogTopbar />
      <main className="mx-auto flex max-w-[560px] flex-col gap-6 px-4 py-8">
        <div className="h-3 w-40 animate-pulse rounded bg-line-2" />
        <div className="h-8 w-64 animate-pulse rounded bg-line-2" />
        <CatalogLoadingSkeleton variant="list" />
      </main>
    </div>
  );
}
