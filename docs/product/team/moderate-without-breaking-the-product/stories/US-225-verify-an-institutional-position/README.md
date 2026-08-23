# US-225: Verificar un cargo institucional

**Épica**: [Moderar sin romper el producto](../../README.md)
**Del mapa**: ninguno (sale de [ADR-0073](../../../../../decisions/0073-the-team-verifies-who-replies-against-its-own-catalog.md))

## Historia

Como quien verifica, quiero comparar contra el catálogo a quien dice tener un cargo en una institución, en su propia cola, porque sin ese permiso no se publica ninguna réplica institucional.

## Listo cuando

- La identidad de quien dice tener un cargo institucional se prueba contra los cargos que el catálogo ya tiene cargados de esa institución, en su propia cola; sin eso no se publica ninguna réplica institucional.
- Si el catálogo todavía no tiene ese cargo cargado, el pedido no se rechaza: pasa a cargarse como trabajo de catálogo y se resuelve cuando el dato está.
- Aprobar o rechazar queda con autor y fecha; rechazar no habilita la réplica y no marca a nadie.

## Dónde se resuelve

- [Verificaciones](../../screens/SC-032-verifications/README.md): el cargo institucional tiene su propia cola; se prueba contra los cargos que el catálogo ya tiene cargados de esa institución.
- [Verificar](../../../../student/care-for-what-is-published/screens/SC-022-verify/README.md): el camino de cargo institucional, con el aviso de que se compara contra lo que el catálogo ya sabe de esa institución.

## Notas

depende de US-224 (los cargos institucionales normalizados en el catálogo, en Sostener el catálogo); no existe todavía la story del lado de quien tiene el cargo pidiendo verificarse, análoga a US-178 para el docente.
