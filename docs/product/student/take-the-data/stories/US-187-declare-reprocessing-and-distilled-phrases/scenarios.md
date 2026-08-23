# US-187: Declarar el reproceso y la destilación

> Los casos de [US-187](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que la Ficha de cátedra Pérez se reprocesó por última vez el 19 de agosto de 2026
Cuando alguien la lee ese mismo día
Entonces ve, en el pie de la ficha, "esta lista se reprocesa" junto con la fecha exacta con la que se está leyendo ("leída el 19/8/2026"), no una fecha de cuándo se reseñó.

**E2.** Dado que "Toman lo que no dieron" es una frase destilada de comentarios, aprobada por quien cura las frases con sujeto materia y eje gestión
Cuando se muestra en la lista de frases de gestión de una ficha
Entonces aparece marcada como "síntesis" al lado de su proporción, distinta de una frase semilla como "Hay clases que no se dan" (F18), que no lleva esa marca.

**E3.** Dado que "Toman lo que no dieron" tiene, en un período dado, sus propias voces sobre el total de esa cursada
Cuando Rocío descarga el CSV
Entonces la fila de esa frase lleva la misma marca de destilada que se ve en la ficha.

## Negativos

**N1.** Dado que "Toman lo que no dieron" todavía está en la cola de curaduría de Frases, sin sujeto ni eje asignado
Cuando alguien reseña la Cátedra Pérez
Entonces esa frase no se ofrece para marcar y no aparece en ninguna ficha ni en el CSV: recién se ofrece, marcada como destilada, después de que quien cura las frases la apruebe con sujeto y eje (US-199).

## Edge cases

- El comentario retirado de Matías (2023, segundo cuatrimestre) sigue alimentando el pipeline de destilación aunque nadie pueda leerlo en ninguna ficha (ADR-0068, punto 7).
- Quien cura las frases corrige el eje de "Hay clases que no se dan" (F18): la corrección reprocesa todas las fichas que usan F18, y Método declara el cambio con autor y fecha (US-198). **Falta decidir**: cómo se versiona el catálogo para que una cita puntual de Rocío sea exactamente reproducible más allá de declarar la fecha de lectura.
