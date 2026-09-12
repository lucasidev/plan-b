# Backend (planb)

.NET 10 modular monolith con tres bounded contexts: Identity, Academic y Reviews. La guía general está en [`../AGENTS.md`](../AGENTS.md); el código y los ADRs mandan sobre este resumen.

## Forma del cambio

- Un caso de uso vive como vertical slice en `Planb.<Module>.Application/Features/<UseCase>/`: command o query, handler, validator cuando aplica, endpoint, request y response.
- El endpoint sabe HTTP. El handler sabe dominio. El dominio no referencia ASP.NET Core, EF Core ni infraestructura.
- Writes y lógica de dominio usan EF Core a través de los límites del módulo. Reads complejos o cross-schema usan Dapper.
- Para un write nuevo usá el skill `slice-backend`. Para un read Dapper usá `dapper-read`. Para efectos cross-módulo usá `integration-event`.

## Invariantes

- Fallas de negocio: `Result<T>` y `Error`, nunca excepciones como control de flujo.
- Tiempo: `IDateTimeProvider.UtcNow`, nunca `DateTime.UtcNow`.
- Un `DbContext` y un schema por módulo. No hay navigation ni FK cross-schema.
- La comunicación cross-módulo usa contratos de Application para reads e integration events durables para efectos.
- Endpoints Carter bajo `/api/<module>/<resource>` y nombres `<Module>_<UseCase>`.
- Tablas y columnas en `snake_case`; identificadores de código en inglés; comentarios en español rioplatense.

## Verificación

- Unit test del módulo para dominio y handlers puros.
- Integration test cuando cambia SQL, persistencia, autorización o el contrato HTTP real.
- Después de cambiar DTO, validator o binding HTTP, el camino de integración es obligatorio: unit tests verdes no prueban el request real.
- Nunca corras dos suites de integración a la vez contra el Postgres compartido.

Referencias: [`../docs/engineering/testing.md`](../docs/engineering/testing.md), [ADR-0017](../docs/decisions/0017-persistence-ignorance.md) y [ADR-0045](../docs/decisions/0045-owned-by-receiver-for-cross-module-integration-events.md).
