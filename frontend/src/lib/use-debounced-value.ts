import { useEffect, useState } from 'react';

/**
 * Devuelve `value` retrasado `delayMs`: solo se actualiza cuando el valor deja de cambiar por ese
 * lapso. Útil para no disparar una query (o cualquier efecto caro) en cada tecla. Genérico, vive
 * en `lib/` porque no es específico de ninguna feature.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}
