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

**Automático (GitHub Actions):** construir y publicar las imágenes. Lo hace [`publish-images.yml`](../../.github/workflows/publish-images.yml) en cada push a `main` (tags: el sha corto y `main`; después redespliega el stage) y a mano (`workflow_dispatch`) para cualquier ref, eligiendo qué componente y con qué `api_url` (tag: solo el sha corto). Cada imagen lleva labels OCI (origen, revisión, fecha) y atestaciones de SBOM y procedencia, que GHCR muestra en la página del paquete; Trivy las escanea en la misma corrida y avisa sin frenar; [`prune-images.yml`](../../.github/workflows/prune-images.yml) deja las últimas veinte versiones de cada paquete, los lunes. Los contenedores corren sin root (`app` en el api, `bun` en el web) y con `HEALTHCHECK` contra `/health`.

**Manual (en el host del deploy):** aplicar el schema y apuntar el servicio a la imagen nueva. No está en el workflow por una razón concreta: aplicar el schema desde un runner de GitHub exige exponer la base de producción a internet. El precio de esa exposición es peor que el de dos comandos a mano.

## Secuencia de un deploy

Los pasos 2 a 5 corren en el host del deploy, con acceso a la red interna donde vive Postgres: en el servidor de Dokploy es la red `internal` del compose, que Docker nombra `<App Name>_internal` con el App Name que muestra la cabecera del servicio.

### 1. Publicar la imagen

Actions → *Publish images* → Run workflow. Ref: el commit o tag que se publica. Anotá el sha corto: es el tag inmutable al que se vuelve si hay que revertir. Cuando exista el servicio de producción, esta corrida la dispara el Release ([ADR-0089](../decisions/0089-the-stage-follows-main-and-production-is-promoted-from-a-release.md)). `api_url` es la URL con la que el frontend de ese deploy llega al backend; dos builds del mismo commit con `api_url` distinta pisan el mismo tag `<sha>`, así que producción necesita su propio valor y su propia corrida.

### 2. Backup de la base

Antes de cualquier cambio de schema. Sin backup previo no hay rollback de datos posible, solo de código.

```bash
pg_dump --format=custom --file=planb-$(date +%Y%m%d-%H%M).dump "$PLANB_DB_URL"
```

### 3. Aplicar migraciones de EF Core

```bash
docker run --rm --network <App Name>_internal \
  -e ASPNETCORE_ENVIRONMENT=Production \
  -e ConnectionStrings__Planb="$PLANB_DB_URL" \
  -e ConnectionStrings__Redis="$PLANB_REDIS_URL" \
  -e JWT__Secret="$PLANB_JWT_SECRET" \
  ghcr.io/<owner>/plan-b/planb-api:<sha> migrate-db
```

`migrate-db` aplica las migraciones pendientes de los tres DbContexts y termina. Es idempotente: correrlo dos veces no hace nada la segunda.

### 4. Aplicar el schema de Wolverine

```bash
docker run --rm --network <App Name>_internal \
  -e ASPNETCORE_ENVIRONMENT=Production \
  -e ConnectionStrings__Planb="$PLANB_DB_URL" \
  -e ConnectionStrings__Redis="$PLANB_REDIS_URL" \
  -e JWT__Secret="$PLANB_JWT_SECRET" \
  ghcr.io/<owner>/plan-b/planb-api:<sha> db-apply
```

Crea las tablas del outbox durable en el schema `wolverine`. También idempotente.

### 5. Apuntar el servicio a la imagen nueva

En Dokploy, en el Environment del servicio de producción, poner `PLANB_API_TAG` y `PLANB_WEB_TAG` en el sha del paso 1 y Deploy. Usar el sha y no un tag móvil: `main` es el del stage y se mueve con cada merge, y un restart del contenedor semanas después traería una versión que nadie decidió publicar en ese momento.

### 6. Verificar

```bash
curl -fsS https://<host>/health
```

Tiene que responder 200 con `{"status":"ok","service":"planb-api","version":"<sha corto>","checks":[...]}`: `version` es el sha del build (el build arg `GIT_SHA` del Dockerfile, `dev` fuera de CI) y `checks` lleva Postgres y Redis con su latencia; si alguno falla responde 503 con `status: fail` y el error del que falló. Un 502 sostenido después del redeploy suele ser el host que no arrancó: mirar los logs del contenedor y buscar el mensaje de Wolverine sobre tipos pre-generados faltantes (imagen mal construida) o el error de conexión a Postgres (paso 3 o 4 salteado).

