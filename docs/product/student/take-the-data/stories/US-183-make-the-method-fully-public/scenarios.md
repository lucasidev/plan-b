# US-183: Publicar el método y la fórmula

> Los casos de [US-183](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que en una cátedra recién cargada 4 personas de 4 marcaron "Es dura de verdad" (F01, sujeto materia, eje exigencia) en su única cursada reseñada
Cuando Valentina entra a Método antes de citar ese número
Entonces encuentra el límite inferior del intervalo de Wilson escrito tal cual, con sus tres variables (p, n, z = 1,96), y puede recalcular que lo publicado es 51,0%, no 100%.

**E2.** Dado que el catálogo tiene 46 frases semilla, cada una con su sujeto y su eje (por ejemplo, F01 "Es dura de verdad": materia, exigencia; F27 "Hubo acoso": cátedra, gestión, sin categoría aparte ni canal privado)
Cuando Rocío entra a Método
Entonces ve el catálogo entero, cada frase con su sujeto y su eje a la vista, incluida F27 al lado de cualquier otra.

**E3.** Dado que en el período 2024, primer cuatrimestre de la Cátedra Pérez, 40 personas reseñaron o votaron esa cursada: 12 marcaron "Hay clases que no se dan" (F18) y otras marcaron "Las clases se dan" (F17, su sentido opuesto)
Cuando Método explica cómo se calcula cada proporción
Entonces declara que F18 (12 de 40, 18,1%) y F17 comparten el mismo denominador (las 40 voces de esa cursada en ese período, marcaran o no cada frase), que sus proporciones no tienen por qué sumar 100% y que nunca se restan entre sí; y las dos viajan con sus voces y su período al lado.

**E4.** Dado que "Es dura de verdad" (F01, materia, exigencia) tiene, sumando todos los períodos y las dos cátedras de Análisis Matemático II (Pérez y Gómez) en UNSTA, 37 voces de 100
Cuando se compara ese dato con el de F01 dentro de una sola cátedra y un solo período
Entonces cada uno muestra su propio n y su propio período (37 de 100, encogido a 28,2%, para toda la materia; un número distinto para un solo período de una sola cátedra): son denominadores de niveles distintos, y ninguno se confunde con el otro.

## Negativos

**N1.** Dado que ADR-0064 mencionaba "el promedio bayesiano con prior hacia 0,5" como equivalente
Cuando alguien busca esa fórmula alternativa en Método
Entonces no la encuentra publicada: ADR-0075 cerró que se publica una sola fórmula, el límite inferior de Wilson con z = 1,96, no dos conviviendo.

**N2.** Dado que "Hay clases que no se dan" (F18) se publica en la Cátedra Pérez
Cuando se muestra su proporción en cualquier ficha o en el CSV
Entonces nunca aparece sin sus voces (12 de 40) ni sin su período (2024, primer cuatrimestre) al lado: no hay un número pelado.

## Edge cases

- "Se puede rendir libre y aprobar" (F08, materia, gestión) todavía no la marcó nadie en ninguna cursada: igual aparece en el catálogo entero de Método, porque el catálogo se publica completo aunque una frase no tenga uso todavía.
