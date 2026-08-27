# US-225: Verificar un cargo institucional

**Épica**: [Moderar sin romper el producto](../../README.md)
**Del mapa**: ninguno (sale de [ADR-0073](../../../../../decisions/0073-the-team-verifies-who-replies-against-its-own-catalog.md))

## Historia

Como quien verifica, quiero comparar contra el catálogo a quien dice tener un cargo en una institución, en su propia cola, porque sin ese permiso no se publica ninguna respuesta institucional.

## Listo cuando

- La identidad de quien dice tener un cargo institucional se prueba contra los cargos que el catálogo ya tiene cargados de esa institución, en su propia cola; sin eso no se publica ninguna respuesta institucional.
- Si el catálogo todavía no tiene ese cargo cargado, el pedido no se rechaza: pasa a cargarse como trabajo de catálogo y se resuelve cuando el dato está.
- Aprobar o rechazar queda con autor y fecha; rechazar no habilita la respuesta y no marca a nadie.

## Dónde se resuelve

- [Verificaciones](../../screens/SC-032-verifications/README.md): la cola de cargo institucional, separada de la de identidad docente y de la de constancias.
- [Verificar](../../../../student/care-for-what-is-published/screens/SC-022-verify/README.md): el camino del cargo institucional, con el aviso de que se compara contra los cargos que el catálogo ya tiene cargados de esa institución.

## Notas

Es el par de [US-210](../US-210-separate-the-teacher-identity-queue/README.md) para el cargo institucional: esa cubre al docente y esta a quien responde por la institución. Del otro lado del mostrador la pide [US-227](../../../../reviewed/reply/stories/US-227-claim-an-institutional-position-to-reply/README.md): acá se aprueba o se rechaza, allá se pide.
