# US-162: Ver qué cambió con mi aporte

> Los casos de [US-162](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Matías respondió "Faltaron muchas" en la pregunta "¿Se dictaron las clases?" al reseñar la cátedra Pérez (antes de su reseña, esa opción tenía 11 de 39 voces).
Cuando entra a Mis aportes.
Entonces ve, junto a esa reseña, que "Faltaron muchas" ahora suma 12 de 40 voces (18,1 %, límite inferior de Wilson con z = 1.96).

## Negativos

**N1.** Dado que Matías dejó sin responder todas las preguntas del paso 5 (Qué te pasó a vos) al reseñar, Cuando entra a Mis aportes, Entonces no ve ahí ninguna pregunta de ese paso: no eligió ninguna opción para mostrar; sí ve las opciones que eligió en las preguntas que sí respondió.

## Edge cases

- Si otra persona responde después la misma pregunta con la misma opción, el número de voces que Mis aportes le muestra a Matías sube, aunque él no vuelva a reseñar.
