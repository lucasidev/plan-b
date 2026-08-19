# Error (la pantalla)

> Ficha de pantalla compartida ([inventario](../README.md)). **Estado**: borrador escrito el 2026-08-19 con su [boceto mid-fi](sketch.html); revisión adversarial pendiente antes del hi-fi. Pública, se lee sin cuenta. Sin slug (aparece donde haga falta, no tiene ruta propia). Épicas que la componen: ninguna; el inventario la marca transversal.

## Quién la usa

Cualquiera, en cualquier punto: quien lee sin cuenta y una ficha no carga, o quien está reseñando y se corta a mitad de camino (**Lucía**, **Matías**, **Diego**).

## Qué stories resuelve

[T3-3](../../../epics/write-a-review/README.md#stories) (lo que quedó a medias se guarda y se retoma; nada de lo que estabas escribiendo se pierde).

## Qué muestra

- **Qué pasó**: "No pudimos cargar esto", sin jerga técnica ni código de error a la vista.
- **Qué hacer**: probá de nuevo, o volvé a Explorar.
- **Si estabas reseñando**: lo que ya contestaste se guardó solo; un link para retomarlo (T3-3).

## Lo que no muestra nunca

Ningún stack trace, código HTTP ni jerga técnica; ninguna culpa al usuario ("hiciste algo mal").

## Adónde va

Aparece donde haga falta, en cualquier pantalla que no pueda cargar: no llega desde un lugar fijo. Va a: [Explorar](../explore/README.md), [Inicio](../home/README.md), o donde se retoma lo que quedó a medias.

## Decisiones que aplica

Ninguna decisión nombra esta pantalla en particular: se apoya en T3-3 ([write-a-review](../../../epics/write-a-review/README.md#stories), "nada se pierde") y en la restricción de rendimiento y disponibilidad de las [Restricciones del catálogo](../../../domain/user-stories.md#restricciones-no-son-stories-se-verifican-en-el-dod) ("una caída de lo público es una caída del producto").

## Lo que esta ficha deja abierto

- **Si distingue 404 de 500 en el copy.**
