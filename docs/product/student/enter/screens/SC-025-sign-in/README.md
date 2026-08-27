# Ingresar (la pantalla)

> Ficha de pantalla, dueña: la épica [Entrar](../../README.md). **Estado**: borrador escrito el 2026-08-19 con su [boceto mid-fi](sketch.html) del umbral, con el motivo a la vista y sus estados; revisada el 2026-08-19 ([registro](../../../../../history/reviews/2026-08-19-shared-screens.md)); hi-fi pendiente. Pública: se llega y se ve sin cuenta, y es la puerta hacia una (el gate está en la acción que te trajo, nunca en la lectura). Slug hoy `/sign-in`. Épicas que la componen: [Que no me molesten](../../../../guarantees/README.md) (la garantía: el gate en la acción, no en la puerta), [Reseñar](../../../write-a-review/README.md) (reseñar dispara el gate y trae hasta acá), [Cuidar lo publicado](../../../care-for-what-is-published/README.md) (corregir un dato también lo dispara).

## Quién la usa

Quien ya tiene cuenta y vuelve a producir: **Matías** (a que quede registrado lo que vivió), **Lucía** y **Diego** (a reseñar), **Claudia** (a responder). No la usa quien solo lee (Valentina, Silvia, Rocío): ninguna pantalla de lectura pide cuenta (US-168).

## Qué stories resuelve

[US-168](../../../../guarantees/README.md#stories) (dueña de la garantía que esta pantalla cumple: ninguna pantalla de lectura tiene login; el gate llega con la acción, nunca con la puerta). Las acciones que disparan el gate tienen su propia letra en su propia épica, no en esta ficha: reseñar ([US-146](../../../write-a-review/README.md#stories), Reseñar), corregir un dato ([US-189](../../../care-for-what-is-published/README.md#stories), Cuidar lo publicado) y responder ([US-172](../../../../reviewed/reply/README.md#stories), Responder).

- [US-229](../../stories/US-229-sign-in-and-land-back-on-what-i-was-doing/README.md): el motivo, el formulario y el estado de credenciales que no coinciden.
- [US-220](../../stories/US-220-recover-the-password-by-mail/README.md): desde acá se llega a Recuperar cuando la contraseña no entra.

## Qué muestra

- **El motivo, arriba, cuando lo hay**: si veniste disparando una acción, la pantalla lo dice con esas palabras ("para reseñar Análisis Matemático II, necesitás una cuenta"). Si llegaste directo, sin ninguna acción pendiente, no hay motivo: es solo el formulario.
- **El formulario**: mail y contraseña, un botón para ingresar.
- **Los dos links**: a Registro ("¿no tenés cuenta?") y a Recuperar ("¿olvidaste tu contraseña?").
- **Al entrar**: la sesión se abre y la pantalla vuelve a donde estabas, completando la acción que te trajo; si no había ninguna, vuelve al lugar por defecto.

## Estados

**Estado "credenciales malas"**: un aviso de que el mail o la contraseña no coinciden, sin borrar lo que ya escribiste.

## Lo que no muestra nunca

Ninguna promesa de más funciones (no es una vidriera de lo que el producto hace); ningún dato de otra cuenta; ninguna pregunta de trayectoria o de rol (eso es Registro, y se declara una sola vez: US-169).

## Adónde va

Llega desde: cualquier acción con cuenta que se dispara sin tenerla (reseñar, corregir un dato, responder), y directo por el link del umbral. Va a: donde estabas, con la acción retomada; o a Registro y Recuperar si todavía no tenés cuenta o la olvidaste.

## Decisiones que aplica

[THESIS.md](../../../../../THESIS.md) (decisión 3: leer no pide cuenta, producir sí; el gate está en la acción, no en la puerta), [Que no me molesten](../../../../guarantees/README.md) (el checklist de las cuatro garantías, y cómo se verifica en cada ficha nueva).

## Lo que esta ficha deja abierto

- **Si hay ingreso con proveedor externo** (Google, cuenta institucional): ninguna fuente lo fija.
- **El copy exacto de cada motivo**: la ficha da el patrón ("para <acción>, necesitás una cuenta"); el texto final de cada acción se escribe con la pantalla que lo dispara.
