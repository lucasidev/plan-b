# US-134: Saber para cuánta carrera vale un dato

> Los casos de [US-134](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Ingeniería en Sistemas en UNSTA tiene 22 de 40 materias canónicas con al menos una voz
Cuando se muestra su Ficha de carrera
Entonces la cobertura se lee como "22 de 40 materias con voces" al lado de la cabecera derivada, porque 22 es más de la mitad de 40 y la cabecera se publica.

**E2.** Dado que "Hay clases que no se dan" aparece marcada en cursadas de 12 materias distintas del plan de Ingeniería en Sistemas en UNSTA, sobre un total de 850 voces de toda la carrera (ADR-0066)
Cuando se muestra esa frase en la lista derivada de la carrera
Entonces dice "en 12 materias", además de sus voces y su proporción.

**E3.** Dado que Contador Público en una institución nueva tiene solo 15 de 40 materias canónicas con voces (menos de la mitad)
Cuando se arma su Ficha de carrera
Entonces la cabecera con las dos proporciones no se publica: en su lugar dice "todavía no derivamos", muestra "15 de 40 materias con voces" y deja entrar materia por materia.

## Negativos

**N1.** Dado una carrera con apenas 3 de 40 materias con voces
Cuando se arma su ficha
Entonces nunca se muestra una cabecera derivada con esas 3 materias, ni un 0% en ningún lado: el gate lo impide siempre, sin excepción por lo alto o lo bajo que sea el número que esas 3 materias darían.

## Edge cases

- Ingeniería Industrial en UNSTA con exactamente 20 de 40 materias con voces (la mitad justa): no pasa el gate, porque el criterio es "más de la mitad", no "la mitad o más".
- Un plan reformado que coexiste con el plan viejo: el denominador de cobertura es uno solo, la unión de materias canónicas de los dos planes (D04), no dos coberturas separadas.
- La materia electiva Legislación Profesional, con 10 voces propias, publica sus propias frases igual (por ejemplo, F03 "Es muchísimo contenido" en 3 de 10, 10,8% encogido, ADR-0075), sin que esa materia sola alcance para mover el gate de cobertura de la carrera: cobertura cuenta materias con al menos una voz, no cuánta voz tiene cada una.
