# US-134: Saber para cuánta carrera vale un dato

> Los casos de [US-134](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Ingeniería en Sistemas en UNT tiene 23 de 51 materias canónicas con al menos una cátedra que pasó el piso de 10 reseñas
Cuando se muestra su Ficha de carrera
Entonces la cobertura se lee como "23 de 51 materias" con su 45 %, y el texto dice que las 28 restantes todavía no juntan las 10 reseñas del piso.

**E2.** Dado que "Análisis Matemático II" tiene 111 voces sumando sus tres cátedras que pasaron el piso
Cuando se muestra en "qué frena la cursada"
Entonces aparece con esas 111 voces y sus 2,1 intentos promedio, sin importar que la carrera entera tenga solo 45 % de cobertura.

**E3.** Dado que Contador Público en una institución recién cargada tiene solo un puñado de sus materias canónicas con al menos una cátedra que pasó el piso
Cuando se arma su Ficha de carrera
Entonces la cobertura se muestra igual, honesta y baja (el número real de materias medidas sobre el total del plan), y "qué frena la cursada" lista lo poco que ya se puede sostener con esas pocas, sin ocultar la sección ni esperar a un umbral más alto.

## Negativos

**N1.** Dado una carrera con apenas 1 de 51 materias con una cátedra que pasó el piso
Cuando se arma su ficha
Entonces esa única materia igual aparece si frena la cursada, y la cobertura muestra "1 de 51 materias" tal cual: ningún umbral oculta la sección por ser un número bajo.

## Edge cases

- Un plan reformado que coexiste con el plan viejo: el denominador de cobertura es uno solo, la unión de materias canónicas de los dos planes (D04), no dos coberturas separadas.
- Una materia con una sola cátedra que junta exactamente 10 reseñas: ya cuenta como medida ("entra en el 23 de 51"), aunque su margen sobre el piso sea el mínimo.
- Una materia con dos cátedras, una que pasó el piso (12 reseñas) y otra que no (4 reseñas): la materia cuenta como medida por la que sí pasó, y las 4 reseñas de la otra no aportan a ningún número todavía (US-138).
