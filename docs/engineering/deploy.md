# Deploy a producción

Cómo se publica planb y en qué orden. El complemento de este doc es [`rollback.md`](rollback.md): acá está el camino feliz, allá qué hacer cuando algo entra y rompe.

> **Estado**: el pipeline existe y está probado localmente de punta a punta (imagen construida, arrancada en modo Production, `/health` respondiendo), pero **todavía no hubo un deploy real**. Lo que solo se puede confirmar contra la infra de verdad está listado al final.

## Por qué esto no es "levantar el contenedor y listo"

El host arranca distinto según `ASPNETCORE_ENVIRONMENT`, y en `Production` asume tres cosas que alguien tuvo que hacer antes ([`Program.cs`](../../backend/host/Planb.Api/Program.cs), bloque `CritterStackDefaults`):

| Flag | Qué implica |
|---|---|
| `GeneratedCodeMode = Static` | Wolverine **no** genera código en runtime: espera encontrarlo compilado dentro de la imagen. |
| `AssertAllPreGeneratedTypesExist = true` | Si falta aunque sea un tipo generado, el host **no arranca**. Falla fuerte y temprano, a propósito. |
| `ResourceAutoCreate = None` | Wolverine **no** crea sus tablas de outbox. Si el schema `wolverine` no está, falla. |

Y aparte: `DevMigrationsHostedService` aplica las migraciones de EF solo en Development. En producción **nadie las aplica sola**.

Traducido: una imagen construida sin el paso de codegen, apuntada a una base sin schema, no levanta. Eso es deliberado (un arranque que se auto-repara esconde el problema hasta que es tarde), pero significa que el orden de los pasos no es negociable.

## Las dos mitades

**Automático (GitHub Actions):** construir y publicar las imágenes. Lo hace [`release.yml`](../../.github/workflows/release.yml), a mano (`workflow_dispatch`), eligiendo el ref y qué componente. Publica a GHCR con dos tags: el sha corto y `latest`.

**Manual (en el host del deploy):** aplicar el schema y apuntar el servicio a la imagen nueva. No está en el workflow por una razón concreta: aplicar el schema desde un runner de GitHub exige exponer la base de producción a internet. El precio de esa exposición es peor que el de dos comandos a mano.

## Secuencia de un deploy

Los pasos 2 a 5 corren en el host del deploy, con acceso a la red interna donde vive Postgres.

### 1. Publicar la imagen

Actions → *Release images* → Run workflow. Ref: el commit o tag que se publica. Anotá el sha corto: es el tag inmutable al que se vuelve si hay que revertir.

### 2. Backup de la base

Antes de cualquier cambio de schema. Sin backup previo no hay rollback de datos posible, solo de código.

```bash
pg_dump --format=custom --file=planb-$(date +%Y%m%d-%H%M).dump "$PLANB_DB_URL"
```

### 3. Aplicar migraciones de EF Core

```bash
docker run --rm --network <red-interna> \
  -e ASPNETCORE_ENVIRONMENT=Production \
  -e ConnectionStrings__Planb="$PLANB_DB_URL" \
  -e ConnectionStrings__Redis="$PLANB_REDIS_URL" \
  -e JWT__Secret="$PLANB_JWT_SECRET" \
  ghcr.io/<owner>/plan-b/planb-api:<sha> migrate-db
```

`migrate-db` aplica las migraciones pendientes de los tres DbContexts y termina. Es idempotente: correrlo dos veces no hace nada la segunda.

### 4. Aplicar el schema de Wolverine

```bash
docker run --rm --network <red-interna> \
  -e ASPNETCORE_ENVIRONMENT=Production \
  -e ConnectionStrings__Planb="$PLANB_DB_URL" \
  -e ConnectionStrings__Redis="$PLANB_REDIS_URL" \
  -e JWT__Secret="$PLANB_JWT_SECRET" \
  ghcr.io/<owner>/plan-b/planb-api:<sha> db-apply
```

Crea las tablas del outbox durable en el schema `wolverine`. También idempotente.

### 5. Apuntar el servicio a la imagen nueva

