# US-231: Ver si lo que reseñé sirvió de algo

**Épica**: [Entrar](../../README.md)
**Del mapa**: ninguno (sale de la revisión de pantallas sin story dueña, 2026-08-30)

## Historia

Como quien ya reseñó, quiero ver al entrar si lo que dije ya publica o qué le falta, porque una vez reclamé solo y no sirvió de nada, y si esto va a ser lo mismo prefiero enterarme rápido.

## Listo cuando

- Al entrar veo las cátedras que reseñé, cada una con cuántas voces junta y si publica o no.
- La que no publica dice cuánto le falta, con el mismo número que muestra su ficha pública.
- Veo cuánto de mi carrera está medido (cuántas materias del plan tienen alguna cátedra publicando), y desde ahí llego a la ficha de la carrera.
- Si todavía no reseñé nada, la pantalla dice qué hace falta para que una cátedra publique y ofrece una sola acción, sin mostrarme una lista vacía.
- Ninguna de mis respuestas se muestra: veo qué cátedras reseñé y sus conteos, nunca qué contesté.
- No hay ningún puntaje, marcador ni progreso personal: la cobertura es del plan, no un logro mío.

## Dónde se resuelve

- [Inicio](../../screens/SC-011-home/README.md): la pantalla entera, sus dos estados y lo que no muestra.

## Notas

Esta story faltaba y la pantalla existía. Inicio se construyó como el aterrizaje del sign-in, sin que ninguna story la pidiera: es el mismo hallazgo que produjo [US-228](../US-228-create-the-account-when-the-action-asks-for-it/README.md) para Registro, y el mismo criterio (una acción concreta con su pantalla y su criterio es una story, no una garantía transversal).

Escribirla podó la pantalla. Un boceto previo tenía cuatro bloques y quedaron dos, porque al preguntar qué requisito servía cada uno aparecieron tres problemas: "tus reseñas" y "les falta una reseña" eran la misma lista con un estado por fila; el conteo de cuánto aportaste es un marcador personal, que es lo que [ADR-0083](../../../../../decisions/0083-the-ficha-publishes-counts-not-scores.md) rechaza llevado a la cuenta; y un feed de "lo que empezó a publicar" decía lo mismo que la cobertura, sobre cátedras con las que quien mira no tiene relación, y necesitaba una marca de última visita que no guardamos en ningún lado.

Mostrar "le falta una" de una cátedra bajo el piso no adelanta nada: ese número ya es público en la ficha de la cátedra, que dice "junta 3 reseñas: con 7 más se publica" ([ADR-0082](../../../../../decisions/0082-the-review-captures-the-cursada-in-three-layers.md)). Lo que no se muestra acá, como en ningún lado, son las respuestas.

La cobertura sale del mismo cálculo que [US-134](../../../choose-where-to-study/stories/US-134-check-the-coverage-behind-the-card/README.md) publica en la ficha de la carrera, leído para la carrera declarada de esta cuenta. No es una segunda definición de cobertura: es la misma, mirada desde adentro.
