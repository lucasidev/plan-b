# Equipo (la pantalla)

> Ficha de pantalla, dueña: la épica [Cortar los accesos](../../README.md). **Estado**: borrador escrito el 2026-08-19 con su [boceto mid-fi](sketch.html) de las altas, los roles y la baja; revisada el 2026-08-19 ([registro](../../../../reviews/2026-08-19-epics-and-screens.md)); hi-fi pendiente. Backoffice, rol Admin (el único que entra). Sin slug hoy.

## Quién la usa

**Admin** (accesos: roles cortados por lo que no ven, y registro de quién hizo qué; la baja del que se va). Nadie más: administrar accesos es la única cola que el Admin opera, y no se auto-asigna ningún rol operativo (catálogo, curaduría de frases, moderación, verificación).

## Qué stories resuelve

BO3-1 (cada rol ve solo sus colas, ni por acceso directo), BO3-2 (cada acción sobre una cola queda con autor y fecha), BO3-3 (moderación y verificación no conviven; el Admin no se auto-asigna roles operativos), BO6-1 (el registro se revisa: la primera capa pública en agregado, la segunda capa es un lector externo, decisión de gobierno), BO6-2 (la baja corta el acceso en el momento; el registro de lo que hizo esa persona queda). La letra completa: [README de la épica](../../README.md#stories).

## Qué muestra

- **El equipo**: una fila por persona, con su rol (catálogo, curaduría de frases, moderación, verificación, o Admin) y desde cuándo. Sofía en catálogo, Nahuel en moderación, Camila en verificación; curaduría de frases sin nadie asignado todavía, porque ninguna fuente dice si es un rol aparte del de Sofía.
- **Dar de alta**: mail y un rol para elegir. El propio Admin no aparece como destino de ningún rol operativo.
- **Cada rol, sus colas**: qué ve cada uno (catálogo entra a Pedidos, Catálogo, Correcciones y Frases; moderación a Reportes; verificación a Verificaciones) y qué no: ninguno llega a la cola de otro, ni por URL directa (BO3-1).
- **El registro**: quién hizo qué, con autor y fecha, en las cuatro colas operativas; las referencias que guarda están armadas para que ningún rol, actuando solo, pueda reconstruir un cruce (BO3-2, BO3-3).
- **El registro público**: la primera capa, construible ahora, en agregado y sin contenido (cuántos textos se bajaron, cuántos quedaron retenidos, por categoría). La segunda capa, una persona externa leyendo el registro ya disociado, es una decisión de gobierno y esta pantalla no la resuelve (BO6-1).

## Estados

- **Intento de asignar un rol que choca**: moderación a quien ya tiene verificación (o al revés), o el Admin pidiéndose un rol operativo; la propia pantalla lo hace imposible, no algo que se audita después (BO3-3).
- **Baja**: se corta el acceso en el momento; el registro de lo que esa persona hizo mientras estuvo no se borra (BO6-2).

## Lo que no muestra nunca

- Un botón que permita asignar moderación y verificación a la misma persona, ni con permiso especial.
- Al Admin como destino de un rol operativo propio.
- El contenido de lo moderado o verificado: el registro que se publica es agregado, sin texto ni nombres.
- Un cruce armado desde una sola cola: cada rol ve las referencias que le tocan, no las de otro.

## Adónde va

Llega desde que alguien se suma o se va del equipo, o desde que hace falta revisar el registro. Va a: la cola que el rol recién asignado puede operar (Pedidos, Catálogo, Correcciones y Frases en [Sostener el catálogo](../../../sustain-the-catalog/README.md); Reportes y Verificaciones en [Moderar sin romper el producto](../../../moderate-without-breaking-the-product/README.md)); y, para la segunda capa del registro, a quien sea el lector externo, fuera del producto.

## Decisiones que aplica

D09 ([registro del 17](../../../../reviews/2026-08-17-catalog-propagation.md): roles excluyentes, el Admin no se auto-asigna operativos, equipo mínimo de cuatro), [THESIS.md](../../../../THESIS.md) ("Posición": el anonimato es mecanismo, no declaración), [ADR-0050](../../../../decisions/0050-backoffice-como-corte-transversal.md) (el gating es por rol en cada endpoint, no por estar en un módulo aparte: la base de que cada rol vea solo sus colas).

## Lo que esta ficha deja abierto

- **Si "curar las frases" es un rol aparte o parte de catálogo**: el boceto lo muestra sin nadie asignado porque ninguna fuente lo cierra.
- **Cómo se cubre la cola de verificación si Camila está de vacaciones**, sin violar la exclusión de BO3-3.
- **Si el Admin puede leer las colas sin operarlas**: BO3-1 dice que cada rol ve solo las suyas y no dice qué ve el Admin.
- **Qué pasa con una acción a medio hacer cuando a alguien se le corta el acceso en el momento.**
- **Cada cuánto se revisa el registro** y quién es el lector externo: "cada tanto" no es una cadencia (BO6-1).
