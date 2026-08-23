# US-173: Mostrar los dos ejes sin puntaje

> Los casos de [US-173](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Cátedra Pérez acumuló 40 voces en total, y F18 "Hay clases que no se dan" (gestión) es la única frase de gestión que alguien marcó, con 12 de 40 voces (18,1%, ADR-0075)
Cuando alguien entra a la Ficha de Cátedra Pérez
Entonces la cabecera muestra dos proporciones separadas, nunca mezcladas: gestión en 18,1% (F18, 12 de 40) y exigencia en 44,6% (F01 "Es dura de verdad", 24 de 40), con el mismo denominador de 40 voces y sin mezclarse; y F18 aparece, con esa misma proporción, en la lista de frases de gestión.

**E2.** Dado que, más adelante, Cátedra Pérez acumuló 120 voces en total y F01 "Es dura de verdad" (exigencia, sujeto materia) tiene 60 de 120 voces (41,2%, ADR-0075)
Cuando se muestra en la lista de exigencia de la Ficha de Cátedra Pérez
Entonces se lee como información neutra sobre la materia, nunca como una falla de la cátedra, y en ningún lugar de la ficha (cabecera, listas, pie) aparece un puntaje ni una escala 1 a 5.

## Negativos

**N1.** Dado que Cátedra Pérez tiene voces en los dos ejes
Cuando se arma cualquier parte de la ficha
Entonces nunca se muestra un número único que combine o promedie exigencia y gestión (por ejemplo, ningún "3,2 sobre 5"): cada eje se publica como su propia proporción de voces.

## Edge cases

- Todas las voces de una cursada marcaron alguna frase de gestión y ninguna marcó una de exigencia: la proporción de exigencia se publica igual, en 0 de N voces, sin ocultarse ni inventarse.
- Una cátedra recién cargada, con una sola voz que marcó una frase de exigencia: se publica igual, 1 de 1 encogido a 20,7% (ADR-0075), sin piso ni escalera.
