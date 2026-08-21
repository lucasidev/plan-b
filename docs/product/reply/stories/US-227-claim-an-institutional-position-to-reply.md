# US-227: Pedir que verifiquen mi cargo antes de responder

**Épica**: [Replicar](../README.md)
**Del mapa**: ninguno (sale de [ADR-0073](../../../decisions/0073-the-team-verifies-who-replies-against-its-own-catalog.md))

## Historia

Como la institución, quiero pedir que verifiquen mi cargo antes de responder, porque la réplica la firmo con mi nombre y el puesto que tengo, y si cualquiera puede firmar por la institución lo que yo diga no vale nada.

## Listo cuando

- Se pide la verificación diciendo qué cargo se tiene en qué institución, y esa verificación es permiso: sin ella no hay campo de respuesta.
- El cargo que se elige sale de la lista corta de cargos genéricos del catálogo, no se escribe libre ([US-224](../../sustain-the-catalog/stories/US-224-normalize-institutional-position.md)).
- La réplica se publica con el nombre de la persona y su cargo, nunca a nombre de la institución sola.

## Dónde se resuelve

- [Verificar](../../care-for-what-is-published/screens/SC-022-verify/README.md): el camino del cargo institucional, donde se pide la verificación.
- [Responder](../screens/SC-020-respond/README.md): sin cargo verificado, no hay campo de respuesta.

## Notas

Es el par de [US-178](US-178-verify-identity-before-replying.md) para el cargo institucional: esa cubre al docente y esta a quien responde por la institución. Faltaba, y por eso dos stories de esta épica ([US-172](US-172-reply-with-a-verified-identity.md) y [US-174](US-174-compare-institutions-side-by-side.md)) asumían una réplica institucional que nadie podía habilitar.

Del otro lado del mostrador la resuelve [US-225](../../moderate-without-breaking-the-product/stories/US-225-verify-an-institutional-position.md): acá se pide, allá se aprueba o se rechaza. Y vence al año, como toda identidad verificada ([US-226](../../moderate-without-breaking-the-product/stories/US-226-revalidate-verified-identity-yearly.md)).

**Queda abierto**: cuál es la lista de cargos genéricos, que se arma cargando las primeras instituciones y no antes ([ADR-0073](../../../decisions/0073-the-team-verifies-who-replies-against-its-own-catalog.md)).
