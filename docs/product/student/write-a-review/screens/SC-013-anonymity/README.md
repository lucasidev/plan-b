# Anonimato (la pantalla)

> Ficha de pantalla, dueña: la épica [Reseñar](../../README.md). **Estado**: reescrita el 2026-08-26 al modelo de tres capas ([ADR-0082](../../../../../decisions/0082-the-review-captures-the-cursada-in-three-layers.md) a [ADR-0085](../../../../../decisions/0085-three-instruments-and-official-data.md)); su [boceto mid-fi](sketch.html) todavía describe el modelo anterior (testimonio publicado, chequeo previo, réplica) y queda pendiente de su propia reescritura visual. Revisada el 2026-08-19 ([registro](../../../../../history/reviews/2026-08-19-shared-screens.md)); hi-fi pendiente. Pública, se lee sin cuenta. Slug hoy `/about` (hoy habla de otra cosa, se rehace).

## Quién la usa

Quien está por reseñar y duda si conviene contar algo incómodo (**Matías**, **Lucía**), y **Claudia** y **Paredes** (quieren saber qué protege a quien reseña y qué no los expone a ellos, nombrados en su rol).

## Qué stories resuelve

[US-148](../../README.md#stories) (qué se publica de una reseña y qué no), [US-158](../../README.md#stories) (por qué el chequeo previo a publicar ya no aplica: el campo libre nunca se publica), [US-159](../../README.md#stories) (el piso de 10 y la verdad sobre el grupo chico), [US-218](../../../../team/cut-the-access/stories/US-218-make-the-teams-actions-reviewable/README.md) (el registro público de moderación, en agregado).

## Qué muestra

Es una página de lectura, sin pasos ni formulario: los bloques que explican la posición, en las palabras de la tesis.

1. **Qué se publica de una reseña y qué no** (US-148): nunca una reseña individual. Lo que se publica es el agregado por cátedra: la moda y la distribución completa de cada ítem, con sus voces ([ADR-0083](../../../../../decisions/0083-the-ficha-publishes-counts-not-scores.md)). Nunca el nombre, la cuenta, el rol, ni cómo terminó nadie.
2. **El campo libre no se publica nunca** ([ADR-0084](../../../../../decisions/0084-free-text-feeds-curation-and-is-never-published.md)): lo único que escribís de tu puño y letra, al final de la reseña, lo lee el equipo de curaduría para dos cosas nada más: destilar un ítem nuevo cuando muchos escriben lo mismo, o escribir una nota editorial sin nombres a nivel carrera o institución (nunca de cátedra: ahí el docente es identificable). Nada de lo que escribís en ese campo sale publicado, ni con tu nombre ni sin él. Por eso ya no hay chequeo previo a publicar (US-158 queda rebasada): no hay texto publicable que revisar antes de que salga.
3. **La verdad sobre el grupo chico** (US-159): no prometemos anonimato estadístico, prometemos no publicar quién. Por eso ninguna cátedra publica antes de juntar **10 reseñas**: con menos, el titular puede deducir quién dijo qué. No es vergüenza estadística, es privacidad. El estado se muestra siempre, no se esconde: "junta 3 reseñas: con 7 más se publica".
4. **El registro público de moderación, en agregado** (US-218): cuántos textos se bajaron y cuántos quedaron retenidos, por categoría, sin contenido. Con el campo libre sin publicarse nunca ([ADR-0084](../../../../../decisions/0084-free-text-feeds-curation-and-is-never-published.md)), este registro hoy reporta casi siempre en cero; el registro en sí lo sostiene [Cortar los accesos](../../../../team/cut-the-access/README.md), no esta épica.

## Estados

No tiene. Es una página de lectura fija, no un formulario ni un recorrido.

## Lo que no muestra nunca

El nombre, la cuenta, el rol ni el desenlace de quien reseñó (US-148); ninguna reseña individual, en ningún cruce ([ADR-0083](../../../../../decisions/0083-the-ficha-publishes-counts-not-scores.md)); el contenido del campo libre de nadie ([ADR-0084](../../../../../decisions/0084-free-text-feeds-curation-and-is-never-published.md)); ninguna promesa de anonimato estadístico (US-159 la niega explícitamente).

## Adónde va

Llega desde: un link en cualquier ficha ("cómo te cubrimos"), y el mismo aviso dicho de nuevo, más corto, en el paso 6 de [Reseñar](../SC-015-write-review/README.md). Va a: [Reseñar](../SC-015-write-review/README.md) (con cuenta); no tiene ninguna acción propia. Tiene que existir desde antes de que exista el primer reporte: las Restricciones del catálogo la exigen pública desde ese momento.

## Decisiones que aplica

[ADR-0082](../../../../../decisions/0082-the-review-captures-the-cursada-in-three-layers.md) (el piso de 10 y su razón: la privacidad del que reseña, no la vergüenza estadística), [ADR-0083](../../../../../decisions/0083-the-ficha-publishes-counts-not-scores.md) (nunca se publica una reseña individual, solo conteos agregados por ítem), [ADR-0084](../../../../../decisions/0084-free-text-feeds-curation-and-is-never-published.md) (el campo libre no se publica nunca; sus dos únicas salidas son destilar ítems y notas editoriales sin nombre), [ADR-0009](../../../../../decisions/0009-review-anonymity-is-a-presentation-rule.md) (el anonimato es de presentación: la identidad se preserva siempre por dentro y nunca se expone en público), [THESIS.md](../../../../../THESIS.md) ("Posición tomada"). Las [Restricciones del catálogo](../../../../README.md) exigen esta política pública antes de que exista el primer reporte.

## Lo que esta ficha deja abierto

- **Qué se modera y cómo, ahora que no hay texto publicado de estudiantes**: con el campo libre sin publicarse nunca ([ADR-0084](../../../../../decisions/0084-free-text-feeds-curation-and-is-never-published.md)), la moderación de contenido de reseñas queda casi vacía. Lo que sobrevive (las notas editoriales de la curaduría, la respuesta del reseñado a los números agregados de su ficha) lo definen [Moderar sin romper el producto](../../../../team/moderate-without-breaking-the-product/README.md) y [Responder](../../../../reviewed/reply/README.md), todavía sin reescribir a este modelo: queda fuera del alcance de esta épica.
- **El boceto de esta pantalla** ([sketch.html](sketch.html)) sigue mostrando testimonio publicado, chequeo previo y réplica: pendiente de su propia reescritura visual, a la par de las dos épicas de arriba.
