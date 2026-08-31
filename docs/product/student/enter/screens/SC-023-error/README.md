# Error (la pantalla)

> Ficha de pantalla, dueña: la épica [Entrar](../../README.md). **Estado**: borrador escrito el 2026-08-19 con su [boceto mid-fi](sketch.html); revisada el 2026-08-19 ([registro](../../../../../history/reviews/2026-08-19-shared-screens.md)); hi-fi pendiente. Pública, se lee sin cuenta. Sin slug (aparece donde haga falta, no tiene ruta propia). Épicas que la componen: ninguna. Es el chasis que sostiene a todas las demás cuando algo falla, y por eso vive en Entrar.

## Quién la usa

Cualquiera, en cualquier punto: quien lee sin cuenta y una ficha no carga, o quien está reseñando y se corta a mitad de camino (**Lucía**, **Matías**, **Diego**).

## Qué stories resuelve

[US-161](../../../write-a-review/README.md#stories) (lo que quedó a medias se guarda y se retoma; nada de lo que estabas escribiendo se pierde).

- [US-230](../../stories/US-230-understand-the-failure-without-losing-my-work/README.md): el mensaje sin jerga, las dos salidas y el link para retomar.

## Qué muestra

- **Qué pasó**: "No pudimos cargar esto", sin jerga técnica ni código de error a la vista.
- **Qué hacer**: probá de nuevo, o volvé a Explorar.
- **Si estabas reseñando**: lo que ya contestaste se guardó solo; un link para retomarlo (US-161).

## Estados

No diferenciados hoy: el mismo mensaje genérico cubre cualquier falla. Si conviene distinguir 404 de 500 en el copy es lo que esta ficha deja abierto (ver más abajo).

## Lo que no muestra nunca

Ningún stack trace, código HTTP ni jerga técnica; ninguna culpa al usuario ("hiciste algo mal").

## Adónde va

Aparece donde haga falta, en cualquier pantalla que no pueda cargar: no llega desde un lugar fijo. Va a: [Explorar](../../../choose-where-to-study/screens/SC-003-explore/README.md), [La entrada](../../../choose-where-to-study/screens/SC-004-entrance/README.md), o donde se retoma lo que quedó a medias.

## Decisiones que aplica

Ninguna decisión nombra esta pantalla en particular: se apoya en US-161 ([write-a-review](../../../write-a-review/README.md#stories), "nada se pierde") y en la restricción de rendimiento y disponibilidad de las [Restricciones del catálogo](../../../../README.md) ("una caída de lo público es una caída del producto").

## Lo que esta ficha deja abierto

- **Si distingue 404 de 500 en el copy.**
