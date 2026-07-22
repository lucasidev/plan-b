'use client';

import { useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Wifi } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useOnlineStatus } from '@/lib/use-online-status';

/**
 * Banner global de estado offline (US-039-f). Aparece en el top del shell `(member)` cuando
 * `navigator.onLine === false`; cuando vuelve la red muestra 3s "Conexión restablecida" en
 * verde y se retira. Warm warning, no rojo: offline es temporal, no un error fatal.
 *
 * Presentational: solo avisa. Qué acciones se deshabilitan mientras dura lo maneja cada feature
 * consumiendo `useOnlineStatus()`; ese barrido de `disabled` por mutación es incremental y queda
 * como deuda anotada (el hook ya está listo para engancharlo).
 */
export function OfflineBanner() {
  const { online } = useOnlineStatus();
  const queryClient = useQueryClient();
  const [showReconnected, setShowReconnected] = useState(false);
  const wasOffline = useRef(false);
  const retryLocked = useRef(false);

  useEffect(() => {
    if (!online) {
      wasOffline.current = true;
      setShowReconnected(false);
      return;
    }
    if (wasOffline.current) {
      wasOffline.current = false;
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [online]);

  if (online && !showReconnected) return null;

  const reconnected = online && showReconnected;

  function handleRetry() {
    if (retryLocked.current) return;
    retryLocked.current = true;
    void queryClient.refetchQueries();
    // Debounce 3s: no spammear refetch si el user martillea "Reintentar" sin que vuelva la red.
    setTimeout(() => {
      retryLocked.current = false;
    }, 3000);
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-center"
      style={{
        gap: 10,
        padding: '9px 16px',
        fontSize: 13,
        lineHeight: 1.4,
        background: reconnected ? 'oklch(0.93 0.06 145)' : 'oklch(0.92 0.06 60)',
        color: reconnected ? 'oklch(0.4 0.1 145)' : 'oklch(0.42 0.09 60)',
      }}
    >
      {reconnected ? (
        <>
          <Wifi size={15} aria-hidden />
          <span>Conexión restablecida</span>
        </>
      ) : (
        <>
          <AlertTriangle size={15} aria-hidden />
          <span>
            Sin conexión. Te mostramos lo último que cargaste; algunas acciones están en pausa.
          </span>
          <button
            type="button"
            onClick={handleRetry}
            className="font-mono"
            style={{
              appearance: 'none',
              border: 0,
              background: 'none',
              color: 'var(--color-accent-ink)',
              cursor: 'pointer',
              fontSize: 12,
              textDecoration: 'underline',
            }}
          >
            Reintentar
          </button>
        </>
      )}
    </div>
  );
}
