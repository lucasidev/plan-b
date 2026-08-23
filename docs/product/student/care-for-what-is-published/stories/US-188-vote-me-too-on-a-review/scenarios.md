# US-188: Sumar una voz sin escribir

> Los casos de [US-188](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Lucía reseñó Análisis Matemático II (Cátedra Fernández, UNSTA, período 2026-C1) marcando F18 (Hay clases que no se dan) y F01 (Es dura de verdad), con un comentario
Cuando Matías toca "a mí también me pasó" sobre el testimonio de Lucía
Entonces el voto es uno solo sobre toda la reseña, nunca sobre una frase suelta: suma la voz de Matías a F18 y a F01 a la vez, no a una sin la otra.

**E2.** Dado que antes del voto la cursada de Análisis Matemático II en 2026-C1 tiene 40 voces en total, F18 está en 12 de esas 40 (18,1%, ADR-0075), y Matías no había participado antes en esa cursada (ni la reseñó ni votó otra reseña de ella)
Cuando Matías vota el testimonio de Lucía
Entonces la cursada pasa a tener 41 voces y F18 pasa a 13 de 41 (19,6%): Matías se suma a la unión de frases que sostiene, que en este caso es la de Lucía.

**E3.** Dado que en la Ficha de cátedra los testimonios se ordenan por votos, el de Lucía tiene 2 y otro testimonio ya publicado en la misma ficha tiene 5
Cuando varias personas votan "a mí también me pasó" sobre el testimonio de Lucía hasta que llega a 6
Entonces el testimonio de Lucía pasa a ordenarse antes que el que tenía 5.

**E4.** Dado que Matías no inició sesión
Cuando toca "a mí también me pasó" sobre el testimonio de Lucía
Entonces el sistema lo lleva a Ingresar con el motivo "para votar esta reseña, necesitás una cuenta", y al ingresar vuelve a la ficha con el voto ya aplicado.

## Negativos

**N1.** Dado que Diego reseñó una cursada de Análisis Matemático II marcando frases pero sin escribir comentario (su reseña suma voz en los conteos, pero no aparece como testimonio), cuando alguien quiere votar "a mí también me pasó" sobre esa reseña, entonces no hay dónde: sin comentario la reseña no aparece como testimonio y hoy no tiene ninguna superficie que reciba el voto.
**Falta decidir**: dónde se vota una reseña sin comentario (README de la épica; US-188 no lo resuelve).

**N2.** Dado que Matías ya votó "a mí también me pasó" sobre el testimonio de Lucía, cuando vuelve a tocar el mismo botón sobre el mismo testimonio, entonces no suma una segunda voz: sigue siendo una sola voz de Matías en esa cursada (ADR-0075, punto 3).
**Falta decidir**: si el voto se puede retirar una vez puesto (README de la épica); esto solo cubre que repetirlo no duplica la voz.

## Edge cases

- Votar la propia reseña: ni US-188 ni ADR-0068 dicen si una cuenta puede confirmar su propio testimonio.
- Un testimonio se baja después de haber sido votado: el texto se retira, pero las frases que marcó y los votos que sumó siguen contando como voces, porque se baja el texto, nunca la voz (glosario, "Exposición").
- Votar un evento institucional (no una cursada): ADR-0068 y US-188 lo tratan igual que una reseña de cursada.
