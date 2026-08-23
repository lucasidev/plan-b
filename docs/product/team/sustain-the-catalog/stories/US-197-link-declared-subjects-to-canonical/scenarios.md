# US-197: Vincular materias declaradas a la canónica

> Los casos de [US-197](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que en la cola de materias declaradas de "Ingeniería en Sistemas" (UNSTA) hay dos pendientes: "Taller de Programación", nombrada por 7 personas, y "Bases de Datos II", nombrada por 3.
Cuando Sofía abre esa cola en Catálogo.
Entonces ve "Taller de Programación" con "7 personas la nombraron" y "Bases de Datos II" con "3 personas la nombraron".

**E2.** Dado que "Taller de Programación" (7 personas) es, en el fondo, el mismo contenido que la materia canónica "Programación I" ya cargada en el plan.
Cuando Sofía toca "Vincular a Programación I".
Entonces "Taller de Programación" queda vinculada a "Programación I", con el registro "vinculada por Sofía el 21 de agosto de 2026", y las 7 reseñas que la nombraban empiezan a contar para "Programación I".

**E3.** Dado que "Bases de Datos II" (3 personas) no coincide con ninguna materia canónica ya cargada del plan.
Cuando Sofía toca "Fusionar o crear nueva" y decide crear una materia canónica nueva.
Entonces se crea "Bases de Datos II" como materia canónica, con el registro de quién lo hizo, y las 3 reseñas pendientes pasan a contar para esa materia nueva.

## Negativos

**N1.** Dado que "Taller de Programación" todavía está pendiente de vincular, sin vincularse ni fusionarse. Cuando alguien mira la ficha de "Programación I" o la cobertura de "Ingeniería en Sistemas" (UNSTA). Entonces las 7 reseñas de "Taller de Programación" NO cuentan en la ficha de "Programación I" ni entran a la cobertura de la carrera todavía (D08): solo su autor la ve como pendiente en Mis aportes.

## Edge cases

- Una materia declarada nombrada por una sola persona entra igual a la cola, sin piso mínimo para aparecer.
- Vincular "Bases de Datos II" a una canónica que en realidad es otra materia distinta: qué pasa con las reseñas ya sumadas si se corrige después no está definido (Falta decidir, la épica lo deja abierto).
- Una materia del plan viejo que ya no está en el plan nuevo, tras una reforma (US-204), entra acá como pendiente de vincular contra la materia canónica.
