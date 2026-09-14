import { CatalogLoadingSkeleton } from '@/features/browse-catalog';

export default function Loading() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="h-8 w-48 animate-pulse rounded bg-line-2" />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <CatalogLoadingSkeleton variant="list" />
        <div className="flex flex-col gap-4" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((row) => (
            <div
              key={row}
              className="h-24 animate-pulse rounded-xl border border-line bg-bg-card"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
