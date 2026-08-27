# US-165: Editar o borrar lo que conté

> Los casos de [US-165](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Matías reseñó Análisis Matemático II, Cátedra Pérez, UNSTA, 1C 2025, respondiendo "Faltaron muchas" en "¿Se dictaron las clases?" (ítem I07), que hoy suma 12 de 40 voces.
Cuando Matías entra a Mis aportes, abre ese aporte en Editar y cambia esa respuesta a "Faltaron algunas", sin tocar el resto de la reseña.
Entonces esa respuesta se actualiza: "Faltaron muchas" pasa a sumar 11 de 40 voces y "Faltaron algunas" suma una más; la cursada sigue teniendo 40 voces en total, porque Matías sigue siendo una de ellas.

**E2.** Dado que Matías reseñó Análisis Matemático II, Cátedra Pérez, UNSTA, 1C 2025, respondiendo "Faltaron muchas" en "¿Se dictaron las clases?" (12 de 40 voces) y "Casi siempre" en "¿Salías de la clase entendiendo el tema?" (25 de 40 voces).
Cuando Matías entra a Mis aportes, elige borrar ese aporte y confirma que no se puede deshacer.
Entonces la reseña deja de contar en cualquier lado: "Faltaron muchas" pasa a 11 de 39 voces, "Casi siempre" pasa a 24 de 39 voces, y la cursada pasa a tener 39 voces en total.

**E3.** Dado que Lucía tiene una reseña de Análisis Matemático II, Cátedra Pérez, UNSTA, con algo escrito en el campo libre.
Cuando Lucía entra a Editar, cambia el texto del campo libre y guarda.
Entonces el cambio se guarda al instante, sin ningún chequeo: el campo libre nunca se publica, así que no hay nada que republicar.

## Negativos

**N1.** Dado que un aporte publicado le pertenece a Lucía.
Cuando Matías intenta entrar a Editar ese aporte.
Entonces se lo rechaza: a Editar solo entra el dueño del aporte, Matías no puede ver ni tocar aportes de otra cuenta.

**N2.** Dado que Lucía edita su campo libre y escribe algo que menciona a una persona por fuera de su rol público.
Cuando guarda la edición.
Entonces el texto se guarda igual, sin ningún chequeo ni retención: nunca se va a publicar, así que no hay nada que moderar antes de nada; las respuestas que había dado siguen contando igual.

**N3.** Dado que Matías tiene un aporte publicado con "Faltaron muchas" respondido en "¿Se dictaron las clases?" (ítem I07).
Cuando entra a Editar y vuelve esa respuesta a sin responder (la saltea), sin tocar el resto de la reseña.
Entonces I07 deja de contar la voz de Matías (pasa a 11 de 39 para ese ítem), mientras el resto de sus respuestas sigue contando sobre 40: saltear después de haber respondido también vale.

**N4.** Dado que Diego tiene reseñas publicadas de dos cursadas distintas (Análisis Matemático II y Programación I).
Cuando quiere sacar las dos de una sola acción.
Entonces no existe un borrado en bloque: cada reseña se borra de a una, con su propio botón Borrar al lado, nunca las dos juntas.

## Edge cases

- Una reseña pendiente de vincular (la materia que nombró todavía no está en el catálogo) se edita igual, con el aviso de que todavía no cuenta en ninguna ficha.
