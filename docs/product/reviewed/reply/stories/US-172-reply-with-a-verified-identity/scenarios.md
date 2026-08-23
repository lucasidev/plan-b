# US-172: Responder con identidad verificada

> Los casos de [US-172](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado el testimonio de Matías sobre Cátedra Pérez (Análisis Matemático II, Ingeniería en Sistemas, UNSTA, 2024, primer cuatrimestre), que marcó la frase F18 "Hay clases que no se dan" con 12 de 40 voces (18,1%, ADR-0075), y Claudia Fernández con identidad docente verificada como titular de Cátedra Pérez
Cuando Claudia manda su respuesta y se cumple el plazo de retención sin que Matías la edite, la borre ni pida revisión
Entonces la respuesta se publica al lado del testimonio de Matías, firmada "Claudia Fernández, titular, identidad verificada", con la fecha de publicación.

**E2.** Dado que la respuesta de Claudia Fernández ya se publicó al lado del testimonio de Matías
Cuando se mira la Ficha de Cátedra Pérez
Entonces el testimonio de Matías sigue completo y visible como estaba, y F18 sigue con sus mismas 12 de 40 voces (18,1%): la respuesta no bajó el testimonio ni movió ningún conteo.

## Negativos

**N1.** Dado que Claudia Fernández todavía no tiene identidad docente verificada
Cuando intenta responder al testimonio de Matías sobre Cátedra Pérez
Entonces la réplica no se publica: Responder no le muestra campo de respuesta hasta que la verificación se apruebe (US-178).

## Edge cases

- Claudia responde a la ficha de la cátedra en general, sin apuntar a un testimonio puntual: esta story no describe dónde queda esa réplica dentro de la ficha.
- El testimonio de Matías se borra después de que la respuesta de Claudia ya se publicó (no durante el plazo de US-179, sino después): qué pasa con la réplica publicada. **Falta decidir** (abierto en el README de la épica).
