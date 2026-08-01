/**
 * Navegación que cierra un formulario después de guardar.
 *
 * Existe porque `router.push()` no alcanza acá, y eso está medido, no supuesto. El flujo es:
 * el server action devuelve `success` (ADR-0046) y un efecto navega. Con `router.push`, la
 * navegación es una transición de React, y React difiere el commit de una transición hasta que el
 * árbol nuevo esté listo. Mientras tanto **la URL no cambia y la pantalla sigue siendo el
 * formulario**, así que el alumno ve su edición como si no hubiera pasado nada.
 *
 * Los números, corriendo el E2E veinte veces contra un build de producción:
 *
 * | variante                                   | alta      | edición   |
 * |--------------------------------------------|-----------|-----------|
 * | `redirect()` adentro del action             | 50%       |     -     |
 * | `router.push` desde el efecto               | 5%        | 25%       |
 * | idem + Suspense en la tab del historial      | 0/20      | 10%       |
 * | esta navegación                              | 0/20      | 0/20      |
 *
 * El trace del fallo es inequívoco: el POST del action vuelve 200 en 14ms, el GET del payload RSC
 * del destino vuelve 200 en 3ms, y después no pasa nada más durante treinta segundos. El contenido
 * estaba; lo que no ocurría era el commit.
 *
 * `location.assign` cambia la URL de forma sincrónica y saca a React de la ecuación. El precio es
 * un reload completo, y es un precio bajo donde ya se aplica: un formulario que termina yéndose de
 * la página, donde igual se descarta todo su estado. **No** es el default para navegar en la app:
 * para moverse entre pantallas sigue siendo `router.push`.
 */
export function navigateAfterMutation(url: string): void {
  window.location.assign(url);
}
