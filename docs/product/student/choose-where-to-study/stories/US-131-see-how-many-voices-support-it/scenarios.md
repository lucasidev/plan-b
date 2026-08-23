# US-131: Ver sobre cuántas voces se calcula

> Los casos de [US-131](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que "Hay clases que no se dan" en Cátedra Pérez tiene 15 de 41 voces (encogido a 24%, ADR-0075) sostenidas entre 2022 y 2025
Cuando se muestra esa frase en la Ficha de Cátedra Pérez
Entonces al lado de la frase se leen las tres cosas juntas: 15 de 41 voces, el período 2022 a 2025, y el encogimiento a 24%.

**E2.** Dado que Cátedra Molina (Álgebra I, UNSTA), recién cargada, tiene "Es dura de verdad" marcada por 1 de 1 voz (encogido a 20,7%, ADR-0075)
Cuando se muestra esa frase
Entonces se publica igual, con su voz (1 de 1), su encogimiento (20,7%) y su período, sin esperar a que aparezca una segunda voz.

## Negativos

**N1.** Dado que F01 "Es dura de verdad" tiene 15 de 41 voces en Cátedra Domínguez, y llega una voz nueva que reseña esa cursada marcando solo F02 "Se aprueba yendo a clase" (el sentido opuesto, sin marcar F01)
Cuando se recalcula F01
Entonces su proporción no se queda en 15 de 41: pasa a ser 15 de 42, porque el denominador es compartido por toda la cursada y crece con cada voz nueva, aunque nadie le haya sacado una marca a F01 (ADR-0075).

**N2.** Dado cualquier frase publicada en cualquier ficha
Cuando se muestra su proporción
Entonces nunca aparece un porcentaje solo, sin sus voces y sin su período al lado: los tres viajan siempre juntos.

## Edge cases

- Una frase con 4 de 4 voces (encogido a 51,0%, ADR-0075): se publica con el mismo formato que una con miles de voces, sin destacarse como "confiable" ni advertirse como "poco confiable" más allá de mostrar el número real.
- Dos frases distintas de la misma ficha, una sostenida desde 2022 y la otra recién desde 2024: cada una muestra su propio período, no el período general de la ficha.
