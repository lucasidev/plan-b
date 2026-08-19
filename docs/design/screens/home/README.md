# Inicio (la pantalla)

> Ficha de pantalla compartida ([inventario](../README.md)). **Estado**: borrador escrito el 2026-08-19 con su [boceto mid-fi](sketch.html) de la estructura de bloques de la landing; revisión adversarial pendiente antes del hi-fi. Pública, se lee sin cuenta. Slug hoy `/` (del inventario). Épicas que la componen: [Elegir dónde estudiar](../../../epics/choose-where-to-study/README.md) (la entrada: el inventario la marca «se diseña con criterio propio»).

## Quién la usa

**Valentina** (no tiene a quién preguntarle y desconfía de lo que parece vendido: necesita entender qué es esto antes de confiar en un número), **Ana** (busca su facultad; si el vacío no se explica después, ya sospechó desde acá), **Rocío** (entra buscando de dónde sale el dato, antes de citarlo en una reunión), y quien lee, sin cuenta, en general.

## Qué stories resuelve

[O6-4](../../../epics/do-not-bother-me/README.md#stories) (nada destacado, patrocinado ni ordenado por conveniencia, tampoco en la muestra que elige la landing), [O6-1](../../../epics/do-not-bother-me/README.md#stories) (leer, acá y en todo lo público, no pide cuenta).

## Qué muestra

El inventario marca esta pantalla «se diseña con criterio propio»: lo que sigue es la estructura de bloques que tiene que estar, no la identidad visual (tipografía, tono) que va a tener la landing.

1. **Qué es plan-b, en palabras de lector**: lo que los alumnos ya saben porque lo vivieron, hoy disperso en grupos y pasillos, convertido en un dato que aguanta una discusión. Sin vocabulario de producto ni de tesis. Dicho también en tres pasos cortos: explorar o buscar, leer la ficha con sus voces, reseñar si cursaste.
2. **La entrada a [Explorar](../explore/README.md) y [Buscar](../search/README.md)**: los dos caminos para llegar a una ficha.
3. **Una muestra honesta**: una [ficha real](../chair/README.md), con sus voces, no un número inventado para la ocasión ("Análisis Matemático II · Cátedra Pérez, UNSTA: 7 de cada 10 marcaron alguien fallando · 41 voces"). Nada de testimonios destacados ni instituciones destacadas (O6-4): la muestra es una ficha, no un ranking de lo mejor.
4. **El método al alcance**: link a [Método](../../../epics/take-the-data/screens/method/README.md), para quien quiere saber cómo se calculó eso antes de creerlo.
5. **Pedir si no está**: link a [Pedir](../../../epics/request-a-career/screens/request/README.md), para quien ya intuye que su facultad no va a estar cargada.
6. **Leer no pide cuenta**: lo dice acá mismo, antes de que alguien tenga que descubrirlo solo (O6-1).

## Lo que no muestra nunca

Ninguna institución destacada, patrocinada ni ordenada por conveniencia (O6-4); ningún testimonio elegido como destacado nuestro; ningún puntaje ni ranking (ADR-0064); ningún login ni muro antes de leer cualquiera de sus bloques (O6-1).

## Adónde va

Es la puerta de entrada: no llega desde ninguna otra pantalla del producto, sino de un link compartido, un buscador externo o el boca a boca. Va a: [Explorar](../explore/README.md), [Buscar](../search/README.md), [Método](../../../epics/take-the-data/screens/method/README.md), [Pedir](../../../epics/request-a-career/screens/request/README.md), y desde cualquiera de esas, a una ficha.

## Decisiones que aplica

[ADR-0063](../../../decisions/0063-the-product-is-a-pressure-instrument.md) (qué es plan-b: ni ranking ni buscador de carreras, sin acuerdos con instituciones), [ADR-0064](../../../decisions/0064-phrases-with-voices-not-scores.md) (la muestra es una ficha con frases y voces, nunca un puntaje). Las garantías de [Que no me molesten](../../../epics/do-not-bother-me/README.md) que se verifican acá: no pide cuenta para leer (O6-1), nada destacado ni patrocinado (O6-4).

## Lo que esta ficha deja abierto

- **La identidad visual de la landing** (tipografía, tono): distinta de la del producto, todavía no se dibujó; el mid-fi de acá es solo la estructura de bloques.
- **Qué muestra la muestra**: si es una ficha fija (siempre la misma) o rota entre varias, y con qué criterio se elige sin que eso mismo sea "destacar".
