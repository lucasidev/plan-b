# US-199: Revisar frases destiladas antes de ofrecerlas

> Los casos de [US-199](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que la destilación propuso el candidato "Tardan semanas en devolver la nota", a partir de tres comentarios del campo libre de reseñas distintas: "tardaron un mes en devolvernos el primer parcial", "todavía espero la nota del final de julio" y "en la mesa de diciembre recién nos dijeron la nota de agosto".
Cuando quien cura las frases abre la cola de curaduría en Frases.
Entonces ve el candidato con sus tres comentarios de origen, sin la cuenta que escribió cada uno.

**E2.** Dado el mismo candidato "Tardan semanas en devolver la nota", sin capa ni opciones asignadas todavía.
Cuando quien cura las frases lo aprueba asignándole capa "qué hizo la cátedra", opciones "Sí · A veces · Nunca" y código I48, y confirma "Confirmar y marcar como destilado".
Entonces recién ahí queda disponible para responder al reseñar una cátedra, ofrecida como frase destilada.

**E3.** Dado que "Tardan semanas en devolver la nota" (I48) ya fue aprobado (capa "qué hizo la cátedra") y, desde entonces, 3 de las 10 personas que reseñaron la cátedra "Análisis Matemático II, Cátedra Pérez" (UNSTA) respondieron "Sí".
Cuando alguien abre esa Ficha de cátedra.
Entonces "Tardan semanas en devolver la nota" aparece en el bloque "Qué hizo la cátedra" con moda "Sí · 30 %" sobre 3 de 10 voces, y la marca "síntesis", nunca como una cita textual de una reseña puntual.

## Negativos

**N1.** Dado que el candidato "Tardan semanas en devolver la nota" todavía está en la cola de curaduría, sin aprobar ni descartar.
Cuando Lucía reseña "Análisis Matemático II, Cátedra Pérez" (UNSTA) y ve las frases disponibles para responder.
Entonces "Tardan semanas en devolver la nota" no aparece entre las frases que puede responder: no se ofrece hasta que se apruebe.

**N2.** Dado que quien cura las frases descarta el candidato "Tardan semanas en devolver la nota" en vez de aprobarlo.
Cuando alguien busca ese candidato después, en Frases o en cualquier ficha pública.
Entonces no aparece en ningún lado: no se ofrece nunca, y no queda rastro público de que existió.

## Edge cases

- Cola de curaduría vacía: no hay candidatos esperando desde la última revisión.
- La primera persona que responde un destilado recién aprobado lo sostiene sola: 1 de 1 voces, se publica igual, sin piso.
- El piso de 10 reseñas por cátedra ([ADR-0082](../../../../../decisions/0082-the-review-captures-the-cursada-in-three-layers.md)) es sobre la cátedra entera, no por frase: una frase recién aprobada puede tener solo 1 o 3 voces mientras la cátedra ya pasó el piso general y publica el resto de sus conteos.
- Un candidato descartado por error no tiene camino de recuperación, porque descartar no deja rastro.
- Cuántos comentarios hacen falta para que la destilación proponga un candidato no está definido (Falta decidir, la épica lo deja abierto).
