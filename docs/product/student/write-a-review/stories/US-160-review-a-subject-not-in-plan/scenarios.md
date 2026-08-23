# US-160: Reseñar una materia fuera del plan

> Los casos de [US-160](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Lucía cursa "Taller de Redes Neuronales", una optativa que no está en el plan cargado de su carrera.
Cuando la busca en el paso 1 de Reseñar, no aparece, la escribe igual y continúa el flujo.
Entonces el sistema acepta la reseña y la marca como pendiente de vincular, en vez de rechazarla.

**E2.** Dado que la reseña de "Taller de Redes Neuronales" de Lucía está pendiente de vincular.
Cuando se visita la Ficha de carrera, se calcula la cobertura de materias con voces, y Lucía entra a Mis aportes.
Entonces esa reseña no cuenta en ninguna ficha ni suma a la cobertura, y en Mis aportes Lucía la ve marcada como pendiente.

## Negativos

**N1.** Dado que la reseña de Lucía sigue pendiente de vincular (el equipo todavía no la asoció a una materia canónica), Cuando alguien visita la ficha de cualquier materia existente, Entonces las frases marcadas en esa reseña pendiente no aparecen ahí ni afectan ninguna proporción publicada.

## Edge cases

- Se puede editar la reseña pendiente igual, con el aviso de que todavía no cuenta en ninguna ficha.
- Falta decidir: qué ve Lucía si su materia pendiente se fusiona con otra que no era la que quiso decir, si puede objetar o solo se entera.
