# Cuidar lo publicado

> Épica del grupo **T1 · Cuidar lo publicado (curación, no opinión)** del [catálogo](../../domain/user-stories.md). **Estado**: borrador escrito el 2026-08-19 (README y [flujo](flow.md)), sin pantallas propias; revisión adversarial pendiente antes de planificar. Sin sprint asignado.

## Qué es

Lo que pasa después de publicar, sin que nadie tenga que escribir de nuevo: sumar una voz a lo que otro ya contó, arreglar un dato duro que quedó mal cargado, y pesar más si probás tu condición de alumno. Las tres son acciones inline, adentro de la ficha, y ninguna es opinión sobre lo publicado: son curación. Votar no discute la frase, la confirma; corregir no discute un juicio, arregla un dato; verificarse no habilita nada, solo suma una señal que viaja con lo que ya se contó. Es lo que hace cierto que "lo que más gente confirmó se lea primero", y que una ficha no siga mintiendo sobre un dato duro solo porque nadie volvió a mirarlo.

## Para quién

**Matías** (ya aportó y quiere sumar su voz a lo que otro escribió, sin escribir de nuevo), quien vuelve con cuenta y encuentra un dato duro mal cargado (no hace falta haber aportado antes: D07), quien lee los testimonios y confía más en el que más gente confirmó, y quien ya aportó y quiere que lo suyo pese más probando su condición de alumno, sin que eso sea la puerta de entrada para hablar.

## Stories

Las de esta épica, con su letra completa: es la única copia de cada una (el [catálogo](../../domain/user-stories.md) es el índice por ID). Al entrar a sprint, la ficha `US-NNN` amplía la fila, no la reemplaza.

| ID | Story | Listo cuando | Notas |
|---|---|---|---|
| T1-1 | Como quien ya aportó, quiero decir "a mí también me pasó" sobre lo que otro contó, para sumar mi voz sin escribir y que lo que más gente confirmó se lea primero. | El voto va sobre la reseña o el evento institucional entero, nunca sobre una frase suelta; suma una voz a las frases de esa reseña, ordena los testimonios de la ficha, y pide cuenta. |  |
| T1-2 | Como quien vuelve, quiero corregir un dato duro sin cambiar de pantalla, para que la ficha no mienta sobre mi facultad. | La fila del dato se vuelve editable ahí mismo con cuenta, sin haber aportado antes, y queda registrado quién lo cambió (D07, [registro del 17](../../reviews/2026-08-17-catalog-propagation.md)). |  |
| T1-3 | Como quien ya aportó, quiero verificarme si quiero, para que lo mío pese más, sin que sea condición para hablar. | Se puede aportar sin verificar; verificarse suma una señal que viaja con lo ya contado y se ve en la ficha, y no cambia ninguna proporción: las voces se cuentan igual, verificadas o no. |  |

## Decisiones que aplica

[ADR-0068](../../decisions/0068-comment-publishes-as-testimony-below-the-phrases.md) (puntos 1 y 6: el testimonio debajo de las frases, ordenado por votos; votar pide cuenta), D07 ([registro del 17](../../reviews/2026-08-17-catalog-propagation.md): corregir pide cuenta, no aporte previo, y queda registrado quién), [ADR-0048](../../decisions/0048-oficializacion-de-condicion-opt-in.md) (aceptado y extendido por [ADR-0063](../../decisions/0063-the-product-is-a-pressure-instrument.md): verificarse es señal, no permiso), [ADR-0065](../../decisions/0065-attribution-is-the-axis-not-a-split.md) (cada frase marcada en el testimonio trae su eje: la que alarma es gestión, la que informa es exigencia).

## Pantallas

Esta épica no tiene pantallas propias: sus tres acciones pasan adentro de pantallas que viven en otro lado. Las que comparte viven en [`docs/design/screens/`](../../design/screens/README.md): las acciones inline **Votar** y **Corregir** (adentro de la ficha, sin cambiar de pantalla), **Verificar** (la constancia de alumno; hoy la pantalla existe solo para docentes), la [Ficha de cátedra](../../design/screens/chair/README.md) y la Ficha de materia (los testimonios ordenados por votos); en el backoffice, **Correcciones** (dueña [Sostener el catálogo](../sustain-the-catalog/README.md)) y **Verificaciones** (dueña [Moderar sin romper el producto](../moderate-without-breaking-the-product/README.md)).

## Lo que esta épica todavía no resuelve

- **Cómo se ve la señal de verificado en la ficha sin identificar a nadie**: qué muestra ("12 de 20 voces verificadas"? un ícono al lado del testimonio?) es una pregunta, no una decisión.
- **Si el voto se puede retirar** una vez puesto.
- **Qué datos duros son editables inline y cuáles no** (correlativas, duración nominal, nombre de cátedra), y cuáles quedan reservados al catálogo.
- **Si una cuenta puede votar su propia reseña**: ni T1-1 ni ADR-0068 lo dicen.
