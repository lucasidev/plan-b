# US-129: Atribuir la dificultad: carrera o facultad

> Los casos de [US-129](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que en la Ficha de Cátedra Pérez (Análisis Matemático II, UNT) el ítem "¿Se dictaron las clases?" tiene moda "Faltaron muchas · 41 %" sobre 37 voces, en el bloque "Qué hizo la cátedra"
Cuando alguien lee esa ficha
Entonces ese dato queda en el bloque de conducta observable, atribuible a esta cátedra puntual, sin mezclarse con ningún número de la carrera o la institución.

**E2.** Dado que en la Ficha de carrera de Ingeniería en Sistemas (UNT) "Análisis Matemático II" aparece en "qué frena la cursada" con 2,1 intentos promedio y 111 voces, sumando las tres cátedras que la dictan
Cuando alguien compara ese dato contra el 41 % de "faltaron muchas clases" de Cátedra Pérez
Entonces puede distinguir que el primero describe a toda la materia (estructural, no depende de una cátedra) y el segundo describe solo a Pérez (conducta observable de esa cátedra), porque cada ficha dice de qué voces está hecha.

**E3.** Dado que la Ficha de carrera muestra "plan vigente: 2016" y "egresan por cohorte: 14 %" como datos oficiales con fuente
Cuando alguien busca a qué cátedra atribuir esos números
Entonces no puede: son datos de la carrera y la institución en su conjunto, sin ninguna cátedra puntual detrás.

## Negativos

**N1.** Dado que alguien busca una cifra única que reparta la dificultad entre "es la carrera" y "es la facultad" en cualquier ficha
Cuando la busca
Entonces no existe: ninguna ficha computa ni publica esa proporción; lo que hay son los conteos de cada bloque, separados por lo que describen.

## Edge cases

- Una cátedra con ítems marcados solo en "qué hizo la cátedra" y ninguno todavía en "qué les pasó a los que cursaron" (o al revés): la lectura que arma quien lee queda con menos ingredientes de un lado, pero ningún bloque se completa ni se infiere para balancearla.
- Una carrera con un solo dato oficial relevado (por ejemplo, "plan vigente" cargado y "egresan por cohorte" todavía no): lo que falta se dice como no relevado todavía, nunca se completa con un promedio de reseñas.
