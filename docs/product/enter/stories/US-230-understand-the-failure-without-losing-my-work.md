# US-230: Entender que se rompió sin perder lo que venía cargando

**Épica**: [Entrar](../README.md)
**Del mapa**: ninguno (sale de la revisión de pantallas sin story dueña, 2026-08-21)

## Historia

Como quien estaba en el medio de reseñar, quiero entender que algo se rompió y no perder lo que ya contesté, porque si lo pierdo no lo vuelvo a cargar y esa reseña no existe nunca.

## Listo cuando

- Dice qué pasó en palabras, sin jerga ni código de error a la vista, y ofrece reintentar o volver a Explorar.
- Si estaba reseñando, lo que ya contesté quedó guardado solo y hay un link para retomarlo desde ahí ([US-161](../../write-a-review/stories/US-161-resume-a-draft-review.md)).

## Dónde se resuelve

- [Error](../screens/SC-023-error/README.md): el mensaje, las dos salidas y el link para retomar lo que quedó a medias.

## Notas

Era la tercera pantalla sin story dueña. A diferencia de Registro e Ingresar, esta no es una acción que alguien decida hacer: es el estado en el que cae cualquier pantalla cuando algo falla. Aun así es una story y no una garantía transversal, porque tiene un criterio propio y verificable que ninguna otra épica sostiene: que lo cargado sobreviva a la falla.

Es el único lugar del producto donde una falla técnica es requisito de producto. El resto de los casos de red y de sesión son casos borde de cada escenario, no letra de una story.

**Queda abierto**: si el copy distingue 404 de 500, que la ficha de Error ya deja anotado.
