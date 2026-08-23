# US-204: Que la reforma no parta el corpus

> Los casos de [US-204](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que "Ingeniería en Sistemas" (UNSTA) tiene Plan 2019 (deprecado, sigue existiendo para quien ya lo cursa) y Plan 2024 (vigente, el que se ofrece a quien entra ahora).
Cuando Sofía carga el plan nuevo.
Entonces Plan 2019 no se borra ni se reemplaza: los dos planes coexisten, cada uno con su año.

**E2.** Dado que "Análisis Matemático I" es la materia canónica de "Ingeniería en Sistemas" (UNSTA) tanto en el Plan 2019 como en el Plan 2024: bajo el Plan 2019 acumuló 70 voces de reseñas cursadas entre 2019 y 2023 (38 de ellas marcaron F01 "Es dura de verdad"), y bajo el Plan 2024 acumuló 50 voces de reseñas cursadas desde 2024 (22 marcaron F01).
Cuando alguien abre la Ficha de materia de "Análisis Matemático I".
Entonces las reseñas de las dos épocas se suman en la misma ficha: 120 voces en total, 60 marcaron F01, 50% en crudo publicado con su encogimiento en 41,2%, porque cada reseña quedó pegada al período en que se cursó y a la materia canónica, no a la fila del plan.

## Negativos

**N1.** Dado el mismo caso de "Análisis Matemático I" bajo el Plan 2019 y el Plan 2024. Cuando se calcula la cobertura de "Ingeniería en Sistemas" (UNSTA), cuántas materias canónicas tienen voces sobre el total (D04). Entonces "Análisis Matemático I" cuenta como una sola materia canónica con voces, no como dos materias distintas que duplicarían el denominador.

## Edge cases

- Alguien nombra al reseñar una materia que existía en el Plan 2019 pero ya no está en el Plan 2024: entra como pendiente de vincular contra la materia canónica (US-197), igual que cualquier materia declarada.
- Dos ofertas de la misma institución en dos planes: si Dónde estudiarla las compara como una columna sola o como dos no está definido (Falta decidir, la épica lo deja abierto explícitamente).
- La Ficha de carrera listando uno o los dos años del plan: no está definido (Falta decidir, la épica lo deja abierto explícitamente).
