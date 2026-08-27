# US-208: No cruzar verificación con lo aportado

> Los casos de [US-208](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Camila está revisando la constancia de Matías en la cola de constancias de Verificaciones.
Cuando intenta llegar a sus reseñas por cualquier camino de la interfaz, incluida una URL directa a Mis aportes de esa cuenta.
Entonces no encuentra ningún link ni acceso: desde la cola de constancias no hay ningún camino hacia los aportes de esa cuenta.

**E2.** Dado que Claudia Fernández pide verificar que es titular de Cátedra Pérez, Análisis Matemático II, UNSTA.
Cuando Camila la revisa en la cola de identidad docente, separada de la de constancias.
Entonces la compara contra el equipo docente que el catálogo tiene cargado para esa cátedra: verificarla es atarla a la cátedra sobre la que se publica, y esta cola no cae bajo la regla de "sin camino a los aportes" de las constancias de alumno, porque no hay un aporte anónimo que proteger de esa manera.

## Negativos

**N1.** Dado que Camila ya aprobó la constancia de Matías.
Cuando busca, en cualquier otra pantalla de Verificaciones, algún registro que una su nombre real con su cuenta o con lo que reseñó.
Entonces no lo encuentra: el corte es por construcción, no por buena voluntad.

## Edge cases

- El corte de esta story es dentro de la propia cola de Camila (no linkea a los aportes); que Camila y Nahuel no puedan ser la misma persona es un mecanismo aparte, ver US-217 en Cortar los accesos.
- La cola de cargo institucional (US-225) funciona igual que la de identidad docente: compara contra el catálogo, no contra aportes anónimos de una cuenta.
