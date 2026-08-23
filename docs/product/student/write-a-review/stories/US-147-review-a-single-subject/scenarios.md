# US-147: Reseñar una materia sola

> Los casos de [US-147](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Lucía cursó tres materias en el período 2026-C1 (Bases de Datos, Análisis Matemático II y Programación I), sin haber reseñado ninguna todavía.
Cuando abre Reseñar.
Entonces el paso 1 le pide elegir una sola materia con un buscador, sin mostrarle un checklist con las tres materias del período para tildar juntas.

## Negativos

**N1.** Dado que Lucía está en el paso 1 del buscador, Cuando intenta tildar más de una materia a la vez (por ejemplo Bases de Datos y Programación I juntas), Entonces el sistema no lo permite: elegir una materia abre su propio flujo de seis pasos, y para la otra hay que empezar de nuevo.

## Edge cases

- Buscar una materia que no devuelve resultados no es un error: se resuelve como materia fuera del plan (US-160), escribiéndola igual.
