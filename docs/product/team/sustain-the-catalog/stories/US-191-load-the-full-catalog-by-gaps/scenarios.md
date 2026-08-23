# US-191: Ver qué falta antes de lo cargado

> Los casos de [US-191](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que en Catálogo hay tres ofertas: "Ingeniería en Sistemas de Información" (UTN) con 6 huecos (entre ellos duración nominal y carrera canónica, más 4 no bloqueantes), "Licenciatura en Nutrición" (USPT) con 2 correlativas sin cargar, e "Ingeniería en Sistemas" (UNSTA) publicada y sin huecos.
Cuando Sofía abre Catálogo.
Entonces la lista abre ordenada por cantidad de huecos: primero "Ingeniería en Sistemas de Información" (6 huecos), después "Licenciatura en Nutrición" (2 huecos), y al final "Ingeniería en Sistemas" (publicada, sin huecos), nunca por orden alfabético ni por fecha de carga.

**E2.** Dado que "Ingeniería en Sistemas de Información" (UTN) tiene 6 huecos: duración nominal, carrera canónica, y 4 más (materias canónicas del plan sin cargar).
Cuando Sofía abre esa oferta.
Entonces duración nominal y carrera canónica se marcan aparte, como los dos huecos que bloquean publicar, distinguidos de los otros 4 que no bloquean.

## Negativos

**N1.** Dado que "Ingeniería en Sistemas de Información" (UTN) ya tiene resuelta la duración nominal (5 años) pero todavía le falta atar la carrera canónica. Cuando Sofía intenta tocar "Publicar oferta". Entonces el botón queda deshabilitado y la oferta no se publica, aunque los otros 5 huecos, incluidos los 4 no bloqueantes, ya estén cargados: alcanza con que falte uno solo de los dos bloqueantes.

## Edge cases

- Una oferta recién creada, sin ningún campo cargado todavía, aparece primera en la lista con el conteo máximo de huecos.
- Sofía carga la duración nominal y cierra la pestaña antes de seguir con las materias canónicas: al volver, el hueco de duración nominal ya no aparece y el resto sigue pendiente, sin perder lo ya guardado.
- Dos ofertas con la misma cantidad de huecos: el criterio de desempate no está definido (Falta decidir: "cómo se prioriza entre varios huecos bloqueantes a la vez" queda abierto en la ficha de la pantalla).
- Resueltos los dos huecos bloqueantes pero con huecos no bloqueantes todavía pendientes: publicar se habilita igual, porque solo bloquean los dos marcados aparte.
