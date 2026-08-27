# Entrar

> Épica del umbral: las pantallas que hacen falta para pasar de leer a producir, y la que aparece cuando algo se rompe. **Estado**: escrito el 2026-08-19 con el corte de [ADR-0070](../../../decisions/0070-product-requirements-are-vertical-by-capability-and-design-is-text.md); sus cuatro pantallas, que antes vivían en una carpeta de pantallas compartidas, tienen ficha y boceto revisados el 2026-08-19.

## Qué es

Leer no pide cuenta; producir sí ([THESIS.md](../../../THESIS.md), decisión 3). Esta épica es el umbral que separa las dos cosas y que **no se cruza en la puerta sino en la acción**: nadie ve un login por entrar, lo ve cuando va a reseñar, corregir un dato o responder, con el motivo a la vista y con la vuelta a donde estaba. Además vive acá la pantalla de Error, porque es el chasis que sostiene a todas las demás cuando algo falla y no le pertenece a ninguna épica en particular.

Sostiene garantías de otras épicas ([Que no me molesten](../../guarantees/README.md): US-168 el gate en la acción, US-169 no repreguntar; y la garantía de recuperar la contraseña, que antes era O5-3) y sirve a los que producen.

## Para quién

**Matías** (llega desde una ficha que acaba de leer y recién ahí pasa el umbral: por él el gate está en la acción y no en la puerta), **Ana** (si se registra desde el mail de su pedido, institución y carrera vienen precargadas), y cualquiera que vuelva y no se acuerde la contraseña.

## Stories

Cuatro. El resto de lo que pasa en el umbral sí son garantías de otras épicas que se verifican acá, pero cruzar el umbral es una acción concreta con su pantalla y su criterio, y eso es una story.

| ID | De qué trata |
|---|---|
| [US-220](stories/US-220-recover-the-password-by-mail/README.md) | Recuperar la contraseña con un link al mail |
| [US-228](stories/US-228-create-the-account-when-the-action-asks-for-it/README.md) | Crear la cuenta recién cuando la acción me la pide |
| [US-229](stories/US-229-sign-in-and-land-back-on-what-i-was-doing/README.md) | Entrar y volver a lo que estaba haciendo |
| [US-230](stories/US-230-understand-the-failure-without-losing-my-work/README.md) | Entender que se rompió sin perder lo que venía cargando |

### Las que cumple de otras épicas

Además de la suya, esta épica sostiene stories de otras, que viven allá y se verifican acá: [US-168, US-169, US-170](../../guarantees/README.md#stories) (las garantías), [US-142](../request-a-career/README.md#stories) (la precarga desde el pedido), [US-155](../write-a-review/README.md#stories) (el año de ingreso lo pregunta la primera reseña, no el registro), [US-161](../write-a-review/README.md#stories) (lo que quedó a medias no se pierde cuando algo falla).


**Escenarios ejecutables**: el "listo cuando" de cada story traducido a Dado/Cuando/Entonces con valores concretos, con sus casos negativos y sus casos borde, en [`scenarios.md`](scenarios.md). Es lo que se lee antes de escribir el test.

## Decisiones que aplica

[THESIS.md](../../../THESIS.md) (decisión 3: leer sin cuenta, producir con cuenta), [ADR-0048](../../../decisions/0048-standing-is-opt-in-and-decoupled-from-email.md) (verificarse es opt-in y nunca por el mail: el registro no verifica a nadie), y las Restricciones del [catálogo](../../README.md) (consentimiento informado, Ley 25.326).

## Pantallas

Estas pantallas viven en esta épica, con su ficha y su boceto:

- [**Ingresar**](screens/SC-025-sign-in/README.md) (umbral): con el motivo a la vista y vuelta a la acción que lo disparó; [boceto](screens/SC-025-sign-in/sketch.html).
- [**Registro**](screens/SC-026-sign-up/README.md) (umbral): quién sos, institución y carrera; declarar dónde estás, no elegir; [boceto](screens/SC-026-sign-up/sketch.html).
- [**Recuperar**](screens/SC-024-forgot-password/README.md) (umbral): la cuenta con todo adentro vuelve con un link al mail; [boceto](screens/SC-024-forgot-password/sketch.html).
- [**Error**](screens/SC-023-error/README.md) (pública): qué pasó, qué hacer, y que lo tuyo no se perdió; [boceto](screens/SC-023-error/sketch.html).

Esta épica aporta a pantallas de otras: nada. Al revés sí: [Reseñar](../write-a-review/README.md), [Cuidar lo publicado](../care-for-what-is-published/README.md), [Responder](../../reviewed/reply/README.md) y [Pedir una carrera](../request-a-career/README.md) disparan el umbral desde sus acciones, y cada uno lo dice en su README.

## Lo que esta épica todavía no resuelve

- **Si hay ingreso con proveedor externo** (Google, institucional): ninguna fuente lo decide, y el mail institucional como verificación está deprecado por ADR-0048.
- **Cuánto dura el link de Recuperar**, y si pedirlo muchas veces tiene límite.
- **Si Error distingue 404 de 500** en el copy.
