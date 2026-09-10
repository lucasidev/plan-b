/**
 * Refresco en el lugar después de guardar, para cuando `router.refresh()` puede perder el commit.
 *
 * `router.refresh()` dispara la misma clase de transición que `router.push()`, y bajo carga sufre
 * el mismo fallo que documenta `navigate-after-mutation.ts` (ADR-0046): el POST de la mutación y el
 * GET del RSC nuevo responden 200, pero React nunca aplica el commit, así que la pantalla se queda
 * mostrando el estado viejo como si guardar no hubiera hecho nada. `my-profile.spec.ts` reprodujo
 * ese mismo fallo con `refresh` en vez de `push` (issue #491, CI del 2026-09-10).
 *
 * No sirve `navigateAfterMutation` acá: esa asigna una URL nueva, y esta pantalla no navega, se
 * queda en la misma URL. `window.location.reload()` recarga el documento entero por fuera de React,
 * con el mismo efecto de sacar el commit de la ecuación.
 *
 * Medido con `--repeat-each=20 --workers=1` contra un build de producción, en un entorno con
 * varios worktrees corriendo en paralelo (sin generador de carga dedicado):
 *
 * | spec (acción)                          | antes (`router.refresh`)        | después |
 * |------------------------------------------|----------------------------------|---------|
 * | my-profile.spec.ts (editar y guardar)     | 1/80 (medido el 2026-09-09)      | 0/20    |
 *
 * El precio es un reload completo, aceptable donde el commit tiene que verse sí o sí y no hay nada
 * más en pantalla que perder (Mi perfil, Corregir una reseña). No es un reemplazo general de
 * `router.refresh()`: donde el resultado visible ya no depende del commit (por ejemplo, Borrar en
 * `my-reviews-list.tsx`, que saca la tarjeta con estado local antes de llamarlo), forzar un reload
 * completo tira una protección existente sin necesidad. Ver el comentario ahí.
 */
export function reloadAfterMutation(): void {
  window.location.reload();
}
