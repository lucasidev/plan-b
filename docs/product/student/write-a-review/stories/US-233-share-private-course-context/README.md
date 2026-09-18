# US-233: Contar cómo cursé y cuántas veces

**Épica**: [Reseñar](../../README.md)
**Del mapa**: O4-1

## Historia

Como quien reseña una cursada, quiero contar cómo la cursé y cuántas veces lo intenté, porque ese contexto permite interpretar mi experiencia sin exponerlo en una ficha pública.

## Listo cuando

- Reseñar pregunta la modalidad (presencial, a distancia o mezcla) y cuántas veces cursé la materia, contando esta (una, dos, tres o más).
- Puedo saltear cualquiera de las dos preguntas, incluso después de haber elegido una opción, y lo salteado no deja una respuesta guardada.
- Las dos respuestas quedan en la capa de contexto y ningún read público las expone, aunque la cátedra haya cruzado el piso de publicación.

## Dónde se resuelve

- [Reseñar](../../screens/SC-015-write-review/README.md): las dos preguntas aparecen junto al período, la cátedra y cómo terminó, con opciones cerradas y saltear disponible.

## Notas

[ADR-0082](../../../../../decisions/0082-the-review-captures-the-cursada-in-three-layers.md) define ambas respuestas como contexto privado y establece que saltear siempre vale. El catálogo versionado las representa como preguntas de contexto; no nacen atributos paralelos de la reseña.
