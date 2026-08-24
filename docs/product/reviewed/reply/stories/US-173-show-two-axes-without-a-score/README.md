# US-173: Mostrar los dos ejes sin puntaje

> **Letra anterior a [ADR-0078](../../../../../decisions/0078-the-questionnaire-collects-in-pairs-the-ficha-reports-by-theme.md)**: la cabecera dual y las listas por eje que este "listo cuando" pide ya no existen (la ficha informa por tema; la atribución viaja en cada hecho). El espíritu sigue vigente: que se vea que doy bien mi materia, sin puntaje. La letra se reescribe con la spec de la ficha; el ID no cambia.

**Épica**: [Replicar](../../README.md)
**Del mapa**: O7-2

## Historia

Como el docente, quiero que se vea que doy bien mi materia, porque es la primera vez que alguien lo mide.

## Listo cuando

- La ficha de cátedra publica los dos ejes sin mezclarlos: la cabecera con las dos proporciones y, por eje, la lista de frases con sus voces.
- Exigencia alta se lee como información, no como falla; en ningún lado hay un puntaje.

## Dónde se resuelve

- [Ficha de cátedra](../../../../student/choose-where-to-study/screens/SC-002-chair/README.md): la cabecera publica los dos ejes sin mezclar, cada uno con su proporción.
