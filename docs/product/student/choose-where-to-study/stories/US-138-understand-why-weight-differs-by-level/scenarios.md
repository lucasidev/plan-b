# US-138: Entender por qué un dato aparece en una ficha y no en otra

> Los casos de [US-138](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que "Análisis Matemático II" tiene tres cátedras que pasaron el piso (Pérez, Ruiz y González, sumando 111 voces) y una cuarta, Paz, con solo 3 reseñas
Cuando se muestra la Ficha de materia
Entonces el dato de Paz no aparece en ninguno de los cuatro números de la materia (intentos, habilita, llegan, libre) ni en la dispersión entre cátedras: se lista aparte, en "sus cátedras", con su propia cuenta y cuánto le falta ("3 reseñas · con 7 más se publica").

**E2.** Dado que Ingeniería en Sistemas en UNT tiene 23 de 51 materias con al menos una cátedra que pasó el piso
Cuando se muestra "qué frena la cursada" en la Ficha de carrera
Entonces solo esas 23 pueden aparecer en la lista; las otras 28 no están porque su cobertura todavía no las alcanza, y la ficha lo dice con el número real ("las 28 restantes todavía no juntan las 10 reseñas del piso"), no como si no existieran.

**E3.** Dado que Cátedra Paz tiene 3 reseñas cargadas pero está bajo el piso
Cuando alguien busca ese dato en la Ficha de materia
Entonces no lo encuentra ahí: el dato existe (las 3 reseñas están guardadas) pero todavía no se publica en ninguna ficha, ni en la de Paz ni en la de la materia.

## Negativos

**N1.** Dado que una materia tiene 3 de sus 4 cátedras publicadas
Cuando se arma su ficha
Entonces el número de voces de la cuarta cátedra no se suma ni se estima: la materia se arma solo con lo que pasó el piso.

## Edge cases

- Una cátedra que pasó el piso hace una semana: sus datos ya aparecen en la materia y en la carrera desde ese momento, sin un período de gracia adicional.
- Una carrera con toda su cobertura medida (51 de 51): "qué frena la cursada" puede listar cualquiera de sus materias, ya no hay ninguna oculta por el piso.
