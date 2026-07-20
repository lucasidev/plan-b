import { Button } from '@/components/ui';

/**
 * Estado de error compartido por los 4 `error.tsx` del catálogo público (US-001). Sin
 * `'use client'` propio: siempre se renderiza desde un `error.tsx` que ya lo declara (el
 * boundary de errores de Next.js exige que ESE archivo sea Client Component), así que este
 * componente queda en el mismo bundle sin necesidad de repetir la directiva.
 */
export function CatalogErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-4 rounded-lg border border-line bg-bg-card px-6 py-12 text-center"
    >
      <p className="max-w-[42ch] text-[13.5px] leading-relaxed text-ink-2">
        No pudimos cargar el catálogo. Probá de nuevo en un rato.
      </p>
      <Button onClick={onRetry}>Recargá</Button>
    </div>
  );
}
