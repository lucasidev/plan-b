# US-148: Que nadie sepa que fui yo

**Épica**: [Reseñar](../../README.md)
**Del mapa**: O4-4

## Historia

Como quien está cursando, quiero que nadie sepa que fui yo, para poder decir lo que pasó sin que me cueste la cursada.

## Listo cuando

- Ninguna reseña se publica individual: lo que se publica es el agregado por cátedra (la moda y la distribución de cada frase, con sus voces), y recién desde que la cátedra junta 10 reseñas ([ADR-0082](../../../../../decisions/0082-the-review-captures-the-cursada-in-three-layers.md), [ADR-0083](../../../../../decisions/0083-the-ficha-publishes-counts-not-scores.md)).
- Nunca se publica el nombre, la cuenta ni el rol de quien reseñó, ni cómo terminó su cursada.

## Dónde se resuelve

- [Reseñar](../../screens/SC-015-write-review/README.md): pide cómo terminó como dato de contexto (paso 3), pero el paso 6 avisa que las respuestas se suman al total de la cátedra y que ninguna reseña individual se muestra jamás.
- [Anonimato](../../screens/SC-013-anonymity/README.md): dice, antes de reseñar, exactamente qué se publica y qué no.
- [Mis aportes](../../../undo/screens/SC-018-my-contributions/README.md): muestra cómo terminó cada cursada como registro propio, nunca como algo público.
- [Mi perfil](../../../undo/screens/SC-019-my-profile/README.md): tampoco publica nada de lo que aportaste; nada de "por dónde vas" sale de ahí en público.
