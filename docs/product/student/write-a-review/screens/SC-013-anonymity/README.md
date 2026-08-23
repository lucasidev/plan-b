# Anonimato (la pantalla)

> Ficha de pantalla, dueña: la épica [Reseñar](../../README.md). **Estado**: borrador escrito el 2026-08-19 con su [boceto mid-fi](sketch.html) de la página de lectura; revisada el 2026-08-19 ([registro](../../../../../history/reviews/2026-08-19-shared-screens.md)); hi-fi pendiente. Pública, se lee sin cuenta. Slug hoy `/about` (hoy habla de otra cosa, se rehace). Épicas que la componen: [Reseñar](../../README.md) (la posición sobre el anonimato, dicha antes de escribir), [Moderar sin romper el producto](../../../../team/moderate-without-breaking-the-product/README.md) (la política pública de moderación y réplica).

## Quién la usa

Quien está por reseñar y duda si conviene contar algo incómodo (**Matías**, **Lucía**), **Claudia** y **Paredes** (quieren saber qué protege a quien reseña y qué no los expone a ellos, nombrados en su rol), y quien piensa en reportar algo que leyó.

## Qué stories resuelve

[US-148](../../README.md#stories) (qué se publica de una reseña y qué no), [US-158](../../README.md#stories) (el chequeo previo con sus dos salidas), [US-159](../../README.md#stories) (el aviso de la sospecha en grupo chico), [US-179](../../../../reviewed/reply/README.md#stories) (la réplica no cita lo marcado), [US-205](../../../../team/moderate-without-breaking-the-product/README.md#stories) (qué se modera y qué no es causal), [US-218](../../../../team/cut-the-access/README.md#stories) (el registro público en agregado).

## Qué muestra

Es una página de lectura, sin pasos ni formulario: los bloques que explican la posición, en las palabras de la tesis.

1. **Qué se publica de una reseña y qué no** (US-148): el período, la cátedra si la dio, las frases que marcó y el comentario si escribió uno; nunca el nombre, la cuenta, el rol ni cómo terminó.
2. **El chequeo previo** (US-158): antes de publicar, lo que puede identificar por contexto se marca y decide quien escribió, sabiendo que la réplica no va a poder citar esa parte; lo que habla de una persona fuera de su acto público queda retenido hasta que alguien lo mire.
3. **La verdad sobre el grupo chico** (US-159): no prometemos anonimato estadístico, prometemos no publicar quién. En una comisión chica pueden sospechar: es el precio de reclamar, y se dice antes de publicar, no después.
4. **Qué se modera y qué no** (US-205): se modera la exposición de quien aportó y de terceros; la queja dura contra la cátedra o la institución no es causal.
5. **Que nada baja solo**: lo reportado sigue publicado hasta que una persona lo resuelve, salvo el único caso de riesgo inmediato con criterio escrito; se baja el texto, nunca la voz.
6. **La réplica y sus reglas** (US-179): pasa el mismo chequeo que el aporte, no puede citar lo que el autor marcó como identificante, y espera un plazo desde el aviso antes de publicarse.
7. **El registro público en agregado** (US-218): cuántos textos se bajaron y cuántos quedaron retenidos, por categoría, sin su contenido.

## Estados

No tiene. Es una página de lectura fija, no un formulario ni un recorrido.

## Lo que no muestra nunca

El nombre, la cuenta, el rol ni cómo terminó de quien reseñó (US-148); el contenido de un texto bajado o retenido (el registro es agregado, sin texto, US-218); ninguna promesa de anonimato estadístico (US-159 la niega explícitamente).

## Adónde va

Llega desde: un link en cualquier ficha ("cómo te cubrimos"), y el mismo aviso dicho de nuevo en el paso del comentario de [Reseñar](../SC-015-write-review/README.md). Va a: [Reseñar](../SC-015-write-review/README.md) (con cuenta); no tiene ninguna acción propia. Tiene que existir desde antes de que exista el primer reporte: las Restricciones del catálogo la exigen pública desde ese momento.

## Decisiones que aplica

[ADR-0068](../../../../../decisions/0068-comment-publishes-as-testimony-below-the-phrases.md) (puntos 2 a 5: el chequeo previo, la exposición que se modera, se baja el texto nunca la voz, la réplica con las mismas reglas), [ADR-0009](../../../../../decisions/0009-review-anonymity-is-a-presentation-rule.md) (el anonimato es de presentación: la identidad se preserva siempre por dentro y nunca se expone en público), [THESIS.md](../../../../../THESIS.md) ("Posición tomada"). Las [Restricciones del catálogo](../../../../README.md) exigen esta política pública antes de que exista el primer reporte.

## Lo que esta ficha deja abierto

- **Si el agregado de moderación** (US-218) **se publica acá o en Método**: pregunta abierta en las dos épicas que lo mencionan.
- **El texto exacto del criterio escrito de "riesgo inmediato"**: [Moderar sin romper el producto](../../../../team/moderate-without-breaking-the-product/README.md) todavía no lo redactó, y esta página necesita citarlo.
