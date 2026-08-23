# US-222: Ver qué hay para estudiar sin saber qué buscar

> Los casos de [US-222](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Valentina entra a Explorar sin haber iniciado sesión
Cuando abre la pantalla
Entonces ve las dos lentes, Carreras e Instituciones, y puede pasar de una a otra sin escribir nada en ningún campo y sin que se le pida cuenta.

**E2.** Dado que la lente de Carreras lista "Ingeniería en Sistemas, UNSTA" con 850 voces y cobertura de 22 de 40 materias, y "Ingeniería en Sistemas, UTN" con 1200 voces y cobertura de 30 de 40 materias
Cuando se muestra cada entrada
Entonces cada una trae el nombre de la carrera, la institución, sus voces y su cobertura, y ninguna de las dos muestra un puntaje ni una escala 1 a 5.

**E3.** Dado esas mismas dos entradas
Cuando la lente ordena por voces
Entonces UTN (1200 voces) aparece antes que UNSTA (850 voces); y cuando ordena alfabético, UNSTA aparece antes que UTN por el nombre de la institución, sin que ninguno de los dos criterios dependa del valor de ninguna proporción.

## Negativos

**N1.** Dado que Ingeniería en Sistemas en UNSTA tiene una proporción de "marcaron alguien fallando" más alta que la de UTN
Cuando se arma cualquiera de las dos lentes
Entonces UNSTA no aparece primera por tener ese número más alto: la proporción nunca es criterio de orden.

## Edge cases

- "No la cargamos todavía": una institución pedida pero no cargada no aparece en ninguna lente; vive en Pedir, no acá.
- "Cargada y todavía sin voces": una carrera recién cargada por catálogo con cero voces se lista igual, con el texto de que todavía no hay voces, nunca como un 0%.
- "Cargada, todavía no derivamos": una carrera con voces pero con cobertura de 15 de 40 materias (menos de la mitad) se lista con esa cobertura a la vista, sin cabecera.
- Dos instituciones con exactamente el mismo número de voces (empate): el criterio de desempate no está definido en la story. **Falta decidir**.
