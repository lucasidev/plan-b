import { CatalogLoadingSkeleton, CatalogTopbar } from '@/features/browse-catalog';

export default function Loading() {
  return (
    <>
      <CatalogTopbar />
      <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6">
        <div className="h-3 w-56 animate-pulse rounded bg-line-2" />
        <div className="h-8 w-40 animate-pulse rounded bg-line-2" />
        <CatalogLoadingSkeleton variant="grid" />
      </main>
    </>
  );
}
