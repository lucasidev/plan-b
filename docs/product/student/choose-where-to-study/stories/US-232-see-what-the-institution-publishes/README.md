# US-232: Ver qué publica cada institución y qué no

**Épica**: [Elegir dónde estudiar](../../README.md)
**Del mapa**: O1-1

## Historia

Como quien está eligiendo, quiero ver qué publica cada institución de lo que la ley y la práctica esperan que publique, para pesar la opacidad al elegir y para poder nombrarla.

## Listo cuando

- La ficha de institución lista, con una fila por campo, si publica sus actas, su presupuesto, su nómina docente y sus acreditaciones al día, cada fila con su estado y la fecha en que se buscó.
- Un campo que la institución no publica se dice como tal, con la fecha, y se distingue de uno que sí publica y de uno que no le aplica. Ninguna fila queda en blanco ni desaparece.
- "Ver fuentes" lista las URL donde se buscó cada campo, publique o no.

## Dónde se resuelve

- [Ficha de institución](../../../../reviewed/reply/screens/SC-005-institution/README.md): el checklist de transparencia, debajo de la cabecera de identidad. La ficha la gobierna [Responder](../../../../reviewed/reply/README.md); esta story la lee quien está eligiendo.

## Notas

Sale del hallazgo F01 de la [revisión campo por campo](../../../../../history/reviews/2026-09-07-official-data-fields.md): la tesis y [ADR-0085](../../../../../decisions/0085-three-instruments-and-official-data.md) piden estos campos y [SC-005](../../../../reviewed/reply/screens/SC-005-institution/README.md) los dibuja, pero ninguna story los nombraba, así que el tracker no los podía planificar por ID.

Cada fila es una afirmación fechada del modelo de [ADR-0090](../../../../../decisions/0090-an-official-datum-is-a-dated-claim-with-value-source-and-status.md), no una columna de la institución.

Las universidades privadas no publican actas, presupuesto ni nómina, y la ley solo las obliga por los fondos públicos que reciben ([O06](../../../../../history/reviews/2026-09-07-official-data-sources.md)). Que el checklist diga "no publicado" en varias filas no es un hueco del relevamiento: es el dato.
