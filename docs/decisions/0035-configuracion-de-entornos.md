# ADR-0035: Configuración de entornos

- **Estado**: aceptado
- **Fecha**: 2026-04-27

## Contexto

A fines de Sprint S1, el repo tenía configuración dispersa entre cuatro fuentes (`appsettings.json`, `appsettings.Development.json`, `.env`, defaults C# en Options classes) sin convención explícita de quién es "dueño" de cada valor. Concretamente aparecieron tres síntomas:

1. **`appsettings.json` con valores dev-leaning**: la sección `Smtp` apuntaba a Mailpit local (`Host=localhost`, `Port=1025`, `UseSsl=false`, `FromEmail=noreply@planb.local`). En cualquier entorno que olvidara overridear esos campos, el host arrancaba "saludable" pero apuntaba a un servidor SMTP inexistente. Lo mismo con `Embeddings` (modelo y versión hardcoded en base).
2. **Duplicación de no-secrets entre `appsettings.json` y `.env`**: `JWT__Issuer/Audience/AccessTokenMinutes/RefreshTokenDays` y `Embeddings__*` aparecían en ambos archivos. Cuando había que cambiarlos, no era obvio cuál tenía precedencia (env vars ganan, pero el repo daba la impresión opuesta).
3. **Options classes sin fail-fast**: `SmtpOptions` y `VerificationEmailOptions` se registraban con `services.Configure<>()` (sin validación) y tenían defaults C# que replicaban los valores dev (`Host = "localhost"`, `LinkBaseUrl = "https://planb.local/..."`). Si el binding fallaba o la sección no llegaba, el host arrancaba con datos placeholder y truenaba en runtime al primer email. Solo `JwtOptions` ya tenía `[Required]` + `ValidateOnStart`.

A esto se sumó un cuarto síntoma operacional: el CI no fija `ASPNETCORE_ENVIRONMENT`, lo que en runtime resuelve a `Production` por default. Con `Wolverine.CritterStackDefaults.Production` configurado para usar `Static` codegen + `AssertAllPreGeneratedTypesExist`, el día que aterricen integration tests con `WebApplicationFactory`, CI explota porque no hay paso de pre-generación de código.

Hace falta una convención explícita, validable por código review, que cubra: backend (.NET), scripts de generación de `.env`, frontend (Next.js), CI y deploy futuro.

## Decisión

Adoptar el patrón canónico de Microsoft + 12-factor, con seis reglas vinculantes y una matriz de entornos explícita.

### Seis reglas

1. **`appsettings.json` contiene defaults prod-safe**: vacíos o seguros para producción. Nunca dev-leaning.
2. **`appsettings.Development.json` contiene los overrides para dev local**: SMTP apuntando a Mailpit, log level Debug, URLs `localhost`, etc.
3. **`appsettings.Production.json` no existe** salvo que aparezca un override prod-only que no se pueda expresar con env var. Para planb hoy, todos los overrides prod son secrets o connection strings que vienen por env var: no existe.
4. **Secrets nunca van en archivos commiteados**. En dev viven en `.env` (gitignored, generado por `scripts/create-env.ts`); en prod vendrán por env vars / secret manager cuando armemos CD. Litmus test: el repo podría ser open source mañana sin comprometer ninguna credencial.
5. **Cada valor tiene exactamente un home**. Si vive en `appsettings.Development.json`, no se duplica en `.env`. Si vive en `.env` (porque es secret o port-dinámico), no aparece en `appsettings.*.json`. Si vive en `appsettings.json`, no se repite en el `.env.example`.
6. **Toda Options class usa `ValidateDataAnnotations().ValidateOnStart()`**. Defaults de propiedad C# son vacíos/seguros (`string.Empty`, `0`), nunca dev-leaning. El host falla al construir el `WebApplication` si un required falta o un valor no pasa annotations.

### Matriz de entornos

| Entorno | `ASPNETCORE_ENVIRONMENT` | Source de config |
|---|---|---|
| Dev local (`dotnet run`, `just dev`) | `Development` | `appsettings.json` ← `appsettings.Development.json` ← `.env` (vía `set dotenv-load` en Justfile) |
| CI (`dotnet test` en GHA) | `Development` | `appsettings.json` ← `appsettings.Development.json` ← env vars del workflow |
| Release / prod | `Production` | `appsettings.json` ← env vars del runtime / secret manager |

`ASPNETCORE_ENVIRONMENT=Development` se fija explícitamente en `.github/workflows/ci.yml` para que CI ejercite el mismo path que dev local (Wolverine `Dynamic` codegen, EF resource auto-create, Mailpit en `localhost:1025`).

### Frontend (Next.js)

Las env vars se validan en dos schemas separados (`frontend/src/lib/env.ts`):

- `clientEnv` valida `NEXT_PUBLIC_*` al import, una vez por build.
- `serverEnv()` valida `SESSION_SECRET` y demás server-only vars de forma lazy. Build (sin secrets) pasa; runtime (con secrets) falla rápido si falta. Lanza error si se invoca desde código cliente.

`frontend/.env.example` documenta ambos scopes.

## Alternativas consideradas

### A — Status quo (rechazada)

Mantener `appsettings.json` con dev defaults + `.env` con duplicados + Options sin validación. Costo cero, pero deja al sistema arrancando con configuración inválida en cualquier entorno mal configurado y delega el descubrimiento del problema al primer usuario que dispara la feature afectada (típicamente, primer email de verificación → primera queja de soporte).

### B — Convención adoptada (elegida)

Seis reglas + matriz explícita + `ValidateOnStart` en todas las Options + split client/server en frontend. Costo: una pasada de refactor (este PR). Beneficio: cualquier entorno mal configurado falla al construir el host, no en producción.

### C — Centralizar todo en un secret manager (rechazada por ahora)

Mover incluso los no-secrets a un manager (Vault, Doppler, AWS Secrets Manager, etc.) y eliminar `appsettings.*.json` casi entero. Es lo que se hace en orgs grandes. Para planb (proyecto académico, self-hosted en Dokploy, sin equipo de SRE) es overkill. Cuando armemos CD a Dokploy, evaluamos un secret store ligero (probablemente env vars de Dokploy + sealed secrets si vamos a Kubernetes). Por ahora, env vars del runtime alcanzan.

### D — `ASPNETCORE_ENVIRONMENT=Production` en CI (rechazada por ahora)

CI corriendo con la misma configuración que prod. Encuentra production-only issues antes del deploy. Requiere un paso previo de `dotnet run -- codegen write` (Wolverine) y migrations bundle pre-generado. La doc oficial de Wolverine recomienda este patrón para deploys, pero como step de CD, no de CI rápido. Adoptar antes de tener pipeline de deploy es invertir en infra que aún no necesitamos.

**Migración prevista**: en F6 (focus group cerrado, primer deploy real a Dokploy), separar `ci.yml` (Development, fast feedback) de `release.yml` (Production, prod parity con codegen pre-generado).

### E — Env "Testing" propio con `appsettings.Testing.json` (rechazada por ahora)

Microsoft documenta este patrón en el ejemplo de `WebApplicationFactory.UseEnvironment("test")`. Útil cuando los tests requieren config específica que no es ni dev ni prod (ej. logger silencioso, DB in-memory, JWT test secret). Para planb hoy, los tests usan la misma config que dev. Si emerge un caso, agregamos `appsettings.Testing.json` y movemos CI a `Testing`.

## Consecuencias

**Positivas:**

- Cualquier entorno mal configurado falla al construir el host con error claro (qué Options class, qué propiedad, qué annotation), no en runtime al primer uso de la feature.
- Política de "un valor, un home" hace el repo auto-explicativo: para saber dónde tocar `Smtp__Port` en dev vs prod, no hay que leer múltiples archivos.
- Frontend separa client-exposed de server-only en código, no por convención de naming.
- Path de evolución a `Production`-mode CI documentado, con criterio explícito de cuándo migrarlo.

**Negativas:**

- Un olvido de override en `appsettings.Development.json` deja al dev sin SMTP ni link de verificación al levantar local. Mitigación: `ValidateOnStart` lo cacha con error claro, no hay que descubrirlo al mandar el primer email.
- Cuando aparezca un nuevo Options class, hay que recordar registrarlo con `AddOptions<>().Bind().ValidateDataAnnotations().ValidateOnStart()` (no con `services.Configure<>()`). Mitigación: el patrón ya está en el código y se replica en code review.
- `appsettings.json` luce "incompleto" para alguien que viene de proyectos donde la base tiene los valores reales. Mitigación: comentario en cabeza del archivo + este ADR linkado.

## Cuándo revisitar

- Antes del primer deploy a Dokploy (F6): definir cómo se inyectan secrets en prod (env vars de Dokploy vs secret store dedicado).
- Cuando aterricen integration tests con `WebApplicationFactory` (F3+): evaluar si los tests necesitan un env "Testing" con su propio `appsettings.Testing.json`, o si dev defaults alcanzan.
- Cuando aparezca CD: separar `release.yml` con `ASPNETCORE_ENVIRONMENT=Production` y paso explícito de `dotnet run -- codegen write` antes del build de imagen Docker.
