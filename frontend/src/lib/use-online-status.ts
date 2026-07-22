'use client';

import { useEffect, useState } from 'react';

type OnlineStatus = {
  /** `false` cuando el navegador reporta que no hay red. Arranca en `true` (SSR-safe). */
  online: boolean;
  /** Cuándo cambió por última vez el estado (para "Conexión restablecida"). Null hasta el primer cambio. */
  since: Date | null;
};

/**
 * Suscripción a los eventos `online`/`offline` del navegador (US-039-f). Inicializa con
 * `navigator.onLine` en el mount (no en el render inicial, para no romper el SSR: el server
 * no tiene `navigator`).
 *
 * Debounce de 500ms: en conexiones inestables el navegador dispara `online`/`offline` en
 * ráfaga; sin el debounce el banner titila. `navigator.onLine` no garantiza que el backend
 * sea reachable (deuda: combinar con un health check), pero alcanza para el MVP.
 */
export function useOnlineStatus(): OnlineStatus {
  const [status, setStatus] = useState<OnlineStatus>({ online: true, since: null });

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const sync = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        setStatus((prev) => {
          const online = navigator.onLine;
          if (online === prev.online) return prev;
          return { online, since: new Date() };
        });
      }, 500);
    };

    // Estado real al montar (el SSR asumió online).
    setStatus((prev) =>
      navigator.onLine === prev.online ? prev : { online: navigator.onLine, since: new Date() },
    );

    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('online', sync);
      window.removeEventListener('offline', sync);
    };
  }, []);

  return status;
}
