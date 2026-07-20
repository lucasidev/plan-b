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
    <>
      <CatalogTopbar />
      <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6">
        <CatalogErrorState onRetry={reset} />
      </main>
    </>
  );
}
