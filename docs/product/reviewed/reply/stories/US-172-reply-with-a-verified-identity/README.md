# US-172: Responder con identidad verificada

**Épica**: [Responder](../../README.md)
**Del mapa**: O7-1

## Historia

Como el docente, quiero responder por mi cátedra con mi nombre, para que mi versión quede junto a los números de mi ficha, no abajo.

## Listo cuando

- La respuesta se publica al mandarla, con nombre y rol, y solo desde identidad verificada; no mueve ningún conteo ([ADR-0084](../../../../../decisions/0084-free-text-feeds-curation-and-is-never-published.md)).
- No hay chequeo previo ni plazo de retención: no existe un testimonio ni un autor anónimo al que proteger, porque el texto libre no se publica ([ADR-0084](../../../../../decisions/0084-free-text-feeds-curation-and-is-never-published.md)).

## Dónde se resuelve

- [Responder](../../screens/SC-020-respond/README.md): la pantalla completa, de punta a punta.
- [Ficha de cátedra](../../../../student/choose-where-to-study/screens/SC-002-chair/README.md): el bloque "Qué respondió la cátedra", con nombre y rol.
- [Ingresar](../../../../student/enter/screens/SC-025-sign-in/README.md): nombrada como ejemplo de acción que dispara el umbral de cuenta antes de responder; el detalle de esta story vive en Responder, no ahí.

## Notas

se parte al planificar; depende de US-178
