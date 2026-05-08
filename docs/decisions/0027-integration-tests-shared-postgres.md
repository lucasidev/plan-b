---
supersedes-partial: 0024
---

# ADR-0027: Integration tests contra Postgres compartido con DB per-test

- **Estado**: aceptado
- **Fecha**: 2026-04-25

## Contexto

[ADR-0024](0024-dev-tooling-stack.md) fijó Testcontainers como la herramienta de integration testing ("levanta un Postgres real por test"). Cuando arrancó Fase 2 y los primeros tests de integration reales (S0 del módulo Identity) empezaron a correr local y en CI, la realidad golpeó la teoría:

- **Testcontainers + Podman + Windows no anda out-of-the-box.** Testcontainers-.NET usa `Docker.DotNet` para hablarle a un Docker Engine vía socket/named pipe. Podman en Windows (WSL backend) no expone un docker-compatible named pipe por default; la API viaja sobre SSH. `Docker.DotNet` no maneja SSH URIs. Hacer andar Testcontainers requiere habilitar manualmente `podman system service tcp:0.0.0.0:2375` dentro del WSL y setear `DOCKER_HOST=tcp://localhost:2375`: setup opcional que un dev nuevo no tiene por qué saber.
- **Startup tax por test class.** Arrancar un Postgres container nuevo por test class agrega ~3-5s de cold start. Al inicio con 3 integration tests era tolerable; cuando subió a 8 tests la espera se sintió.
- **No soluciona ningún problema que no se resuelva con `just infra-up`.** Ya tenemos un Postgres compartido en docker-compose que arranca al principio del día de trabajo. Si cada test crea su propio *database* dentro de ese Postgres, la isolation es la misma que un container separado: con zero startup tax.

Hay que decidir cómo van a correr los integration tests en dev y en CI.

## Decisión

**Integration tests corren contra el Postgres compartido del dev stack**, no contra containers per-test. Cada test (o test class, para fixtures de `WebApplicationFactory`) pide un database nuevo con `CREATE DATABASE "planb_<label>_<guid>"` al arrancar y `DROP DATABASE ... WITH (FORCE)` al terminar.

**Local**: `just infra-up` levanta `postgres` + `mailpit`. Los tests toman el admin connection string de `ConnectionStrings__Planb` (el `.env` cargado por `just`) y crean sus DBs ahí.

**CI**: el workflow de GitHub Actions usa Postgres como `services:` container (igual que antes). Los tests leen el admin connection string del env var que el workflow exporta. Cada run de CI arranca con un Postgres fresh; no hay accumulation.

**Isolation garantizada por** nombre random (`Guid.NewGuid()`) en cada test: sin posibilidad de colisión incluso si dos tests corren en paralelo contra el mismo server.

## Alternativas consideradas

### A. Mantener Testcontainers (la decisión original de ADR-0024)

Pros:
- Isolation física, no lógica.
- Setup de test 100% autocontenido: no depende de `just infra-up`.
- El flow "clone repo, open test, F5" funciona sin preparar infra.

Contras (lo que nos tumbó):
- Requiere Docker Engine o equivalent socket accesible desde el proceso de test.
- Podman sobre Windows necesita config extra no documentada.
- Cold start por test class inflate el feedback loop.
- Tests dependen de que el runtime de containers esté sano, ahora con un modo de falla más ("Testcontainers no puede hablarle a Podman") encima de los errores genuinos.

### B. In-memory provider (Npgsql.InMemory / EF InMemory)

Descartada por la misma razón que ADR-0024 original la descartó: las diferencias entre provider in-memory y Postgres real son silenciosas (CHECKs, triggers, pgvector, SQL funcional, transaction isolation). Integration tests que pasan in-memory y rompen en prod son peores que no testear.

### C. Postgres compartido con DB per-test (la decisión de este ADR)

Pros:
- Zero startup tax. Tests arrancan tan rápido como el segundo CREATE DATABASE que corre el día.
- Un solo runtime de containers para dev y CI; mismo mental model.
- Postgres real, con pgvector, migraciones EF Core reales, constraints reales.
- Isolation por nombre: tan fuerte como Testcontainers en la práctica (el único risk es ejecutar DROP DATABASE con un bug, pero los scripts usan `CREATE DATABASE "<exact-name>"` con guid en el nombre).

Contras:
- Requiere `just infra-up` corriendo local antes de los tests. Si alguien abre el repo por primera vez y corre `dotnet test` sin haber hecho `just setup`, falla con mensaje de conexión rechazada.
  - Mitigación: `just backend-test` (y la recipe `ci`) ya dependen transitivamente de la infra levantada. Quien usa el Justfile no se tropieza. El issue solo ocurre si alguien by-passea el task runner.
- Test DBs leakean si el test crashea antes de llegar al teardown. En local se acumula basura en el Postgres. CI no tiene este problema (container fresh cada run).
  - Mitigación: una recipe opcional `just db-cleanup-test-dbs` que DROPee todos los `planb_*_<hex>` dbs. No urgente; el cost es disk space.

## Consecuencias

**Positivas:**

- Cold start feedback loop baja de ~5s/test class a <1s.
- Dev stack unificado: un Postgres, un Mailpit, mismo connection string shape dev/CI.
- Tests auténticos (Postgres real + pgvector + todo el stack) sin el peaje de Testcontainers.
- El shape del fixture (`PostgresFixture`, `RegisterApiFixture`) queda muy simple: una función que crea un DB, una función que lo dropea. No hay image management, no hay wait-for-ready del container.

**Negativas:**

- `dotnet test` directo sin `just infra-up` previo falla. Documentado en `backend/CLAUDE.md`.
- Test DBs leakean en desarrollo long-running si no se corre cleanup.

**Lo que se conserva de ADR-0024:**

- xUnit como test runner: sin cambios.
- Tests backend cubren Domain + Application con mocks + Infrastructure con Postgres real: mismo principio.
- WebApplicationFactory para host-level integration tests: mismo.

Este ADR **parcialmente supersede ADR-0024** (solo la fila "Integration tests backend" de la tabla de decisiones de tooling). El resto de ADR-0024 (Just, Lefthook, Bun, Biome, Vitest, Playwright, xUnit, Dokploy, GitHub Actions) sigue vigente sin cambios.
