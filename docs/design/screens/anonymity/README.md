# Anonimato (la pantalla)

> Ficha de pantalla compartida ([inventario](../README.md)). **Estado**: borrador escrito el 2026-08-19 con su [boceto mid-fi](sketch.html) de la página de lectura; revisión adversarial pendiente antes del hi-fi. Pública, se lee sin cuenta. Slug hoy `/about` (del inventario: hoy habla de otra cosa, se rehace). Épicas que la componen: [Reseñar](../../../epics/write-a-review/README.md) (la posición sobre el anonimato, dicha antes de escribir), [Moderar sin romper el producto](../../../epics/moderate-without-breaking-the-product/README.md) (la política pública de moderación y réplica).

## Quién la usa

Quien está por reseñar y duda si conviene contar algo incómodo (**Matías**, **Lucía**), **Claudia** y **Paredes** (quieren saber qué protege a quien reseña y qué no los expone a ellos, nombrados en su rol), y quien piensa en reportar algo que leyó.

## Qué stories resuelve

[O4-4](../../../epics/write-a-review/README.md#stories) (qué se publica de una reseña y qué no), [T2-1](../../../epics/write-a-review/README.md#stories) (el chequeo previo con sus dos salidas), [T2-4](../../../epics/write-a-review/README.md#stories) (el aviso de la sospecha en grupo chico), [T2-2](../../../epics/reply/README.md#stories) (la réplica no cita lo marcado), [BO2-1](../../../epics/moderate-without-breaking-the-product/README.md#stories) (qué se modera y qué no es causal), [BO6-1](../../../epics/cut-the-access/README.md#stories) (el registro público en agregado).

## Qué muestra

Es una página de lectura, sin pasos ni formulario: los bloques que explican la posición, en las palabras de la tesis.

1. **Qué se publica de una reseña y qué no** (O4-4): el período, la cátedra si la dio, las frases que marcó y el comentario si escribió uno; nunca el nombre, la cuenta, el rol ni cómo terminó.
2. **El chequeo previo** (T2-1): antes de publicar, lo que puede identificar por contexto se marca y decide quien escribió, sabiendo que la réplica no va a poder citar esa parte; lo que habla de una persona fuera de su acto público queda retenido hasta que alguien lo mire.
3. **La verdad sobre el grupo chico** (T2-4): no prometemos anonimato estadístico, prometemos no publicar quién. En una comisión chica pueden sospechar: es el precio de reclamar, y se dice antes de publicar, no después.
4. **Qué se modera y qué no** (BO2-1): se modera la exposición de quien aportó y de terceros; la queja dura contra la cátedra o la institución no es causal.
5. **Que nada baja solo**: lo reportado sigue publicado hasta que una persona lo resuelve, salvo el único caso de riesgo inmediato con criterio escrito; se baja el texto, nunca la voz.
6. **La réplica y sus reglas** (T2-2): pasa el mismo chequeo que el aporte, no puede citar lo que el autor marcó como identificante, y espera un plazo desde el aviso antes de publicarse.
7. **El registro público en agregado** (BO6-1): cuántos textos se bajaron y cuántos quedaron retenidos, por categoría, sin su contenido.

**Estados**: no tiene. Es una página de lectura fija, no un formulario ni un recorrido.

## Lo que no muestra nunca

El nombre, la cuenta, el rol ni cómo terminó de quien reseñó (O4-4); el contenido de un texto bajado o retenido (el registro es agregado, sin texto, BO6-1); ninguna promesa de anonimato estadístico (T2-4 la niega explícitamente).

## Adónde va

Llega desde: un link en cualquier ficha ("cómo te cubrimos"), y el mismo aviso dicho de nuevo en el paso del comentario de [Reseñar](../../../epics/write-a-review/screens/write-review/README.md). Va a: [Reseñar](../../../epics/write-a-review/screens/write-review/README.md) (con cuenta); no tiene ninguna acción propia. Tiene que existir desde antes de que exista el primer reporte: las Restricciones del catálogo la exigen pública desde ese momento.

## Decisiones que aplica

[ADR-0068](../../../decisions/0068-comment-publishes-as-testimony-below-the-phrases.md) (puntos 2 a 5: el chequeo previo, la exposición que se modera, se baja el texto nunca la voz, la réplica con las mismas reglas), [ADR-0009](../../../decisions/0009-anonimato-como-regla-de-presentacion.md) (el anonimato es de presentación: la identidad se preserva siempre por dentro y nunca se expone en público), [THESIS.md](../../../THESIS.md) ("Posición tomada"). Las [Restricciones del catálogo](../../../domain/user-stories.md#restricciones-no-son-stories-se-verifican-en-el-dod) exigen esta política pública antes de que exista el primer reporte.

## Lo que esta ficha deja abierto

- **Si el agregado de moderación** (BO6-1) **se publica acá o en Método**: pregunta abierta en las dos épicas que lo mencionan.
- **El texto exacto del criterio escrito de "riesgo inmediato"**: [Moderar sin romper el producto](../../../epics/moderate-without-breaking-the-product/README.md) todavía no lo redactó, y esta página necesita citarlo.
