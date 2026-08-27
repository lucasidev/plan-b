# US-150: Declarar que faltaron clases

> **Concepto rebasado el 2026-08-25**: ver la nota en el [README](README.md). Estos escenarios describen el comportamiento vigente del ítem "¿Se dictaron las clases?", no la declaración numérica original.

## Camino feliz

**E1.** Dado que Matías cursó la cátedra Pérez de Análisis Matemático II y en el paso 4 responde "Faltaron muchas" al ítem "¿Se dictaron las clases?".
Cuando envía la reseña y la cátedra ya tiene 10 reseñas o más.
Entonces "Faltaron muchas" entra a la distribución de ese ítem en la Ficha de cátedra, con su proporción y sus voces, junto con "Casi todas" y "Faltaron algunas".

## Negativos

**N1.** Dado que Lucía cursó la misma cátedra Pérez pero saltea el ítem "¿Se dictaron las clases?", Cuando envía su reseña, Entonces esa reseña no entra al denominador de ese ítem: no suma ni a "Faltaron muchas" ni a ninguna otra opción.

## Edge cases

- Ya no existe una pregunta de seguimiento ("¿cuántas, más o menos?") ni un valor numérico que declarar: la única señal es la opción elegida.
- Si en el paso 2 la cátedra queda en "No sé", el paso 4 completo no se ofrece: tampoco este ítem.
- Ninguna ficha publica un promedio, mediana o rango de clases faltantes: solo la distribución de las tres opciones.
