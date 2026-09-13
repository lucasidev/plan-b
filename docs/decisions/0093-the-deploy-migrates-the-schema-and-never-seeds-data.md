# ADR-0093: The deploy migrates the schema and never seeds data

- **Estado**: aceptado
- **Fecha**: 2026-09-10
- **Revisado**: 2026-09-12

## Contexto

El stage anterior encadenaba migración, siembra y API dentro de un Compose. El 2026-09-10 `seed-db` falló por una clave única de períodos lectivos, la API nueva no arrancó y el stage terminó en 404. Los cuatro despliegues anteriores también habían fallado, pero la versión vieja siguió contestando y escondió la acumulación del problema.

El seed chequea parte de su idempotencia por identificador mientras la base protege algunas entidades por clave natural. Contra una base acumulada ambas reglas pueden divergir. Arreglar ese defecto es necesario para ejecutar una siembra manual con seguridad, pero no justifica que una carga de datos forme parte del ciclo de disponibilidad de la aplicación.

Resembrar en cada despliegue es conducta de development: allí el ambiente se recrea muchas veces y en distintas máquinas. Stage actualiza un producto que ya está en otra etapa y sus datos tienen que comportarse como en producción: persistir. Las cuentas, reseñas, cátedras y cargas de backoffice creadas al caminar el producto deben sobrevivir al despliegue siguiente.

## Decisión

**El despliegue de stage y producción migra el esquema y nunca siembra datos.**

1. La migración termina con éxito antes de desplegar la nueva versión de API y web. Una falla de migración corta el despliegue y lo deja en rojo.
2. `migrate-db` usa la misma imagen inmutable que la API y aplica las migraciones pendientes de los tres DbContexts y los recursos de Wolverine.
3. La API no aplica migraciones al arrancar en stage ni en producción.
4. Ningún workflow, proceso persistente ni despliegue ejecuta `seed-db`.
5. `seed-db` es una acción manual de una persona sobre un destino identificado explícitamente. No forma parte del estado saludable del despliegue.
6. Los datos de stage persisten. Un reset es una acción separada, explícita y destructiva, con identificación del recurso y backup previo.

La siembra automática de development queda fuera de este contrato porque prepara un ambiente local descartable, no despliega stage ni producción.

## Alternativas consideradas

**Arreglar la idempotencia y dejar el seed en el despliegue.** Corrige el choque conocido y conserva todos los futuros fallos de datos como causa de indisponibilidad. Descartada.

**Dejar que el seed falle sin cortar el despliegue.** Mantiene el producto arriba con una carga parcial y silenciosa. Descartada: la siembra no tiene que estar dentro del despliegue.

**Migrar al arrancar cada réplica de API.** Mezcla el ciclo de vida del schema con la disponibilidad, introduce carreras entre réplicas y dificulta saber qué falló. Descartada.

## Consecuencias

- Una falla de seed no puede impedir que API y web se desplieguen.
- Una falla de migración sí corta el despliegue antes de API y web.
- La compatibilidad entre schema y versiones exige migraciones expand/contract: el rollback de aplicación vuelve por SHA y el schema avanza por roll-forward.
- Los datos de stage divergen legítimamente del seed. Cargar una actualización o volver a cero exige una decisión humana.
- `seed-db` sigue teniendo riesgo sobre una base acumulada. Separarlo del despliegue reduce el radio de falla, no corrige su idempotencia.

## Refs

- [ADR-0058](0058-deterministic-seed-in-code-gated-by-environment.md): seed determinístico y sus límites.
- [ADR-0059](0059-production-startup-does-not-self-repair.md): Production no repara recursos al arrancar.
- [ADR-0089](0089-the-stage-follows-main-and-production-is-promoted-from-a-release.md): promoción de stage y producción.
- [ADR-0094](0094-dokploy-applications-are-the-deployment-lifecycle-unit.md): mecanismo de migración y orden del despliegue en Dokploy.
- [`backend/host/Planb.Api/Infrastructure/MigrateDbCommand.cs`](../../backend/host/Planb.Api/Infrastructure/MigrateDbCommand.cs) y [`backend/host/Planb.Api/Infrastructure/SeedDbCommand.cs`](../../backend/host/Planb.Api/Infrastructure/SeedDbCommand.cs).
- [`docs/engineering/deploy.md`](../engineering/deploy.md), [`docs/engineering/runbook.md`](../engineering/runbook.md) y [`docs/engineering/rollback.md`](../engineering/rollback.md).
