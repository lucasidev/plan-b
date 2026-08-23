# US-195: Declarar dos ofertas como la misma carrera

> Los casos de [US-195](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que "Ingeniería en Sistemas de Información" (UTN) se está cargando y ya existe la carrera canónica "Ingeniería en Sistemas", usada hoy por "Ingeniería en Sistemas" (UNSTA).
Cuando Sofía busca "Ingeniería en Sistemas" en el paso de atar la carrera canónica y la selecciona, en vez de crear una nueva.
Entonces "Ingeniería en Sistemas de Información" (UTN) queda atada a la carrera canónica "Ingeniería en Sistemas", con el registro "atada por Sofía el 19 de agosto de 2026".

**E2.** Dado que "Ingeniería en Sistemas de Información" (UTN) e "Ingeniería en Sistemas" (UNSTA) están atadas a la misma carrera canónica "Ingeniería en Sistemas".
Cuando alguien abre Dónde estudiarla para "Ingeniería en Sistemas".
Entonces aparecen las dos ofertas (UTN y UNSTA) lado a lado, y ninguna oferta de una carrera canónica distinta, como "Licenciatura en Nutrición" (USPT), entra en esa comparación.

## Negativos

**N1.** Dado que "Licenciatura en Nutrición" (USPT) no tiene ninguna carrera canónica atada todavía, aunque su nombre se parezca al de otras ofertas de nutrición de otras instituciones. Cuando se arma la comparación de Dónde estudiarla. Entonces "Licenciatura en Nutrición" (USPT) NO se agrupa con ninguna otra oferta solo porque el nombre se parece: sin una decisión del catálogo registrada con autor y fecha, queda sola.

## Edge cases

- Una oferta atada a la carrera canónica equivocada por error: el criterio para desatar y volver a atar no está descrito (Falta decidir).
- Una oferta sin ninguna carrera canónica atada todavía: es uno de los dos huecos bloqueantes de US-191, no puede publicarse.
- Dos ofertas parecidas pero no iguales (por ejemplo, dos ingenierías con orientaciones distintas): quién decide si son la misma carrera canónica no tiene criterio escrito (Falta decidir, la épica lo deja abierto).
