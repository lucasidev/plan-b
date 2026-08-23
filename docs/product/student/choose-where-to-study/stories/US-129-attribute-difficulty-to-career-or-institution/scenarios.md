# US-129: Atribuir la dificultad: carrera o facultad

> Los casos de [US-129](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Cátedra Domínguez (Base de Datos I, Ingeniería en Sistemas, UNSTA) acumuló 41 voces en total, y F01 "Es dura de verdad" (eje exigencia) es la única frase de exigencia que alguien marcó, con 15 de 41 voces (23,6%, encogido a 24%, ADR-0075)
Cuando alguien entra a la Ficha de Cátedra Domínguez
Entonces la cabecera muestra "dicen que es dura" en 24%, con esas mismas 15 de 41 voces, en su propia caja de la cabecera, no mezclada con ninguna otra frase de la ficha.

**E2.** Dado esa misma Cátedra Domínguez, donde F18 "Hay clases que no se dan" (eje gestión) es la única frase de gestión que alguien marcó, con 12 de 41 voces (17,6%, encogido a 18%, ADR-0075)
Cuando se mira la misma cabecera
Entonces "marcaron alguien fallando" muestra 18%, sobre el mismo denominador de 41 voces que usa "dicen que es dura", y las dos proporciones aparecen juntas en la cabecera.

**E3.** Dado que F01 es de sujeto materia y F18 es de sujeto cátedra
Cuando se arma la cabecera de Cátedra Domínguez
Entonces las dos suman a sus respectivas proporciones igual: lo que decide si suman a "es dura" o a "alguien fallando" es el eje de la frase, exigencia o gestión, no de qué sujeto vienen.

## Negativos

**N1.** Dado que alguien busca la atribución (carrera dura contra facultad fallando) en Cátedra Domínguez
Cuando la busca
Entonces no la encuentra en ninguna caja aparte ni en un bloque separado: vive únicamente en la cabecera de la ficha, como las dos proporciones de siempre.

## Edge cases

- En la ficha de una cursada individual (antes de derivar a cátedra), el denominador de la cabecera son personas, no voces acumuladas de varios períodos: una persona que reseñó y además votó esa misma cursada sigue contando una sola vez.
- Una frase con sujeto institución (por ejemplo F30 "El nivel académico es alto") nunca aparece en la cabecera de Cátedra Domínguez, porque esa frase no pertenece a esta ficha aunque su eje sea exigencia.
- Si alguien reseña la cursada de Cátedra Domínguez marcando solo una frase de gestión, sin marcar ninguna de exigencia, el denominador de "dicen que es dura" sube igual en 1, porque el denominador es todas las voces de la cursada, no solo las que marcaron esa frase (ADR-0075; el cálculo completo está en US-131).
