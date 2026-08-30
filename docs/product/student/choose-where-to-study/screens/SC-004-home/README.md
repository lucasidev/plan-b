# Inicio (la pantalla)

> Ficha de pantalla, dueña: la épica [Elegir dónde estudiar](../../README.md). **Estado**: construida el 2026-08-27 (R2). El [boceto mid-fi](sketch.html) quedó rebasado en su contenido: su ejemplo de ficha es de la medición anterior al 2026-08-25 ([ADR-0083](../../../../../decisions/0083-the-ficha-publishes-counts-not-scores.md)), y lo que vale de él es la estructura de bloques. Pública, se lee sin cuenta. Slug `/`.

## Quién la usa

**Valentina** (no tiene a quién preguntarle y desconfía de lo que parece vendido: necesita entender qué es esto antes de confiar en un número), **Ana** (busca su facultad; si el vacío no se explica después, ya sospechó desde acá), **Rocío** (entra buscando de dónde sale el dato, antes de citarlo en una reunión), y quien lee, sin cuenta, en general.

## Qué stories resuelve

[US-171](../../../../guarantees/README.md#stories) (nada destacado, patrocinado ni ordenado por conveniencia, tampoco en la muestra de ficha que elige), [US-168](../../../../guarantees/README.md#stories) (leer, acá y en todo lo público, no pide cuenta).


[US-221](../../stories/US-221-see-the-instrument-working-on-arrival/README.md) (la razón de que esta pantalla exista: entender qué es esto viendo una ficha real, con la muestra al azar entre las que ya pasaron el piso de publicación).

[US-222](../../stories/US-222-browse-what-there-is-to-study/README.md) (desde acá se entra a explorar sin saber qué buscar).
## Qué muestra

Su identidad visual se diseña con criterio propio: lo que sigue es la estructura de bloques que tiene que estar, no la identidad visual (tipografía, tono) que va a tener la landing.

1. **Qué es plan-b, en palabras de lector**: lo que los alumnos ya saben porque lo vivieron, hoy disperso en grupos y pasillos, convertido en un dato que aguanta una discusión. Sin vocabulario de producto ni de tesis. Dicho también en tres pasos cortos: explorar o buscar, leer la ficha con sus voces, reseñar si cursaste.
2. **La entrada a [Explorar](../SC-003-explore/README.md) y [Buscar](../SC-006-search/README.md)**: los dos caminos para llegar a una ficha.
3. **Una muestra honesta**: una [ficha real](../SC-002-chair/README.md), con sus voces, no un número inventado para la ocasión ("Cátedra Pérez, Análisis Matemático II · UNT: de cada 10 que la cursan, llegan 4 · 42 voces"). Nada de hechos elegidos a mano ni instituciones destacadas (US-171): la muestra es una ficha entera, no un ranking de lo mejor ni de lo peor.
4. **El método al alcance**: link a [Método](../../../take-the-data/screens/SC-021-method/README.md), para quien quiere saber cómo se calculó eso antes de creerlo.
5. **Pedir si no está**: link a [Pedir](../../../request-a-career/screens/SC-010-request/README.md), para quien ya intuye que su facultad no va a estar cargada.
6. **Leer no pide cuenta**: lo dice acá mismo, antes de que alguien tenga que descubrirlo solo (US-168).

## Estados

**Con muestra** (lo normal apenas una cátedra publica) y **sin muestra**: cuando ninguna cruzó el piso, la pantalla lo dice y explica por qué («una cátedra publica sus conteos recién cuando junta 10 reseñas»), en vez de mostrar un ejemplo inventado. Es el estado real de un producto que recién empieza a juntar voces, y la entrada existe justamente para no maquillarlo.

## Lo que no muestra nunca

Ninguna institución destacada, patrocinada ni ordenada por conveniencia (US-171); ningún hecho de la muestra elegido a mano: la ficha sale sorteada entera, no un fragmento curado; ningún puntaje ni ranking (ADR-0083); ningún login ni muro antes de leer cualquiera de sus bloques (US-168).

## Adónde va

Es la puerta de entrada: no llega desde ninguna otra pantalla del producto, sino de un link compartido, un buscador externo o el boca a boca. Va a: [Explorar](../SC-003-explore/README.md), [Buscar](../SC-006-search/README.md), [Método](../../../take-the-data/screens/SC-021-method/README.md), [Pedir](../../../request-a-career/screens/SC-010-request/README.md), y desde cualquiera de esas, a una ficha.

## Decisiones que aplica

[ADR-0063](../../../../../decisions/0063-the-product-is-a-pressure-instrument.md) (qué es plan-b: ni ranking ni buscador de carreras, sin acuerdos con instituciones), [ADR-0083](../../../../../decisions/0083-the-ficha-publishes-counts-not-scores.md) (la muestra es una ficha con conteos y voces, nunca un puntaje). Las garantías de [Que no me molesten](../../../../guarantees/README.md) que se verifican acá: no pide cuenta para leer (US-168), nada destacado ni patrocinado (US-171).

## Lo construido (R2, 2026-08-27)

Están los bloques 1, 2, 3 y 6: qué es plan-b, los dos caminos (Explorar hacia el catálogo público y el mismo buscador que usa el producto adentro), la muestra sorteada con su ficha real, los tres pasos, y que leer no pide cuenta dicho en el hero.

**El sorteo es por visita** y lo hace la base (`ORDER BY random()` sobre las cátedras que cruzaron el piso), no la pantalla: dejarlo del lado del llamador permitiría ordenarlo «por las mejores» sin que se note. De la ficha sorteada se enfrentan la finalización y los dos primeros ítems **en el orden de la ficha** (alfabético por código), no una selección; el resto se ve entrando.

**No están los bloques 4 y 5** (Método y Pedir): sus pantallas todavía no existen, y un link a una pantalla inexistente es peor que no ofrecerla. Las dos preguntas que Método contestaría y que más hacen dudar a quien llega (por qué no hay puntaje, por qué algunas cátedras no muestran nada) se contestan mientras tanto en las preguntas de la propia entrada.

## Lo que esta ficha deja abierto

- **La identidad visual de la landing** (tipografía, tono): se construyó con los tokens del producto y el contrato Boletín para el bloque de la muestra, no con una identidad propia. Sigue sin dibujarse.
- **Cada cuánto rota la muestra**: hoy sortea en cada visita. Queda abierto si conviene fijarla por día (para que dos personas que comparten el link vean lo mismo) y si se excluye la que el visitante ya vio.
