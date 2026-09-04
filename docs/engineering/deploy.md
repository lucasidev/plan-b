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

Actions → *Release images* → Run workflow. Ref: el commit o tag que se publica. Anotá el sha corto: es el tag inmutable al que se vuelve si hay que revertir. `api_url` es la URL con la que el frontend de ese deploy llega al backend; dos builds del mismo commit con `api_url` distinta pisan el mismo tag `<sha>`, así que producción necesita su propio valor y su propia corrida.

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

**Todas las de la tabla son obligatorias de verdad, y el host lo verifica al arrancar.** Las de SMTP y los dos `LinkBaseUrl` viven hoy solo en `appsettings.Development.json`, así que en producción no tienen ningún default: el arranque falla con `DataAnnotation validation failed for 'VerificationEmailOptions' members: 'LinkBaseUrl'` y equivalentes. Es la trampa principal de este deploy y sale así de la corrida real, no de leer el código.

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

## Stage

Un ambiente aparte de producción: el mismo par de imágenes, pero pensado para mostrar el producto andando, no para servir usuarios reales.

### Qué es y por qué corre como Development hospedado

El stage pone el producto entero atrás de una sola URL, con el corpus sintético ya cargado, para que Lucas y Copas lo vean funcionar de punta a punta antes de que entre gente real. No reemplaza a producción ni la anticipa: es el lugar para revisar una demo completa sin que nadie tenga que levantar nada en su máquina.

Corre como `Development` hospedado a propósito: `Staging` caería en el perfil Production de Wolverine (`GeneratedCodeMode = Static`, `AssertAllPreGeneratedTypesExist = true`, `ResourceAutoCreate = None`) y exigiría los mismos pasos manuales que un deploy real (`migrate-db`, `db-apply`), que un stage con datos de prueba no necesita. Esto implica que las migraciones de EF y las siembras corren solas al arrancar, con `PLANB_SEED_CORPUS=1` puesto, y que Mailpit hace de relay SMTP en vez de un proveedor real: no hay paso de `migrate-db` ni de `db-apply` en este flujo. El stage además corre con HTTPS: hosts de `sslip.io` sobre la IP del servidor y certificado de Let's Encrypt emitido desde Dokploy, porque a diferencia de dev corre en un servidor con IP pública, no en una máquina local.

### Las piezas

El compose es [`docker-compose.stage.yml`](../../docker-compose.stage.yml), en la raíz del repo. Levanta las dos imágenes publicadas en GHCR (`planb-api` y `planb-web`) por su sha corto, nunca `latest`, y cinco servicios: `postgres`, `redis`, `mailpit`, `api` y `web`. Hay dos redes: `internal` (los cinco servicios) y `dokploy-network` (externa, la arma Dokploy). Solo `web` y `mailpit` están en `dokploy-network` y reciben dominio; `api`, `postgres` y `redis` se quedan en `internal` y no son alcanzables desde afuera del compose. Un límite conocido: el rate limit por IP de `forgot-password` y `resend-verification` cuenta la IP del contenedor `web`, porque todo el tráfico al `api` sale de ahí, así que en el stage esos cupos (5 y 3 por hora) son de todo el stage y no por persona; se encara cuando haya personas reales.

### Variables que inyecta Dokploy

| Variable | Para qué |
|---|---|
| `POSTGRES_PASSWORD` | Password de Postgres. La arma `api` en su connection string. |
| `REDIS_PASSWORD` | Password de Redis. La arma `api` en su connection string. |
| `JWT_SECRET` | Mínimo 32 caracteres. Firma los tokens de sesión: el mismo valor lo usan `api` (`JWT__Secret`) y `web` (`JWT_SECRET`). |
| `SESSION_SECRET` | Mínimo 32 caracteres. La exige el esquema de entorno del frontend (`env.ts`); hoy el flujo es JWT puro y no firma nada. |
| `MAILPIT_UI_AUTH` | Usuario y password de la UI de Mailpit, formato `usuario:password`. Mailpit muestra los links de verificación y de reset de todas las cuentas del stage. |
| `PLANB_SEED_PASSWORD` | Mínimo 12 caracteres. La password con la que se siembran las cuatro personas, incluido el admin: las de `personas.json` son públicas. |
| `SMTP_FROM_EMAIL` | Remitente de los mails que manda `api`, recibidos por Mailpit. |
| `SMTP_FROM_NAME` | Nombre de remitente de esos mismos mails. |
| `WEB_HOST` | El host del frontend, sin `https://` (ej. `planb-1-2-3-4.sslip.io`). Arma los links de verificación y de reset, y es el dominio que se da de alta en Dokploy. |
| `PLANB_API_TAG` | El sha corto que publicó *Release images* para `planb-api`. |
| `PLANB_WEB_TAG` | El sha corto que publicó *Release images* para `planb-web`. |

