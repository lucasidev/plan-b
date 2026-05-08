# ADR-0034: Redis como capa de cache + ephemeral state

- **Estado**: aceptado
- **Fecha**: 2026-04-27

## Contexto

Hasta ahora todo el estado del backend vive en Postgres: aggregates persistentes (EF Core), read DTOs (Dapper), Wolverine outbox, verification tokens. Para Sprint S1 aparece el primer caso que no encaja bien en Postgres: refresh tokens revocables. Y en horizonte cercano aparecen cinco casos más (rate limiting, idempotency keys, hot reads cache, crowd insights cache, recently viewed).

Tomar la decisión "Redis-o-Postgres" caso por caso lleva a postergación indefinida y a duplicación de patrones (cada feature inventa su propio cache invalidation). Mejor decidirla una vez y dejar la puerta abierta.

Casos de uso esperados que motivan la decisión:

| Caso | Cuándo aterriza | Por qué Redis y no Postgres |
|---|---|---|
| Refresh token revocation list | S1 (US-021-b) | Lookup por hash + TTL nativo + revocación cheap en sign-out |
| Rate limiting login | S1/S2 | Counters atómicos + sliding window + TTL |
| Idempotency keys (write-review, register, etc.) | F5 reviews | TTL + atomic SETNX, evita duplicados por retry del cliente |
| Hot reads cache (Subject, Teacher, Commission, agregados) | F3-F5 | Materias y docentes son read-100x:write-1, refresh barato vs query a DB |
| Crowd-sourced insights del simulador | F6 | Agregaciones pesadas que no querés calcular en cada render |
| Recently viewed + autocomplete | UX detail | Sorted sets + prefix matching |

## Decisión

**Redis self-hosted como capa de cache + ephemeral state.** Container en `docker-compose.yml`, connection string via `.env`, `scripts/ensure-infra.ts` lo levanta y le asigna puerto libre como hace con Postgres y Mailpit. Lib `StackExchange.Redis` en el stack del backend.

Patrón de uso en código:

- Abstracción genérica `IRedisConnection` en `Planb.SharedKernel.Abstractions.Cache` (devuelve `IDatabase` de StackExchange.Redis).
- Abstracciones específicas por caso de uso en cada módulo: `IRefreshTokenStore` en Identity, `IRateLimiter` en Identity, `ISubjectCache` en Academic cuando aterrice, etc. Cada una usa `IRedisConnection` por dentro pero expone una API alineada al dominio.
- Nada de Redis raw client en handlers. Los handlers reciben la abstracción de su módulo.

## Alternativas consideradas

### A. Postgres-only (rechazada)

Refresh tokens en una tabla `identity.refresh_tokens` (mismo patrón que `verification_tokens`), rate limiting con tabla `identity.login_attempts` y query de window, hot reads sin cache (siempre query). Funciona para el inicio. Cuando lleguen hot reads de catálogo (F3-F5), latencias notables y cache invalidation ad-hoc se vuelven dolor. Migración Postgres → Redis a mitad del proyecto cuesta más que adoptarlo ahora.

### B. Redis ahora (elegida)

Un container más + lib + ADR. Ese costo único habilita los seis casos de uso de la tabla sin reabrir la decisión cada vez. Operacionalmente es trivial en dev (Podman lo levanta como Postgres). En producción es una pieza más para monitorear, pero simple comparado con un broker o un search engine.

### C. In-memory dentro del proceso del backend (rechazada)

`IMemoryCache` para cache, dictionary in-memory para refresh tokens revocados. Ventaja: cero infra. Desventaja: no sobrevive restarts, no escala horizontal (cada réplica tiene su propia memoria, refresh revocado en una no se ve en otra). Para refresh tokens significa invalidar todas las sesiones en cada deploy. Inviable.

## Boundaries

- **Redis no es source of truth.** Source of truth siempre es Postgres. Toda key en Redis es derivada de algo persistente o es genuinamente ephemeral (counters de rate limiting).
- **Toda key en Redis tiene TTL explícito.** Nada permanente. Convención: TTL ≤ 30 días.
- **Si Redis no responde, los handlers degradan, no fallan completamente.**
  - Cache miss → consulta a DB (costo: una request más lenta).
  - Rate limiter no disponible → fail open con warning log (preferimos servir un poco más vs cortar todo).
  - Refresh tokens no validables → 401, user se relogea (fail safe).
- **Cache invalidation se hace por TTL + invalidación explícita en writes.** No event-driven cross-module por ahora: esa complejidad solo justifica si vemos staleness real en producto.
- **Out of scope para Redis en este proyecto:**
  - Pub/Sub (Wolverine outbox cubre messaging).
  - Message queue (Wolverine outbox).
  - Vector search (pgvector).
  - Source of truth de cualquier dato.

## Consecuencias

**Positivas:**

- Una decisión única que cubre los seis casos esperados sin reabrir cada vez.
- Patrones canónicos documentados (cache-aside, sliding window rate limiter, revocation list, SETNX idempotency): no inventamos en cada PR.
- Habilita performance work futuro sin ADR adicional.
- Permite, si llega el momento, escalar el backend horizontalmente sin perder coherencia de sesiones / rate limits.

**Negativas:**

- Container nuevo en dev (`planb-redis`), lib nueva (`StackExchange.Redis`), env var nuevo (`Redis__ConnectionString`), una doc más para mantener.
- Operacional: si va a prod, alguien lo monitorea (memoria, eviction, conexiones).
- Tentación de poner cosas que pertenecen a Postgres "para que vayan más rápido". **Mitigación**: en code review se valida que cada uso de Redis encaje en uno de los patrones canónicos de la tabla de casos de uso. Si no encaja, va a Postgres.

## Cuándo revisitar

- Si en 3 meses la tabla de casos de uso sigue teniendo solo 1-2 entradas activas (refresh + rate limiting), considerar mover esos a Postgres y deprecar Redis. La decisión se justifica solo si se aprovecha.
- Si emerge un caso que pide pub/sub seriamente, evaluar Redis Streams o Postgres `LISTEN/NOTIFY` (no agregar Redis-by-default si Wolverine outbox no aplica).
- Si la operación de Redis en producción (memoria, monitoring, backups) se vuelve un peso desproporcionado al beneficio, replantear.

Refs: [ADR-0017](0017-persistence-ignorance.md), [ADR-0018](0018-ef-core-writes-dapper-reads.md), [ADR-0030](0030-cross-bc-consistency-via-wolverine-outbox.md).
