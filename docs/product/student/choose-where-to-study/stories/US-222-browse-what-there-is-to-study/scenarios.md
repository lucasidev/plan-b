# US-222: Ver qué hay para estudiar sin saber qué buscar

> Los casos de [US-222](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Valentina entra a Explorar sin haber iniciado sesión
Cuando abre la pantalla
Entonces ve las dos lentes, Carreras e Instituciones, y puede pasar de una a otra sin escribir nada en ningún campo y sin que se le pida cuenta.

**E2.** Dado que la lente de Carreras lista "Ingeniería en Sistemas, UNT" con 412 voces y cobertura de 23 de 51 materias, y "Ingeniería en Sistemas, UTN" con 96 voces y menor cobertura
Cuando se muestra cada entrada
Entonces cada una trae el nombre de la carrera, la institución, sus voces y su cobertura, y ninguna de las dos muestra un puntaje ni una escala 1 a 5.

**E3.** Dado esas mismas dos entradas
Cuando la lente ordena por voces
Entonces UNT (412 voces) aparece antes que UTN (96 voces); y cuando ordena alfabético, UNT aparece antes que UTN por el nombre de la institución, sin que ninguno de los dos criterios dependa del valor de ninguna proporción ni de la cobertura.

## Negativos

**N1.** Dado que Ingeniería en Sistemas en UNT tiene mayor cobertura que la de UTN (23 de 51 materias contra menos en UTN)
Cuando se arma cualquiera de las dos lentes
Entonces UNT no aparece primera por tener más cobertura: ni la cobertura ni ninguna proporción son criterio de orden.

## Edge cases

- "No la cargamos todavía": una institución pedida pero no cargada no aparece en ninguna lente; vive en Pedir, no acá.
- "Cargada y todavía sin voces": una carrera recién cargada por catálogo con cero voces se lista igual, con el texto de que todavía no hay voces, nunca como un 0%.
- "Cargada, con cobertura parcial": una carrera con voces pero con pocas materias medidas se lista con esa cobertura real a la vista, sin ocultar la entrada.
- Dos instituciones con exactamente el mismo número de voces (empate): el criterio de desempate no está definido en la story. **Falta decidir**.