Bloque listo para pegar en la pestaña Environment del servicio, con placeholders:

```
POSTGRES_PASSWORD=<password>
REDIS_PASSWORD=<password>
JWT_SECRET=<secreto de 32+ caracteres>
SESSION_SECRET=<secreto de 32+ caracteres>
MAILPIT_UI_AUTH=<usuario:password>
PLANB_SEED_PASSWORD=<password de 12+ caracteres>
SMTP_FROM_EMAIL=<remitente>
SMTP_FROM_NAME=<nombre de remitente>
WEB_HOST=<host sin https://>
PLANB_API_TAG=<sha corto>
PLANB_WEB_TAG=<sha corto>
```

### El guion de clics

1. **Publicar las imágenes**: Actions → *Release images* → Run workflow. Ref `main`, component `both`, `api_url` `http://api:8080`. Anotar el sha corto.
2. **Registro**: Dokploy → Settings → Registry → Add Registry. Registry Name `ghcr`, Username `lucasidev`, Password un PAT clásico con el scope `read:packages` (alcanza para pull), Registry URL `ghcr.io`. Test, Save.
3. **El servicio**: Project → Create Service → Compose. Compose Type `Docker Compose`, provider GitHub (o Git con la URL del repo), repositorio `lucasidev/plan-b`, branch `main`, Compose Path `./docker-compose.stage.yml`. Save. "Isolated Deployments" queda desactivado: el compose declara sus dos redes. "Preview Compose" muestra lo que Dokploy va a correr; mirarlo antes del primer Deploy.
4. **Environment**: pegar el bloque de la sección anterior con los valores reales.
5. **Domains → Add Domain, dos veces**: `WEB_HOST` (host `planb-<a>-<b>-<c>-<d>.sslip.io` con la IP del servidor, service `web`, container port `3000`, HTTPS activado, certificado Let's Encrypt) y Mailpit (host `mail-<a>-<b>-<c>-<d>.sslip.io`, service `mailpit`, container port `8025`, HTTPS igual).
6. **Deploy**, y esperar. *Healthy* en el `api` significa que escucha; las migraciones y las siembras siguen un minuto más. Antes de abrir la entrada, en Logs del servicio esperar la línea `CorpusSeeder: inserted N reviews`, que es la última siembra.
7. **Verificar**: `https://<WEB_HOST>/health` (el rewrite del frontend lo lleva al `api`) devuelve `{"status":"ok",...}`; `https://<WEB_HOST>/` muestra la entrada con el corpus; `https://mail-...` muestra Mailpit.
8. **Reset**: el proyecto de compose se llama como el App Name que Dokploy genera para el servicio (`<proyecto>-<servicio>-<sufijo>`, visible en la pestaña General; en la doc de Dokploy el ejemplo es `a-beszel-a95pzl`). Desde la terminal del servidor, `docker compose -p <App Name> down -v` y volver a Deploy. Todo se rearma igual desde cero.

### Qué está verificado y qué no

**Verificado en local** (podman, las dos imágenes construidas en esta rama): `docker compose ... config` resuelve las cinco imágenes; con `PLANB_API_TAG` y `PLANB_WEB_TAG` apuntando a las imágenes locales, `api` llega a *healthy*, `/health` responde a través del rewrite del frontend, `/` devuelve 200, y `/api/academic/universities` devuelve el catálogo sembrado. Los logs de `api` muestran las migraciones de los tres módulos y las siembras (personas, catálogo académico, catálogo de frases, corpus) corriendo solas al arrancar. Un build de la imagen del frontend sin el `--build-arg` falla con el mensaje; con `HOSTNAME` definido, el web escucha en `0.0.0.0:3000`; el admin entra con la password de `PLANB_SEED_PASSWORD` y no con la de `personas.json`; la UI de Mailpit responde 401 sin auth y 200 con `MAILPIT_UI_AUTH`.

**Sin verificar** (necesita la infra real): la publicación a GHCR (el workflow nunca corrió), el pull de las imágenes desde Dokploy, la emisión del certificado de Let's Encrypt, los labels de Traefik sobre este compose, y el reset por terminal (`down -v` y Deploy) contra un despliegue real.

## Refs

- [`rollback.md`](rollback.md): revertir código, schema y tags.
- [ADR-0059](../decisions/0059-production-startup-does-not-self-repair.md): por qué el orden de estos pasos no es negociable y por qué el arranque falla en vez de repararse.
- [ADR-0038](../decisions/0038-release-and-versioning-policy.md): por qué el workflow es manual y no dispara en cada merge.
- [ADR-0026](../decisions/0026-git-workflow-github-flow-with-rebase.md): qué llega a `main` y cómo.