En Dokploy, cambiar el tag de la imagen al sha del paso 1 y redeployar. Usar el sha y no `latest`: `latest` se mueve, y un restart del contenedor semanas después traería una versión que nadie decidió publicar en ese momento.

### 6. Verificar

```bash
curl -fsS https://<host>/health
```

Tiene que responder `{"status":"ok",...}`. Un 502 sostenido después del redeploy suele ser el host que no arrancó: mirar los logs del contenedor y buscar el mensaje de Wolverine sobre tipos pre-generados faltantes (imagen mal construida) o el error de conexión a Postgres (paso 3 o 4 salteado).

## Variables que necesita el contenedor

El backend no lee ningún `.env` en producción: la carga de `.env` está gateada a que el entorno **no** sea Production. Todo viene del entorno real.

| Variable | Obligatoria | Para qué |
|---|---|---|
| `ASPNETCORE_ENVIRONMENT` | sí | Tiene que ser `Production`. Es lo que activa los tres flags de arriba. |
| `ConnectionStrings__Planb` | sí | Postgres. La usan EF, Dapper y el outbox de Wolverine. |
| `ConnectionStrings__Redis` | sí | Redis. Refresh tokens y rate limiting. |
| `JWT__Secret` | sí | Firma de los tokens de sesión. Mínimo 32 caracteres: el host tira en el arranque si es más corto. |
| `Smtp__Host`, `Smtp__Port`, `Smtp__UseSsl`, `Smtp__FromEmail`, `Smtp__FromName` | sí | Envío de mails (verificación, reset de password). |
| `Smtp__Username`, `Smtp__Password` | según el relay | Solo si el relay pide auth. |
| `Identity__Verification__LinkBaseUrl` | sí | Base del link de verificación de email. Apunta al frontend: `https://<host>/verify-email`. |
| `Identity__PasswordReset__LinkBaseUrl` | sí | Ídem para el reset: `https://<host>/reset-password`. |

**Todas las de la tabla son obligatorias de verdad, y el host lo verifica al arrancar.** Las de SMTP y los tres `LinkBaseUrl` viven hoy solo en `appsettings.Development.json`, así que en producción no tienen ningún default: el arranque falla con `DataAnnotation validation failed for 'VerificationEmailOptions' members: 'LinkBaseUrl'` y equivalentes. Es la trampa principal de este deploy y sale así de la corrida real, no de leer el código.

El resto de la configuración no secreta (issuer y audience del JWT, duración de tokens) vive en `appsettings.json` y no hace falta pasarla ([ADR-0035](../decisions/0035-environment-configuration.md)).

Los valores los carga Lucas en Dokploy. No están en el repo ni pasan por este doc.

## Qué está verificado y qué no

Honestidad sobre el estado, para que nadie lea este doc como si estuviera probado end-to-end.

**Verificado local** (Podman + el Postgres y el Redis de `just infra-up`, 2026-07-27):

- La imagen construye con el paso de codegen adentro.
- `migrate-db` aplica las migraciones pendientes de los tres DbContexts en modo Production, y la segunda corrida no hace nada.
- `db-apply` corre en modo Production.
- `codegen write` no necesita base alcanzable: corre contra un host de Postgres inexistente. Por eso el Dockerfile puede pasarle valores basura y no hace falta ningún secreto real en el build.
- El contenedor arranca en Production y `/health` devuelve `{"status":"ok"}`. En los logs: `code generation mode is Static with pre-generated types being loaded`, sin tipos faltantes.

**Sin verificar** (necesita la infra real): la publicación a GHCR (nunca se corrió el workflow), el pull desde Dokploy, la red interna entre el contenedor y Postgres, el relay SMTP de producción y el certificado del dominio.

## Refs

- [`rollback.md`](rollback.md): revertir código, schema y tags.
- [ADR-0059](../decisions/0059-production-startup-does-not-self-repair.md): por qué el orden de estos pasos no es negociable y por qué el arranque falla en vez de repararse.
- [ADR-0038](../decisions/0038-release-and-versioning-policy.md): por qué el workflow es manual y no dispara en cada merge.
- [ADR-0026](../decisions/0026-git-workflow-github-flow-with-rebase.md): qué llega a `main` y cómo.