## El compose de producción

Producción es [`docker-compose.prod.yml`](../../docker-compose.prod.yml), en la raíz del repo: otro servicio Compose de Dokploy (Compose Path `./docker-compose.prod.yml`), con las mismas dos imágenes de GHCR que el stage y cuatro diferencias. Corre con `ASPNETCORE_ENVIRONMENT=Production`, así que nada migra ni siembra al arrancar (los pasos 3 y 4 de arriba). No tiene Mailpit: `api` manda los mails por un relay SMTP real. Los tags de las dos imágenes son obligatorios: sin `PLANB_API_TAG` y `PLANB_WEB_TAG` el deploy no arranca, porque en producción no existe `main`. Y trae `prometheus` y `grafana` siempre prendidos, con el tablero y las alertas provisionados desde el repo (sección siguiente). Los `mem_limit` y la rotación de logs son los del stage.

### Variables que inyecta Dokploy en producción

| Variable | Para qué |
|---|---|
| `POSTGRES_PASSWORD`, `REDIS_PASSWORD`, `JWT_SECRET`, `SESSION_SECRET` | Lo mismo que en el stage (tabla de la sección Stage), con valores propios de producción. |
| `PLANB_API_TAG`, `PLANB_WEB_TAG` | Obligatorias. El sha corto que publicó *Publish images* en el paso 1. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USE_SSL` | El relay SMTP real. `SMTP_USE_SSL` es `true` o `false`. |
| `SMTP_USERNAME`, `SMTP_PASSWORD` | Solo si el relay pide auth; vacías, `api` no se autentica. |
| `SMTP_FROM_EMAIL`, `SMTP_FROM_NAME` | Remitente de los mails de verificación y de reset. |
| `WEB_HOST` | El host del producto, sin `https://`. Arma los links de verificación y de reset, y es el dominio del servicio `web` en Domains. |
| `GRAFANA_ADMIN_USER`, `GRAFANA_ADMIN_PASSWORD` | La cuenta admin de Grafana. |
| `GRAFANA_HOST` | El host del tablero, sin `https://`. Arma `GF_SERVER_ROOT_URL` y es el dominio del servicio `grafana` en Domains (container port `3000`, HTTPS con Let's Encrypt). |
| `ALERT_DISCORD_WEBHOOK_URL` | Opcional. El webhook de Discord al que Grafana manda las alertas; sin ella, existen y se ven en Grafana pero no mandan nada. |

### Métricas y tablero

El `api` expone `/metrics` en formato Prometheus en cualquier ambiente, alcanzable solo desde la red interna del compose: el histograma `http_request_duration_seconds` (con el método, la ruta y el código de respuesta), el contador `http_requests_received_total`, `dependency_up{dependency="postgres"|"redis"}` en 1 o 0 (lo mismo que alimenta `/health`), y los contadores de dominio `planb_reviews_published_total{instrument}`, `planb_chair_facts_computed_total{published="true"|"false"}` (cada lectura de una ficha de cátedra, según publique o todavía junte reseñas), `planb_sign_in_attempts_total{result="success"|"failure"}` y `planb_editorial_notes_published_total`. `/health` y `/metrics` quedan afuera de las señales HTTP: son tráfico de probes y scraping, no de producto.

Prometheus scrapea `/metrics` cada 15 segundos y guarda 15 días; Grafana lo lee como datasource y levanta el tablero "planb · producción" y las alertas desde archivos ([`observability/`](../../observability), en la raíz del repo): nada se carga a mano en la UI, un redeploy vuelve a aplicar lo que hay en el repo.

Tres reglas, evaluadas cada minuto, todas al contact point `discord`: `ApiDown` (el api no responde durante 2 minutos, crítica), `DependencyDown` (Postgres o Redis caído durante 2 minutos, crítica, el resumen dice cuál de las dos) y `HighErrorRate` (más del 5 % de las respuestas en 5xx durante 5 minutos, exigiendo tráfico real para no disparar con cero requests, warning).

`/metrics` corrió en local contra Postgres y Redis reales: las rutas se agregan por plantilla (`/api/reviews/chairs/{chairId:guid}/facts`, nunca por id) y dos tests de integración lo cubren. El compose de producción no se levantó todavía en ningún servidor: los archivos de `observability/` parsean y el compose resuelve, pero falta el primer deploy para confirmar que Prometheus scrapea, que el tablero pinta y que una alerta llega a Discord.

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

**Sin verificar** (necesita la infra de producción): la red interna entre el contenedor y Postgres con el perfil Production, el relay SMTP de producción, el certificado de su dominio, y el compose de producción entero, que nunca se levantó, Prometheus y Grafana incluidos. La publicación a GHCR y el pull desde Dokploy están verificados en el stage.

## Stage

Un ambiente aparte de producción: el mismo par de imágenes, pero pensado para mostrar el producto andando, no para servir usuarios reales.

### Qué es y por qué corre como Development hospedado

El stage pone el producto entero atrás de una sola URL, con el corpus sintético ya cargado, para que Lucas y Copas lo vean funcionar de punta a punta antes de que entre gente real. No reemplaza a producción ni la anticipa: es el lugar para revisar una demo completa sin que nadie tenga que levantar nada en su máquina.

Corre como `Development` hospedado a propósito: `Staging` caería en el perfil Production de Wolverine (`GeneratedCodeMode = Static`, `AssertAllPreGeneratedTypesExist = true`, `ResourceAutoCreate = None`) y exigiría los mismos pasos manuales que un deploy real (`migrate-db`, `db-apply`), que un stage con datos de prueba no necesita. Esto implica que las migraciones de EF y las siembras corren solas al arrancar, con `PLANB_SEED_CORPUS=1` puesto, y que Mailpit hace de relay SMTP en vez de un proveedor real: no hay paso de `migrate-db` ni de `db-apply` en este flujo. El stage además corre con HTTPS: dos subdominios propios con registro A a la IP del servidor (`planb.olisar.com.ar` para el producto y `mail.olisar.com.ar` para Mailpit) y certificado de Let's Encrypt emitido desde Dokploy, porque a diferencia de dev corre en un servidor con IP pública, no en una máquina local.

### Las piezas

El compose es [`docker-compose.stage.yml`](../../docker-compose.stage.yml), en la raíz del repo. Levanta las dos imágenes publicadas en GHCR (`planb-api` y `planb-web`), con el tag `main` por defecto o un sha corto pineado, nunca `latest`, y cinco servicios: `postgres`, `redis`, `mailpit`, `api` y `web`. Hay dos redes: `internal` (todos los servicios) y `dokploy-network` (externa, la arma Dokploy). Solo `web` y `mailpit` están en `dokploy-network` y reciben dominio; `api`, `postgres` y `redis` se quedan en `internal` y no son alcanzables desde afuera del compose. Un límite conocido: el rate limit por IP de `forgot-password` y `resend-verification` cuenta la IP del contenedor `web`, porque todo el tráfico al `api` sale de ahí, así que en el stage esos cupos (5 y 3 por hora) son de todo el stage y no por persona; se encara cuando haya personas reales.

### Límites y logs

Cada servicio del compose lleva `mem_limit`: `api` 768 MiB, `web` 256 MiB, `postgres` 512 MiB, `redis` 128 MiB, `mailpit` 128 MiB. Salen del consumo medido en reposo el 2026-09-07 en el Monitoring de Dokploy (`api` 362 MiB, `web` 94 MiB; el resto, decenas) con margen para carga y JIT, y suman menos de la mitad de los 3,82 GiB del servidor. Un contenedor que supera su límite se reinicia solo (`restart: unless-stopped`) y el resto sigue. Los logs rotan en tres archivos de 10 MB por contenedor. Para volver a medir: Monitoring del servicio, un contenedor por vez.

### Carga

Cuántos lectores a la vez aguanta el stage lo mide k6 desde cualquier máquina, con la imagen oficial y sin instalar nada: `just load read <VUs>` recorre la entrada, la ficha de una materia y la de una cátedra, Método y la búsqueda, con un segundo entre pedidos por usuario; `just load write <VUs>` mide el ingreso, que es lo caro por bcrypt, y necesita `SEED_EMAIL` y `SEED_PASSWORD` en el entorno (los scripts, las variables y los umbrales están en [`k6/README.md`](../../k6/README.md)). Umbrales: p95 por debajo de 1500 ms y menos del 5 % de fallas.

Medido el 2026-09-07 contra el stage, lectura, 30 s de rampa y 1 min estable:

| Usuarios a la vez | Pedidos por segundo | p95 | Fallas |
|---|---|---|---|
| 10 | 7 | 146 ms | 0 |
| 25 | 18 | 118 ms | 0 |
| 50 | 34 | 382 ms | 0 |
| 100 | 53 | 970 ms | 0 |

Hasta 50 lectores el stage responde en menos de 400 ms al p95; con 100 se acerca al umbral sin pasarlo ni fallar. Para una demo con una clase entera mirando a la vez, sobra. Lo que se degrada primero es la latencia general, no una ruta en particular: k6 agrupa por script y no separó rutas en esta medición. La escritura queda por medir con las cuentas sembradas.

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
| `WEB_HOST` | El host del frontend, sin `https://` (`planb.olisar.com.ar`). Arma los links de verificación y de reset, y es el dominio que se da de alta en Dokploy. |
| `PLANB_API_TAG` | Opcional. Sin definir, el stage corre `main`, que *Publish images* mueve en cada merge; un sha corto pinea `planb-api` hasta que se borre la variable. |
| `PLANB_WEB_TAG` | Opcional, igual que la anterior, para `planb-web`. |

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
```

`PLANB_API_TAG` y `PLANB_WEB_TAG` no van en el bloque: sin ellas el stage corre `main`. Se agregan solo para pinear un sha, y se borran para volver.

### El guion de clics

1. **Las imágenes**: cada push a `main` las publica (*Publish images*, tags sha y `main`); a mano se publica cualquier ref (Run workflow, component `both`, `api_url` `http://api:8080`). La primera corrida crea los dos paquetes de GHCR como privados: desde la página de cada paquete en GitHub (Package settings → Change visibility) se hacen públicos y Dokploy los baja sin credencial. El repo es público y las imágenes no llevan secretos, así que no hay nada que proteger ahí.
2. **Registro**, solo si las imágenes fueran privadas: Dokploy → Settings → Registry → Add Registry. Registry Name `ghcr`, Username `lucasidev`, Password un PAT clásico con el scope `read:packages` (alcanza para pull), Registry URL `ghcr.io`. Test, Save.
3. **El servicio**: Project → Create Service → Compose. Name, App Name (lo genera Dokploy con la forma `<proyecto>-<servicio>-<sufijo>`, y es el nombre del proyecto de compose que usa el reset del paso 8), Compose Type `Docker Compose`. Provider GitHub, con un GitHub App instalado sobre la cuenta dueña del repo: el GitHub de Dokploy es por cuenta, y un app instalado sobre otra cuenta no lista `lucasidev/plan-b`; la alternativa sin app es el provider Git con la URL pública del repo. Repositorio `lucasidev/plan-b`, branch `main`, Compose Path `./docker-compose.stage.yml`. Save. **Autodeploy** viene encendido y se apaga: el redeploy lo pide *Publish images* por la API cuando las imágenes ya están publicadas (ver "El stage sigue a main"); el Autodeploy dispararía con el push, antes de que existan. "Isolated Deployments" queda desactivado: el compose declara sus dos redes. "Preview Compose" muestra lo que Dokploy va a correr; mirarlo antes del primer Deploy.
4. **Environment**: pegar el bloque de la sección anterior con los valores reales. El editor enmascara los valores (el ojo los destapa) y guarda un `.env` que el compose lee con `${VAR}`.
5. **Domains → Add Domain, dos veces**: el selector de servicio queda vacío hasta que el ícono de refrescar de al lado trae el compose del repo. `planb.olisar.com.ar` (service `web`, container port `3000`, HTTPS activado, certificado Let's Encrypt) y `mail.olisar.com.ar` (service `mailpit`, container port `8025`, HTTPS igual), los dos con registro A a la IP del servidor; Dokploy marca "DNS Valid" cuando el registro resuelve.
6. **Deploy**, confirmar, y esperar: la pestaña Deployments muestra la corrida y *View* abre su log. Bajar las cinco imágenes y levantarlas lleva unos dos minutos y termina en `Docker Compose Deployed`. *Healthy* en el `api` significa que escucha; las migraciones y las siembras siguen un minuto más. Antes de abrir la entrada, en Logs del servicio, contenedor `api`, esperar la línea `CorpusSeeder: inserted N reviews`, que es la última siembra (Logs muestra 100 líneas por default; "Limit to" lo sube).
7. **Verificar**: `https://planb.olisar.com.ar/health` (el rewrite del frontend lo lleva al `api`) devuelve `{"status":"ok",...}`; `https://planb.olisar.com.ar/` muestra la entrada con el corpus; `https://mail.olisar.com.ar/` pide el usuario y la password de `MAILPIT_UI_AUTH`.
8. **Reset**: desde la terminal del servidor, `docker compose -p <App Name> down -v` con el App Name que muestra la cabecera del servicio, y volver a Deploy. Todo se rearma igual desde cero.

### El stage sigue a main

Cada push a `main` corre *Publish images*: construye las dos imágenes con el tag del sha y el tag móvil `main`, y con las dos publicadas le pide a Dokploy por su API que redespliegue el servicio ([ADR-0089](../decisions/0089-the-stage-follows-main-and-production-is-promoted-from-a-release.md)). El compose corre `main` por defecto y vuelve a bajar la imagen en cada deploy (`pull_policy: always`), así que no hay tag que cambiar ni botón que apretar: la pestaña Deployments muestra la corrida que disparó la API un par de minutos después del merge.

Tres secrets del repo (Settings → Secrets and variables → Actions), cargados a mano y nunca en el código:

| Secret | Qué es | De dónde sale |
|---|---|---|
| `DOKPLOY_URL` | El origen del panel, sin barra final. | La URL con la que se entra al panel. |
| `DOKPLOY_API_KEY` | Una API key del panel. | Dokploy → Settings → Profile → API Keys → Generate. |
| `DOKPLOY_STAGE_COMPOSE_ID` | El id del servicio Compose del stage. | El último segmento de la URL del servicio en el panel (`.../services/compose/<id>`). |

Sin alguno de los tres, el workflow publica igual y deja un aviso de que no redesplegó. Con el deploy pedido, el job espera hasta cinco minutos a que `https://planb.olisar.com.ar/health` devuelva en `version` el sha corto de ese merge, y falla si no llega: el deploy se verifica contra lo que el stage sirve, no contra la respuesta de Dokploy. Para pinear una versión en el stage: `PLANB_API_TAG` y `PLANB_WEB_TAG` con un sha corto en Environment, y Deploy; borrar las variables y Deploy vuelve a `main`. Una variable pineada le gana al default del compose: si quedó de un deploy anterior, cada redeploy vuelve a bajar ese sha.

### Qué está verificado y qué no

**Verificado en local** (podman, las dos imágenes construidas en esta rama): `docker compose ... config` resuelve las cinco imágenes; con `PLANB_API_TAG` y `PLANB_WEB_TAG` apuntando a las imágenes locales, `api` llega a *healthy*, `/health` responde a través del rewrite del frontend, `/` devuelve 200, y `/api/academic/universities` devuelve el catálogo sembrado. Los logs de `api` muestran las migraciones de los tres módulos y las siembras (personas, catálogo académico, catálogo de frases, corpus) corriendo solas al arrancar. Un build de la imagen del frontend sin el `--build-arg` falla con el mensaje; con `HOSTNAME` definido, el web escucha en `0.0.0.0:3000`; el admin entra con la password de `PLANB_SEED_PASSWORD` y no con la de `personas.json`; la UI de Mailpit responde 401 sin auth y 200 con `MAILPIT_UI_AUTH`.

**Verificado sobre el Dokploy real** (2026-09-04, imágenes `71375b7`): la primera corrida del workflow (entonces *Release images*, hoy *Publish images*) publicó las dos imágenes en GHCR; con los paquetes públicos, Dokploy bajó las cinco imágenes sin registro configurado; Let's Encrypt emitió los certificados de los dos subdominios y Traefik enruta `web` y `mailpit` por `dokploy-network`; `postgres` y `redis` llegaron a *healthy* antes que `api`, y `api` antes de que arrancara `web`; el log del `api` muestra `CorpusSeeder: inserted 49 reviews`; `/health` responde a través del rewrite, la entrada sortea una cátedra que publica, la ficha de materia 211 muestra sus tres cátedras y sus dos pares de co-cursada, la de Ruiz dice "Junta 6 reseñas: con 4 más se publica." y Método carga; un registro con un mail inventado devuelve 202 y el log del `api` dice `Verification email sent`; la UI de Mailpit responde 401 sin auth.

**Verificado el 2026-09-07, primer merge con los secrets cargados**: *Publish images* publicó `257b6b9` y `main`, Dokploy respondió `Deployment queued` a `compose.deploy` y el deploy apareció en Deployments en menos de un minuto. Ese primer deploy volvió a bajar `71375b7`: el Environment todavía tenía `PLANB_API_TAG` y `PLANB_WEB_TAG` del primer despliegue, y una variable pineada le gana al default. Borradas las dos y con un Deploy a mano, el log muestra `planb-api:main Pulled`, `api-1` y `web-1` recreados y `Docker Compose Deployed`; la entrada sirve el build nuevo.

**Sin verificar**: el reset por terminal (`down -v` y Deploy) contra el despliegue real, el tramo con cuenta del recorrido (verificar desde Mailpit, reseñar, el backoffice), y la espera del sha en `/health` desde el workflow, que verifica el primer merge después de este cambio.

### El recorrido para Copas

Diez minutos sobre el stage recién sembrado, en este orden. Los números son los del corpus sintético (`CorpusSeedData.cs`): todo vive en Fundamentos de Control de Calidad (materia 211 de la Tecnicatura Universitaria en Desarrollo y Calidad de Software, UNSTA), período 2024-C1, con tres cátedras.

1. **Inicio**, `https://planb.olisar.com.ar/`: la muestra es una ficha real elegida al azar entre las que pasaron el piso. Buscar "Fundamentos de Control de Calidad".
2. **Ficha de materia**, `/subjects/00000004-0000-4000-a000-000000000012`: tres cátedras. Pérez publica con 14 voces y González con 12; Ruiz dice "6 reseñas · faltan 4". Abajo, la co-cursada: con Desarrollo de Software (111) publica: "12 la llevaron junto con esta. 3 dejaron alguna de las dos."; con Desarrollo Back End (223) dice "5 la llevaron junto con esta: con 5 más se publica cómo les fue.".
3. **Ficha de Cátedra Pérez**, `/chairs/00000008-0000-4000-a000-000000000001`: cada frase con su moda, su distribución y sus voces; ningún puntaje. **Ficha de Cátedra Ruiz**, `/chairs/00000008-0000-4000-a000-000000000003`: "Junta 6 reseñas: con 4 más se publica."
4. **Método**, `/method`: la regla de cada conteo, el piso de 10 y la comparación solo contra cátedras hermanas.
5. **Registrarse**, `/sign-up` con un mail inventado (por ejemplo `copas@planb.local`) y la carrera declarada; en Mailpit, `https://mail.olisar.com.ar/` con el usuario y la password de `MAILPIT_UI_AUTH`, llega "Confirmá tu cuenta en planb" con el link a `/verify-email?token=`. Confirmar.
6. **Reseñar**, `/reviews/new`: Fundamentos de Control de Calidad, Cátedra Ruiz, período 2024-C1, el formulario de una página. Al publicar, la Ficha de Cátedra Ruiz pasa a "Junta 7 reseñas: con 3 más se publica" y `/reviews/mine` lista el aporte: contó, aunque todavía no publica.
7. **Backoffice**: cerrar sesión y entrar como `admin@planb.local` con la password de `PLANB_SEED_PASSWORD`. En `/admin/chairs`, cargar una cátedra nueva de Fundamentos de Control de Calidad con su titular; en `/admin/curation`, leer un texto libre del corpus y destilar una frase: en `/admin/items` aparece dentro de la versión nueva del instrumento.
8. **Volver a cero**: el reset del paso 8 del guion de clics deja el stage exactamente como al principio, con las mismas 49 reseñas del corpus (32 de cátedra y 17 de co-cursada) y sin la cuenta de prueba.

## Refs

- [`rollback.md`](rollback.md): revertir código, schema y tags.
- [`runbook.md`](runbook.md): qué hacer cuando el stage se rompe, y el inventario de secretos.
- [ADR-0059](../decisions/0059-production-startup-does-not-self-repair.md): por qué el orden de estos pasos no es negociable y por qué el arranque falla en vez de repararse.
- [ADR-0089](../decisions/0089-the-stage-follows-main-and-production-is-promoted-from-a-release.md): el stage sigue a `main`; producción se promueve desde un Release.
- [ADR-0026](../decisions/0026-git-workflow-github-flow-with-rebase.md): qué llega a `main` y cómo.
