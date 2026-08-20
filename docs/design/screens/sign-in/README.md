# Ingresar (la pantalla)

> Ficha de pantalla compartida ([inventario](../README.md)). **Estado**: borrador escrito el 2026-08-19 con su [boceto mid-fi](sketch.html) del umbral, con el motivo a la vista y sus estados; revisada el 2026-08-19 ([registro](../../../reviews/2026-08-19-shared-screens.md)); hi-fi pendiente. Pública: se llega y se ve sin cuenta, y es la puerta hacia una (el gate está en la acción que te trajo, nunca en la lectura). Slug hoy `/sign-in` (del inventario). Épicas que la componen: [Que no me molesten](../../../epics/do-not-bother-me/README.md) (la garantía: el gate en la acción, no en la puerta), [Reseñar](../../../epics/write-a-review/README.md) (reseñar dispara el gate y trae hasta acá), [Cuidar lo publicado](../../../epics/care-for-what-is-published/README.md) (votar y corregir también lo disparan).

## Quién la usa

Quien ya tiene cuenta y vuelve a producir: **Matías** (a votar, o a que quede registrado), **Lucía** y **Diego** (a reseñar), **Claudia** (a responder). No la usa quien solo lee (Valentina, Silvia, Rocío): ninguna pantalla de lectura pide cuenta (O6-1).

## Qué stories resuelve

[O6-1](../../../epics/do-not-bother-me/README.md#stories) (dueña de la garantía que esta pantalla cumple: ninguna pantalla de lectura tiene login; el gate llega con la acción, nunca con la puerta). Las acciones que disparan el gate tienen su propia letra en su propia épica, no en esta ficha: votar y corregir ([T1-1](../../../epics/care-for-what-is-published/README.md#stories), [T1-2](../../../epics/care-for-what-is-published/README.md#stories), Cuidar lo publicado), reseñar ([O4-1](../../../epics/write-a-review/README.md#stories), Reseñar), responder ([O7-1](../../../epics/reply/README.md#stories), Replicar).

## Qué muestra

- **El motivo, arriba, cuando lo hay**: si veniste disparando una acción, la pantalla lo dice con esas palabras ("para votar esta reseña, necesitás una cuenta"; "para reseñar Análisis Matemático II, necesitás una cuenta"). Si llegaste directo, sin ninguna acción pendiente, no hay motivo: es solo el formulario.
- **El formulario**: mail y contraseña, un botón para ingresar.
- **Los dos links**: a Registro ("¿no tenés cuenta?") y a Recuperar ("¿olvidaste tu contraseña?").
- **Al entrar**: la sesión se abre y la pantalla vuelve a donde estabas, completando la acción que te trajo; si no había ninguna, vuelve al lugar por defecto.

**Estado "credenciales malas"**: un aviso de que el mail o la contraseña no coinciden, sin borrar lo que ya escribiste.

## Lo que no muestra nunca

Ninguna promesa de más funciones (no es una vidriera de lo que el producto hace); ningún dato de otra cuenta; ninguna pregunta de trayectoria o de rol (eso es Registro, y se declara una sola vez: O6-2).

## Adónde va

Llega desde: cualquier acción con cuenta que se dispara sin tenerla (votar, reseñar, corregir, responder), y directo por el link del umbral. Va a: donde estabas, con la acción retomada; o a Registro y Recuperar si todavía no tenés cuenta o la olvidaste.

## Decisiones que aplica

[THESIS.md](../../../THESIS.md) (decisión 3: leer no pide cuenta, producir sí; el gate está en la acción, no en la puerta), [Que no me molesten](../../../epics/do-not-bother-me/README.md) (el checklist de las cuatro garantías, y cómo se verifica en cada ficha nueva).

## Lo que esta ficha deja abierto

- **Si hay ingreso con proveedor externo** (Google, cuenta institucional): ninguna fuente lo fija.
- **El copy exacto de cada motivo**: la ficha da el patrón ("para <acción>, necesitás una cuenta"); el texto final de cada acción se escribe con la pantalla que lo dispara.
