# US-164: Marcar el sentido contrario de una frase

> Los casos de [US-164](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que en la cátedra Pérez de Análisis Matemático II, período 2025-C2, hay 120 voces totales de esa cursada (hayan marcado una frase o no), de las cuales 60 marcaron F18 (Hay clases que no se dan, 41,2%, límite inferior de Wilson con z = 1.96).
Cuando Lucía, que tuvo todas sus clases con esa cátedra en ese mismo período, reseña su cursada y marca F17 (Las clases se dan) en vez de reportar.
Entonces su voz suma a F17 y las dos frases opuestas conviven: F17 publica 1 de 121 (0,1%) y F18 conserva sus 60 marcas intactas, que ahora se leen sobre 121 voces (40,8%, antes 41,2%). Marcar la contraria no le resta ni una voz a F18: lo único que se movió es el denominador, que es compartido (ADR-0075).

## Negativos

**N1.** Dado que F18 y F17 tienen cada una su proporción publicada sobre las mismas 120 voces de esa cursada, Cuando se calcula cualquiera de las dos, Entonces el sistema nunca resta una de la otra ni fuerza que sumen 100%: cada una se computa de forma independiente.

## Edge cases

- Cerrado (2026-08-24, con el flujo por temas): el par es un solo control con dos salidas; el contrario está al lado, sin aviso aparte.
- Los dos lados de un par son excluyentes en la misma reseña: marcar "Las clases se dan" cuando "Hay clases que no se dan" estaba marcada reemplaza la marca, nunca conviven (regla 2 del catálogo).
- Cerrado (2026-08-24): la destilada entra sola o en par según la regla 2 del catálogo (el opuesto existe solo si es un hecho que alguien afirme); US-199 no exige el par al aprobar.
