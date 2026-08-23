# US-165: Editar o borrar lo que conté

> Los casos de [US-165](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Matías reseñó Análisis Matemático II, Cátedra Pérez, UNSTA, 1C 2025, marcando la frase "Hay clases que no se dan" (F18), que hoy suma 12 de 40 voces (18,1%, ADR-0075).
Cuando Matías entra a Mis aportes, abre ese aporte en Editar y saca la marca de F18 sin borrar el resto del aporte.
Entonces el aporte se actualiza y F18 pasa a sumar 11 de 40 voces (calcular el porcentaje nuevo): la cursada sigue teniendo 40 voces en total, porque Matías sigue siendo una de ellas.

**E2.** Dado que Matías reseñó Análisis Matemático II, Cátedra Pérez, UNSTA, 1C 2025, marcando "Hay clases que no se dan" (F18, 12 de 40 voces, 18,1%) y "Te tratan con respeto" (F25, 25 de 40 voces, calcular el porcentaje).
Cuando Matías entra a Mis aportes, elige borrar ese aporte y confirma que no se puede deshacer.
Entonces el aporte deja de contar en cualquier lado: F18 pasa a 11 de 39 voces (16,5%), F25 pasa a 24 de 39 voces (45,9%), y la cursada pasa a tener 39 voces en total.

**E3.** Dado que Lucía tiene publicado un comentario en su reseña de Análisis Matemático II, Cátedra Pérez, UNSTA, ya aprobado por el chequeo previo.
Cuando Lucía entra a Editar y cambia el texto del comentario por uno nuevo que no identifica a nadie ni habla de un tercero fuera de su acto público, y guarda.
Entonces el comentario editado vuelve a pasar el chequeo previo antes de republicarse, y al pasarlo limpio se publica al instante con el texto nuevo.

## Negativos

**N1.** Dado que un aporte publicado le pertenece a Lucía.
Cuando Matías intenta entrar a Editar ese aporte.
Entonces se lo rechaza: a Editar solo entra el dueño del aporte, Matías no puede ver ni tocar aportes de otra cuenta.

**N2.** Dado que Lucía edita su comentario y escribe algo que habla de una persona fuera de su acto público (por ejemplo, de la vida privada de un docente, no de su forma de dar clase).
Cuando guarda la edición.
Entonces el comentario editado no se publica al instante: queda retenido hasta que alguien del equipo lo mire, y se le avisa a Lucía; mientras tanto, las frases que había marcado siguen contando igual.

**N3.** Dado que Matías tiene un aporte publicado con el comentario ya aprobado y la frase F18 marcada.
Cuando entra a Editar, destilda F18 sin tocar el texto del comentario, y guarda.
Entonces el comentario no vuelve a pasar el chequeo previo, porque no lo tocó: solo se actualiza el conteo de F18.

**N4.** Dado que Diego declaró que entró en 2019 y que se fue en 2023, dos hechos de trayectoria distintos.
Cuando quiere sacar los dos de una sola acción.
Entonces no existe un borrado en bloque: cada hecho se borra de a uno, con su propio botón Borrar al lado, nunca los dos juntos.

## Edge cases

- Una reseña con réplica ya publicada de la cátedra: Matías la edita o la borra igual, de a una.
- Una reseña pendiente de vincular (la materia que nombró todavía no está en el catálogo) se edita igual, con el aviso de que todavía no cuenta en ninguna ficha.
- Un comentario que ya está retenido por el chequeo previo se vuelve a editar antes de que alguien del equipo lo haya mirado la primera vez.

**Falta decidir**: qué pasa con una réplica ya publicada si Matías edita o borra después el testimonio que la motivó, ni ADR-0068 ni el flujo de Replicar lo dicen.
