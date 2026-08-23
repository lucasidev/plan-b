# US-127: Ver cuánto tarda de verdad la carrera

> Los casos de [US-127](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que el plan de Ingeniería en Sistemas en UNSTA dura nominalmente 5 años, y 40 egresados declararon tanto el año en que entraron como el año en que se recibieron, con una mediana de 7,5 años entre esas dos fechas
Cuando se mira la trayectoria en la Ficha de carrera
Entonces se muestran los dos números uno al lado del otro: duración nominal 5 años, duración real 7,5 años (mediana de 40 egresados).

**E2.** Dado esos mismos 5 años nominales y 7,5 reales
Cuando se calcula la brecha
Entonces se muestra una brecha de 2,5 años, y el texto dice que sale de esos mismos 40 egresados.

**E3.** Dado que la duración real muestra 7,5 años
Cuando se lee el texto que la acompaña
Entonces dice "de los que se recibieron y reseñaron acá": nadie que sigue cursando ni nadie que se fue entra en ese número.

## Negativos

**N1.** Dado que un estudiante reseñó varias materias de Ingeniería en Sistemas en UNSTA pero nunca declaró que se recibió
Cuando se calcula la duración real
Entonces ese estudiante no entra en la mediana de 7,5 años ni en el total de 40 egresados: solo cuentan quienes declararon las dos fechas.

## Edge cases

- Todavía nadie declaró haberse recibido de una carrera recién cargada: la duración real no se publica como 0 años, viaja como sin datos (ADR-0054), y se dice que hace falta que egresados declaren las dos fechas.
- Un solo egresado declaró las dos fechas: la mediana es ese único valor, se publica igual, sin piso, y el texto dice que sale de un solo egresado.
- La misma carrera en dos instituciones (US-128) tiene su propia brecha cada una: UNSTA con 2,5 años, UTN con 1,5 años (nominal 5, real 6,5 de 22 egresados); no existe una brecha compartida entre las dos.
