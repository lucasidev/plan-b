# US-227: Pedir que verifiquen mi cargo antes de responder

**Épica**: [Responder](../../README.md)
**Del mapa**: ninguno (sale de [ADR-0073](../../../../../decisions/0073-the-team-verifies-who-replies-against-its-own-catalog.md))

## Historia

Como la institución, quiero pedir que verifiquen mi cargo antes de responder, porque la respuesta la firmo con mi nombre y el puesto que tengo, y si cualquiera puede firmar por la institución lo que yo diga no vale nada.

## Listo cuando

- Se pide la verificación diciendo qué cargo se tiene en qué institución, y esa verificación es permiso: sin ella no hay campo de respuesta.
- El cargo que se elige sale de la lista corta de cargos genéricos del catálogo, no se escribe libre ([US-224](../../../../team/sustain-the-catalog/stories/US-224-normalize-institutional-position/README.md)).
- La respuesta se publica con el nombre de la persona y su cargo, nunca a nombre de la institución sola.

## Dónde se resuelve

- [Verificar](../../../../student/care-for-what-is-published/screens/SC-022-verify/README.md): el camino del cargo institucional, donde se pide la verificación.
- [Responder](../../screens/SC-020-respond/README.md): sin cargo verificado, no hay campo de respuesta.

## Notas

Es el par de [US-178](../US-178-verify-identity-before-replying/README.md) para el cargo institucional: esa cubre al docente y esta a quien responde por la institución. Faltaba, y por eso [US-172](../US-172-reply-with-a-verified-identity/README.md) asumía una respuesta institucional que nadie podía habilitar.

Del otro lado del mostrador la resuelve [US-225](../../../../team/moderate-without-breaking-the-product/stories/US-225-verify-an-institutional-position/README.md): acá se pide, allá se aprueba o se rechaza. Y vence al año, como toda identidad verificada ([US-226](../../../../team/moderate-without-breaking-the-product/stories/US-226-revalidate-verified-identity-yearly/README.md)).

**Queda abierto**: cuál es la lista de cargos genéricos, que se arma cargando las primeras instituciones y no antes ([ADR-0073](../../../../../decisions/0073-the-team-verifies-who-replies-against-its-own-catalog.md)). A qué responde ya está decidido (el instrumento administrativo: trámites, título, trato, [ADR-0073](../../../../../decisions/0073-the-team-verifies-who-replies-against-its-own-catalog.md) y [ADR-0085](../../../../../decisions/0085-three-instruments-and-official-data.md)), pero dónde se ve ese bloque en la Ficha de institución todavía no está dibujado (ver "Lo que esta épica todavía no resuelve" en el README de la épica).
