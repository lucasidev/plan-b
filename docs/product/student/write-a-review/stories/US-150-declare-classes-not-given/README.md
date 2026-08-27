# US-150: Declarar que faltaron clases

> **Concepto rebasado el 2026-08-25**: [ADR-0082](../../../../../decisions/0082-the-review-captures-the-cursada-in-three-layers.md) rechaza explícitamente los ítems contables finos ("cuántas clases exactas"): la memoria no da esa precisión y el dato que parece duro es ruido. La declaración numérica y la publicación de mediana y rango de esta story ya no existen; sobreviven solo como frecuencia gruesa dentro del ítem "¿Se dictaron las clases?" (Casi todas · Faltaron algunas · **Faltaron muchas**).

**Épica**: [Reseñar](../../README.md)
**Del mapa**: O4-6

## Historia

Como quien está cursando, quería decir cuántas clases no se dieron y que el número quedara publicado, porque es el dato que la facultad no publica y el que más pesa cuando reclamo, y el reclamo interno no fue a ningún lado.

## Listo cuando

- Ya no hay pregunta de seguimiento ni número que declarar: [ADR-0082](../../../../../decisions/0082-the-review-captures-the-cursada-in-three-layers.md) deja un solo ítem, "¿Se dictaron las clases?", con tres opciones de frecuencia gruesa (Casi todas · Faltaron algunas · Faltaron muchas), sin mediana ni rango publicados.
- Lo que sí queda: "Faltaron muchas" es la opción negativa, la única que carga el rojo en la ficha, y entra a la moda y la distribución del ítem como cualquier otro ([ADR-0083](../../../../../decisions/0083-the-ficha-publishes-counts-not-scores.md)).

## Dónde se resuelve

- [Reseñar](../../screens/SC-015-write-review/README.md): el paso 4 (Qué hizo la cátedra) ofrece el ítem "¿Se dictaron las clases?" con sus tres opciones; no hay paso siguiente que pida una cantidad.
- [Ficha de cátedra](../../../choose-where-to-study/screens/SC-002-chair/README.md): publica la moda y la distribución de ese ítem como cualquier otro; esa ficha hoy todavía describe el modelo anterior (mediana y rango), pendiente de su propia reescritura.

## Notas

Story rebasada por [ADR-0082](../../../../../decisions/0082-the-review-captures-the-cursada-in-three-layers.md); se conserva por su ID y para que quede registro de la necesidad que la originó.
