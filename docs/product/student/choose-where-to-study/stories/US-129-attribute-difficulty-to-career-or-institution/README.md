# US-129: Atribuir la dificultad: carrera o facultad

**Épica**: [Elegir dónde estudiar](../../README.md)
**Del mapa**: O1-3

## Historia

Como quien está eligiendo, quiero poder distinguir lo que depende de la carrera o la institución de lo que depende de una cátedra puntual, porque una cosa la elijo y la otra la sufro.

## Listo cuando

- La Ficha de cátedra separa qué hizo la cátedra (conducta observable, atribuible a esta cátedra puntual) de qué les pasó a los que cursaron (vivencia, que puede depender de cualquiera de las dos cosas), sin computar una cifra única que reparta la dificultad entre "es la carrera" y "es la facultad".
- La Ficha de carrera muestra los datos oficiales y qué frena la cursada, que describen a la carrera y la institución en su conjunto, no a ninguna cátedra en particular.
- Ninguna ficha decide la atribución por quien lee: la arma quien lee, comparando lo conductual de una cátedra contra lo estructural de su carrera e institución.

## Dónde se resuelve

- [Ficha de cátedra](../../screens/SC-002-chair/README.md): "qué hizo la cátedra" (lo atribuible a esta cátedra puntual) y "qué les pasó a los que cursaron" (lo que no se puede atribuir sin comparar), cada bloque con sus propias voces.
- [Ficha de carrera](../../screens/SC-001-career/README.md): los datos oficiales y "qué frena la cursada", que no dependen de ninguna cátedra en particular.
- [Dónde estudiarla](../../screens/SC-008-where-to-study/README.md): las señales oficiales y de reseñas de cada institución quedan una al lado de la otra, sin combinarse ni cruzarse entre instituciones.

## Notas

Hasta [ADR-0083](../../../../../decisions/0083-the-ficha-publishes-counts-not-scores.md) esta story pedía una cabecera con dos proporciones por eje (exigencia, gestión), calculada por nosotros. Ese cálculo se retiró: ahora no computamos ninguna atribución, publicamos los conteos separados por lo que describen y quien lee arma su propia lectura.
