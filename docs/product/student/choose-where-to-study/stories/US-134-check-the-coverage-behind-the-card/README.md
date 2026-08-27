# US-134: Saber para cuánta carrera vale un dato

**Épica**: [Elegir dónde estudiar](../../README.md)
**Del mapa**: O1-8

## Historia

Como quien está eligiendo, quiero saber si lo que dice la ficha de la carrera vale para toda la carrera o para tres materias, porque un problema en dos materias no es una carrera rota.

## Listo cuando

- La Ficha de carrera muestra siempre cuánta cobertura tiene ("23 de 51 materias"), nunca oculta detrás de un umbral.
- Lo que "qué frena la cursada" todavía no incluye es porque esas materias no llegaron al piso de 10 reseñas en ninguna de sus cátedras, y la ficha lo dice ("las 28 restantes todavía no juntan las 10 reseñas del piso").
- Ningún dato derivado se arma con menos de 10 reseñas en una cátedra.

## Dónde se resuelve

- [Ficha de carrera](../../screens/SC-001-career/README.md): la cobertura es una sección propia, siempre a la vista; "qué frena la cursada" muestra solo lo que ya alcanzó el piso.
- [Ficha de materia](../../screens/SC-007-subject/README.md): la cátedra que todavía no llega al piso se lista con su cuenta y cuánto le falta, sin sumar a los números de la materia.
- [Dónde estudiarla](../../screens/SC-008-where-to-study/README.md): cada oferta comparada muestra su propia cobertura.

## Notas

P1. Esta story ya no depende de un gate que oculte una cabecera derivada: [ADR-0083](../../../../../decisions/0083-the-ficha-publishes-counts-not-scores.md) retiró esa mecánica. La cobertura es una sección honesta que se muestra siempre; el piso de 10 reseñas por cátedra ([ADR-0082](../../../../../decisions/0082-the-review-captures-the-cursada-in-three-layers.md)) es lo único que de verdad condiciona qué entra a un número.
