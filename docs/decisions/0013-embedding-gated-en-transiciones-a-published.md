# ADR-0013: Generación de embedding gated en transiciones a `published`

- **Estado**: aceptado
- **Fecha**: 2026-04-23

## Contexto

Según [ADR-0007](0007-pgvector-implementado-ui-gated-off.md), el pipeline de generación de embeddings corre desde día 1, aunque la feature UI que los usa está gated off hasta tener volumen de reseñas.

La pregunta de este ADR: **¿en qué momento del ciclo de vida de una reseña se encola el job de generación?**

Los estados posibles de `Review.status` son `published`, `under_review`, y `removed`. Las transiciones entre ellos están en [review-lifecycle.md](../domain/review-lifecycle.md). Una reseña puede pasar por `under_review` (retenida por filtro o por threshold de reports) y eventualmente ser removida: en cuyo caso gastar compute en embebber su contenido es desperdicio.

## Decisión

El job de generación de embedding se encola **únicamente** en las transiciones que dejan la reseña en `published`:

| Transición | Acción |
|---|---|
| `null → published` (publicación con filtro pass) | Enqueue embedding. |
| `null → under_review` (publicación retenida) | **No** enqueue. |
| `under_review → published` (dismiss de reports) | Enqueue si no existía previamente. |
| `under_review → removed` (uphold) | **No** enqueue. |
| `published → removed` (uphold directo) | **No** enqueue (si existía uno previo, queda persistido pero sin uso público; se marca como obsoleto opcionalmente). |
| `removed → published` (restore) | Enqueue si no existía. |
| `published → published` con edit de contenido (UC-018) | Re-enqueue sobre el nuevo texto (reemplaza el embedding anterior para el mismo `model_name + model_version`). |

## Alternativas consideradas

### A. Enqueue en cualquier INSERT de Review

Simpler de implementar: un trigger o hook en el create. Descartada porque:

- Gasta compute en reseñas retenidas por filtro que pueden ser removidas.
- Aunque el costo por embedding es bajo (el modelo corre local y tarda menos de un segundo), escala mal si hay un spike de reseñas retenidas.
- Produce embeddings "fantasma" de contenido que nunca fue público. Si alguna vez se usan para analytics internos, contaminan el dataset.

### B. Enqueue basado en content hash sin importar status

Calcular hash del contenido, deduplicar por hash. Si el contenido cambia, re-enqueue. Descartada porque la deduplicación a nivel de contenido no resuelve el problema de status: una reseña con contenido idéntico a otra aprobada pero en estado `removed` igualmente se debería excluir. El status es la señal correcta, no el hash.

### C. Enqueue lazy solo cuando se consulta el embedding

El embedding se genera on-demand cuando alguna query de búsqueda semántica lo pide. Descartada por la UX: la query se bloquea esperando la generación. Además, en el MVP la feature UI está gated off: no hay queries aún, por lo que nunca se dispararía la generación.

## Consecuencias

**Positivas:**

- Cero compute gastado en contenido que termina removido.
- Los embeddings en la DB representan contenido que fue público (al menos en algún momento), lo cual es la propiedad correcta para el feature de analytics.
- El pipeline es robusto frente a cambios de moderación: una reseña restaurada gana su embedding; una removida no lo tiene.

**Negativas:**

- Hay un pequeño delay entre que una reseña pasa de `under_review` a `published` (por dismiss) y el momento en que su embedding está disponible. En MVP ese delay es invisible porque la feature UI está gated off.
- La lógica de "cuándo enqueuar" vive en el servicio de moderación y en el de publicación: requiere tests que cubran todas las transiciones para no perder una.

**Referencias:**

- Pipeline de embeddings descripto en [ADR-0007](0007-pgvector-implementado-ui-gated-off.md).
- Transiciones de estado detalladas en [review-lifecycle.md](../domain/review-lifecycle.md).
