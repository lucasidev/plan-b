# El ático

Lo que describía la versión anterior del producto (el planificador de cuatrimestre con reseñas de texto), retirada por [ADR-0063](../decisions/0063-the-product-is-a-pressure-instrument.md). Está acá y no en `docs/domain/` porque quien entra a construir el producto de hoy tiene que encontrar solo lo vigente; y está acá y no borrado porque el código que estos docs describen todavía existe (la poda se planifica en [STATUS.md](../STATUS.md)) y porque las fichas de las stories hechas los referencian.

Reglas: **no se edita** (es historia); **se borra con el código que describe**, en el mismo PR de la poda; los links entrantes se corrigen cuando algo se mueve, nunca al revés.

| Carpeta | Qué hay | Vigente hasta |
|---|---|---|
| [`domain-v1/`](domain-v1/) | Actores y casos de uso (49 UC), ciclos de vida de enrollment y review, event storming, process modeling, contextos y agregados (strategic, tactical), las épicas EPIC-00 a EPIC-11 y el glosario de la versión anterior | la poda del planificador y de la reseña de texto libre |

Lo que sigue vivo de la versión anterior no está acá: las 126 fichas `US-NNN` siguen en [`docs/domain/user-stories/`](../domain/user-stories/) (son la evidencia del trabajo hecho y el mismo lugar donde entran las nuevas), la historia del diseño en [`docs/design/`](../design/), y las decisiones en [`docs/decisions/`](../decisions/) con su `Estado`.
