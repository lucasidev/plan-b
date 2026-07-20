'use client';

import { useEffect, useState } from 'react';

/**
 * Devuelve `false` durante el render del servidor y el primer render del cliente, y `true` recién
 * cuando el componente terminó de hidratar.
 *
 * Existe para cerrar una ventana real de la app, no para conformar a los tests: un
 * `<form action={serverAction}>` con `useActionState` solo es interactivo después de que React
 * hidrata. Si el submit ocurre antes, el browser lo manda como POST nativo: el server action corre
 * igual (la mutación pasa), pero el resultado nunca llega al estado del cliente, así que **el
 * mensaje de error y el redirect que viven ahí nunca se muestran**. El usuario ve que no pasó nada.
 *
 * Con esto el botón de submit arranca deshabilitado y se habilita al hidratar, así que no hay forma
 * de disparar la acción en esa ventana. Es el mismo patrón `mounted` que ya usábamos para gatear
 * queries client-only (ver `teacher-claim-panel`), extraído porque ahora tiene varios consumidores.
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return hydrated;
}
