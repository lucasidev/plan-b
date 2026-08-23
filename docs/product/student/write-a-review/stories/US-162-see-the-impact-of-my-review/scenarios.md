# US-162: Ver qué cambió con mi aporte

> Los casos de [US-162](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Matías marcó la frase F18 al reseñar la cátedra Pérez (antes de su reseña, F18 tenía 11 de 39 voces) y escribió un comentario que ya tuvo 8 lecturas.
Cuando entra a Mis aportes.
Entonces ve, junto a esa reseña, que F18 ahora suma 12 de 40 voces (18,1%, límite inferior de Wilson con z = 1.96) y que su testimonio tuvo 8 lecturas.

## Negativos

**N1.** Dado que Matías reseñó sin escribir comentario (marcó solo frases), Cuando entra a Mis aportes, Entonces no ve ningún contador de lecturas para esa reseña, porque no generó testimonio; sí ve las voces que sumó cada frase que marcó.

## Edge cases

- Si otra persona vota la misma frase después ("a mí también me pasó"), el número de voces que Mis aportes le muestra a Matías sube, aunque él no vuelva a reseñar.
