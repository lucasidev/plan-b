# US-187: Declarar el reproceso y la destilación

> Los casos de [US-187](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que la Ficha de cátedra Pérez se reprocesó por última vez el 19 de agosto de 2026
Cuando alguien la lee ese mismo día
Entonces ve, en el pie de la ficha, "este catálogo se reprocesa" junto con la fecha exacta con la que se está leyendo ("leída el 19/8/2026"), no una fecha de cuándo se reseñó.

**E2.** Dado que "Toman lo que no dieron" es un ítem destilado del campo libre, aprobado por quien cura el catálogo, en la capa de conducta observable
Cuando se muestra en el bloque de conducta observable de una ficha
Entonces aparece marcado como "síntesis" al lado de su moda y su distribución, distinto de un ítem semilla como "¿Se dictaron las clases?", que no lleva esa marca.

**E3.** Dado que "Toman lo que no dieron" tiene, en un período dado, sus propias voces sobre el total de esa cursada
Cuando Rocío descarga el CSV
Entonces la fila de ese ítem lleva la misma marca de destilado que se ve en la ficha.

## Negativos

**N1.** Dado que "Toman lo que no dieron" todavía está en la cola de curaduría de Frases, sin capa asignada
Cuando alguien reseña la Cátedra Pérez
Entonces ese ítem no se ofrece para responder y no aparece en ninguna ficha ni en el CSV: recién se ofrece, marcado como destilado, después de que quien cura el catálogo lo apruebe con su capa (US-199).

## Edge cases

- El campo libre de Matías (2023, segundo cuatrimestre) sigue alimentando el pipeline de destilación aunque nadie pueda leerlo nunca en ninguna ficha (ADR-0084).
- Quien cura el catálogo corrige la capa de "¿Se dictaron las clases?": la corrección reprocesa todas las fichas que usan ese ítem, y Método declara el cambio con autor y fecha (US-198). **Falta decidir**: cómo se versiona el catálogo para que una cita puntual de Rocío sea exactamente reproducible más allá de declarar la fecha de lectura.
