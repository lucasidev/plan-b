# US-229: Entrar y volver a lo que estaba haciendo

**Épica**: [Entrar](../../README.md)
**Del mapa**: ninguno (sale de la revisión de pantallas sin story dueña, 2026-08-21)

## Historia

Como quien ya tiene cuenta y quedó con una acción a medias, quiero entrar y que me devuelva justo a donde estaba, porque si me deja en el inicio tengo que buscar de nuevo lo que iba a hacer y capaz ya no lo hago.

## Listo cuando

- Cuando llegué disparando una acción, la pantalla dice con esas mismas palabras por qué estoy acá ("para reseñar esta cursada, necesitás una cuenta").
- Al entrar, la sesión se abre y vuelvo al lugar exacto del que venía, con la acción que me trajo completada; si no venía de ninguna, al lugar por defecto.
- Un mail o una contraseña que no coinciden avisan sin borrar lo que escribí y sin decir cuál de los dos falló.

## Dónde se resuelve

- [Ingresar](../../screens/SC-025-sign-in/README.md): el motivo, el formulario, los dos links y el estado de credenciales que no coinciden.

## Notas

Faltaba, por lo mismo que [US-228](../US-228-create-the-account-when-the-action-asks-for-it/README.md): Ingresar tenía fichas de otras épicas apuntándole ("pide cuenta") y ninguna story que la pidiera. Que el gate esté en la acción y no en la puerta es garantía de [US-168](../../../../guarantees/US-168-read-without-an-account/README.md); lo que pasa una vez que el gate se cruza es esto.

El tercer criterio es la contracara del hueco que [US-228](../US-228-create-the-account-when-the-action-asks-for-it/README.md) deja abierto: acá el aviso no distingue cuál de los dos campos falló, justamente para no confirmar si el mail existe.
