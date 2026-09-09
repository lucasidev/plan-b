'use client';

import { useEffect } from 'react';
import { CatalogErrorState, CatalogTopbar } from '@/features/browse-catalog';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div data-surface="bulletin" className="min-h-screen w-full">
      <CatalogTopbar />
      <main className="mx-auto flex max-w-[560px] flex-col gap-6 px-4 py-8">
        <CatalogErrorState onRetry={reset} />
      </main>
    </div>
  );
}
