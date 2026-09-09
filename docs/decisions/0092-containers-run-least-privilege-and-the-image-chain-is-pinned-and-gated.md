# 0092: Containers run least-privilege and the image chain is pinned and gated

- **Estado**: aceptado
- **Fecha**: 2026-09-08

## Contexto

Los dos composes de deploy (`docker-compose.stage.yml`, `docker-compose.prod.yml`) ya tenían usuario no root en las dos imágenes propias, sin puertos publicados al host, healthcheck y rotación de logs (ver [ADR-0091](0091-the-stage-runs-as-production-and-seeding-is-a-deploy-step.md)). Faltaban tres cosas de un contenedor endurecido: ningún servicio dropeaba capacidades Linux ni corría con el filesystem de solo lectura, no había techo de CPU ni de procesos (solo `mem_limit`), y las imágenes base (el SDK y el runtime de .NET, Bun, Postgres, Redis, Mailpit, Prometheus, Grafana) usaban tags móviles sin pin.

El pin sin quien lo renueve es peor que no pinear: `.github/dependabot.yml` tenía una entrada `docker` con `directory: "/"`, que Dependabot no escanea recursivo. Los dos Dockerfiles viven en `backend/` y `frontend/`, fuera de ese directorio, así que la entrada nunca los vio: en todo el historial de PRs no hay un solo bump de imagen base, y Mailpit seguía en `v1.29` con `v1.30` y `v1.31` ya publicadas. Es el mismo error que el comentario de la entrada `dotnet-sdk` ya documentaba para sí misma (`directory: "/backend"`, agregado antes por la misma razón).

El escaneo de imágenes (`publish-images.yml`, job `scan`) corría Trivy con `exit-code: '0'` en los dos pasos: reportaba y nunca frenaba un merge, sin importar la severidad de lo que encontrara.

## Decisión

### 1. Capacidades Linux: `cap_drop: ["ALL"]` en todos, `cap_add` solo donde el entrypoint lo exige

Probado servicio por servicio con podman, sacando capacidades una por una hasta que el contenedor dejaba de arrancar (no se asumió la lista, se verificó):

| Servicio | `cap_add` | Por qué |
|---|---|---|
| `postgres` | `CHOWN`, `DAC_OVERRIDE`, `FOWNER`, `SETGID`, `SETUID` | El entrypoint arranca como root, prepara `/var/lib/postgresql/data` y recién ahí baja a `postgres` (`gosu`). Sin `DAC_OVERRIDE` falla con `find: Permission denied` sobre el volumen (dueño root, root no puede leerlo sin esa capacidad). |
| `redis` | `CHOWN`, `SETUID`, `SETGID` | Mismo patrón: `chown` sobre `/data` y `gosu redis`. Sin `CHOWN` falla con `chown: Operation not permitted`; sin `SETUID` falla con `setresuid failed: Operation not permitted`. |
| `mailpit` | ninguna | Sin `MP_DATABASE` configurado guarda todo en memoria; no hay entrypoint que baje privilegios. |
| `api`, `web`, `migrate`, `seed` | ninguna | Las dos imágenes propias ya corren directo como su usuario no root (`USER app`, `USER bun` en los Dockerfiles): no hay privilegio que bajar. |
| `prometheus`, `grafana` | ninguna | Las dos imágenes oficiales ya corren directo como su usuario no root de build (`nobody` y `472` respectivamente). |

Verificado además a nivel kernel, no solo por el `HostConfig` de `podman inspect` (que normaliza el resultado contra el set default de Podman y no lo hace obvio): `/proc/1/status` de `api` con el compose puesto muestra `CapBnd: 0000000000000000` (cero capacidades); el de `postgres` muestra `CapBnd: 00000000000000cb`, que decodificado bit a bit es exactamente `{CHOWN, DAC_OVERRIDE, FOWNER, SETGID, SETUID}`, ni una más.

### 2. `cpus` y `pids_limit` en todos los servicios de vida larga; `pids_limit` también en los de un solo uso

El VPS del stage tiene 2 vCPU (`k6/README.md`) y 3,82 GiB (`docs/engineering/runbook.md`), compartido con otros proyectos. Ningún valor de `cpus` llega a 2: así ningún contenedor puede, solo, saturar la máquina entera. `migrate` y `seed` no llevan `cpus` (corren una vez y terminan; el spec de Compose no lo pide para un proceso que no sostiene carga), pero sí `pids_limit`, para que un fork bomb en un one-shot no agote la tabla de PIDs del host igual.

Los valores de `pids_limit` salen de lo medido en reposo (`podman stats`, contenedor recién arrancado, sin carga) con margen de sobra, no de una fórmula:

| Servicio | PIDs en reposo | `pids_limit` | `cpus` |
|---|---|---|---|
| `postgres` | 11 | 100 | 1.0 |
| `redis` | 6 | 50 | 0.5 |
| `mailpit` | 13 | 50 | 0.25 |
| `api` | 29-30 | 200 | 1.0 |
| `web` | 16-20 | 100 | 0.5 |
| `migrate`, `seed` | mismo binario que `api`, sin servir requests | 100 | (ninguno) |
| `prometheus` | comparable a `mailpit` (binario Go chico) | 50 | 0.5 |
| `grafana` | 17 | 100 | 0.5 |

`postgres` y `api` llevan el techo de CPU más alto (1.0) porque son los dos servicios que hacen trabajo real bajo carga (queries concurrentes, JIT y GC del proceso .NET); el resto son procesos livianos o de soporte.

### 3. Filesystem de solo lectura en los nueve servicios, sin ninguna excepción

Se probó `read_only: true` servicio por servicio, con `tmpfs` donde hacía falta, verificando arranque y (donde aplica) el healthcheck real contra dependencias reales, no contra datos de prueba:

| Servicio | `tmpfs` | Por qué |
|---|---|---|
| `postgres` | `/var/run/postgresql`, `/tmp` | El socket Unix que usa `pg_isready` vive en el primero; initdb y utilidades tocan el segundo. |
| `redis` | `/data` | Sin `--save ""`, redis intenta snapshotear su RDB al directorio de trabajo por default aunque no haya volumen declarado. |
| `web` | `/app/.next/cache` | El optimizador de imágenes de Next escribe ahí en runtime (ya documentado en el Dockerfile: `RUN mkdir -p .next/cache && chown -R bun:bun .next`). |
| `mailpit`, `api`, `migrate`, `seed`, `prometheus`, `grafana` | ninguno | No escriben nada fuera de sus volúmenes declarados (`/prometheus`, `/var/lib/grafana`) ni de config montada `:ro`. |

Contra lo previsto en el pedido original (que algún servicio quedara escribible por no valer la pena el esfuerzo), los nueve terminaron en solo lectura real. Confirmado a nivel de filesystem, no solo por el flag: `touch /app/should-fail` dentro de `api` devuelve `Read-only file system`; `touch /should-fail` dentro de `postgres` también, mientras que `touch /tmp/should-work` ahí adentro sí funciona (tmpfs).

`api` resuelve DataProtection como "ephemeral key repository" (log: `Neither user profile nor HKLM registry available`) en vez de fallar: no depende de un directorio persistente para arrancar, y el JWT bearer de este backend no la usa para firmar tokens (la firma es HMAC directo con `JWT__Secret`), así que la advertencia es inocua.

### 4. `.env` de la raíz entra a `.dockerignore`

Hoy no llega a ninguna imagen (los dos Dockerfiles copian directorios puntuales, nunca el contexto entero), mismo caso que `frontend/.env*`, ya ignorado con el mismo argumento: un `COPY` que en el futuro se vuelva más ancho lo hornearía con los secretos locales adentro.

### 5. Dependabot ve los tres lugares con imágenes base

La entrada `docker` pasa de `directory: "/"` a `directories: ["/", "/backend", "/frontend"]` (forma plural, misma config aplicada a los tres). El comentario, que afirmaba que Dependabot buscaba recursivo, se corrige. **No se bumpeó Mailpit a mano**: queda para que Dependabot lo proponga ahora que puede verlo.

### 6. Las imágenes base quedan pineadas por digest

Resueltos el 2026-09-08 contra el índice multi-arquitectura (`docker buildx imagetools inspect`, que no necesita un daemon de Docker corriendo, solo acceso al registry):

| Imagen | Digest |
|---|---|
| `mcr.microsoft.com/dotnet/sdk:10.0` | `sha256:096ca98743616ccfa14dccaa2a86615fd7345bd0c4535445226e98dbd46af2b5` |
| `mcr.microsoft.com/dotnet/aspnet:10.0` | `sha256:3a494b8a73ec3248c237c9438592ff1e04587edf65863212bc1027e54dcb6f36` |
| `oven/bun:1-alpine` | `sha256:d888c0ae6c86d7866ff10c5aafdd9077b36aee6455b33dd270fb93c0dd5cef6f` |
| `pgvector/pgvector:pg17` | `sha256:cf134a767f474095eeba57e0117be8e568e011a63f33fbf252f14c9b760f8e6f` |
| `redis:7-alpine` | `sha256:ff02b58f971e7d7d156a1267e283fcbbeee91773b6aa36c49dac28ecfe28eadf` |
| `axllent/mailpit:v1.29` | `sha256:757f22b56c1da03570afdb3d259effe5091018008a81bbedc8158cee7e16fdbc` |
| `prom/prometheus:v3.14.0` | `sha256:5ce7540c3c00ef4ab0c9d2c995c6a5b9c421f44b4a115d97a2c7af3b1c21cbb0` |
| `grafana/grafana:12.4.10` | `sha256:c132a683b2430fff9115a29b2a79c8ab97540cdcc90846e3c81878c778ca3596` |

Forma `imagen:tag@sha256:...` en los dos Dockerfiles y en los dos composes de deploy: el tag queda para que se lea qué versión es, el digest fija exactamente qué bytes corren. `docker-compose.yml` (dev) queda fuera: no se despliega, corre en la máquina de cada dev, y Dependabot puede seguir proponiendo bumps de tag ahí sin digest.

### 7. El escaneo de imágenes frena en CRITICAL, informa en HIGH

`publish-images.yml`, job `scan`: los dos pasos existentes (`severity: CRITICAL,HIGH`, `exit-code: '0'`) se mantienen sin cambios y siguen alimentando el artifact y el summary. Dos pasos nuevos al final repiten el escaneo por imagen filtrando `severity: CRITICAL` con `exit-code: '1'`: eso es lo único que corta el job. HIGH queda visible pero no bloquea: es donde más aparecen hallazgos sin exploit conocido en el uso real de esta imagen, y forzar el merge a esperar por cada uno entrena a ignorar el rojo en vez de mirarlo. Los pasos de gate van después del artifact/summary, no antes: si el gate corta el job, el reporte completo (con HIGH incluido) ya quedó subido y en el summary para diagnosticar sin tener que re-correr nada.

## Verificación

Con podman, contraseñas descartables generadas para esta sesión, contra una base vacía:

- Las dos imágenes (`backend/Dockerfile`, `frontend/Dockerfile`) construyen con los digests pineados.
- `docker-compose.stage.yml` completo (siete servicios, con las imágenes locales en vez de `ghcr.io`, todo lo demás igual): `migrate` y `seed` terminan con exit 0 (segunda corrida: "sin migraciones pendientes" y sin duplicar filas), `postgres`, `redis`, `mailpit` y `api` quedan *healthy*; `web` queda *starting* en el status que reporta el compose por un problema de la herramienta local (`podman compose` usa `docker-compose.exe` como *external compose provider* en esta máquina, y ese puente parte por espacios en blanco el string del healthcheck de `web` y de `api` al crear el contenedor, verificado con `podman inspect --format '{{json .Config.Healthcheck}}'`: llega como varios tokens sueltos en vez de un solo argumento). No es un problema del compose ni de este endurecimiento: el healthcheck no se tocó, y el mismo mecanismo ya estaba verificado sano en ADR-0091. Se verificó el estado real sin depender de esa etiqueta: `GET /health` y `GET /` devuelven 200 ejecutados a mano dentro de cada contenedor.
- `GET /api/reviews/subjects/00000004-0000-4000-a000-000000000012/facts` devuelve Pérez 14, González 12, Ruiz 6, antes y después de un `down` (sin `-v`) y `up` de nuevo: mismos números, mismo `lastReviewedAt`, sin duplicar.
- Capacidades y solo lectura confirmadas a nivel kernel (no solo por el flag que se le pasó al motor): `/proc/1/status` dentro de `postgres` y `api`, y `touch` fallando con `Read-only file system` fuera de los `tmpfs` declarados.
- `cd backend && dotnet build -warnaserror`: limpio. `dotnet format --verify-no-changes`: limpio.
- No se tocó código de aplicación (`.cs`, `.ts`, `.tsx`): no corrió integración ni E2E para esto.
- `.github/workflows/publish-images.yml`: lint local con los contenedores de `rhysd/actionlint` y `zizmorcore/zizmor` (`MSYS_NO_PATHCONV=1`).
- `bun scripts/check-docs.ts --strict`: limpio.

**Hallazgo aparte, sin corregir (fuera de este alcance)**: levantando `grafana/grafana:12.4.10` solo, con `ALERT_DISCORD_WEBHOOK_URL` vacío tal como `docker-compose.prod.yml` y `deploy.md` documentan como caso soportado ("vacía, existen y se ven en Grafana pero no mandan nada"), el contenedor no arranca: falla el provisioning de alerting con `could not find webhook url property in settings`. Con una URL de prueba no vacía arranca sin problema, con o sin este endurecimiento puesto. Es un comportamiento de esta versión de Grafana ante el contact point `discord` provisionado, no algo que este cambio haya introducido ni que la superficie de este ADR cubra.

## Alternativas consideradas

**Repetir `security_opt`, `cap_drop` y `read_only` en cada servicio en vez de un anchor YAML.** Las tres claves son idénticas en los nueve (stage) y siete (prod) servicios. Descartada: el repo ya usa el mismo patrón (`x-logging: &logging`) para la config de logs, que también es idéntica en todos; un `x-hardening: &hardening` con `<<: *hardening` sigue la misma convención y evita que un servicio nuevo se sume sin las tres líneas por copy-paste incompleto.

**Techos de `cpus` a partir de una fórmula sobre `mem_limit`** (por ejemplo, proporcional al ratio de memoria). Descartada: no hay relación real entre cuánta memoria reserva un proceso y cuánta CPU necesita bajo carga (`mailpit`, con 128 MiB igual que `redis`, hace una fracción del trabajo). Se optó por juicio por rol (quién sirve requests bajo carga real) con `podman stats` como piso de sanity check, no como fórmula.

**Tres entradas `docker` separadas en `dependabot.yml`, una por directorio, en vez de `directories` (plural) en una sola.** Válida también (el propio pedido la habilita), pero agrega 30 líneas repitiendo `cooldown`, `schedule`, `commit-message`, `labels` e `ignore` tres veces sin que ningún directorio necesite una política distinta. `directories` aplica la misma config a los tres con un solo bloque.

**Pinear también `docker-compose.yml` (dev).** Descartada: ese compose no se despliega, corre en la máquina de cada dev con `just infra-up`, y un pin ahí solo agrega fricción (`just infra-reset` deja de mostrar a simple vista qué versión corre) sin ganancia de superficie de ataque real, porque no está expuesto a internet.

**Gatear el escaneo con un solo paso por severidad combinada** (`severity: CRITICAL,HIGH`, `exit-code: '1'`), en vez de separar el gate del reporte. Rechazada por el pedido explícito: HIGH tiene que seguir avisando sin frenar. `exit-code` de Trivy aplica a todo lo que `severity` incluye, así que separar en dos escaneos por imagen es la única forma de tener un piso de corte distinto del piso de reporte.

## Consecuencias

- Un contenedor comprometido por una imagen o una dependencia con RCE parte de cero capacidades Linux y un filesystem que no puede modificar: el radio de lo que puede tocar sin escalar primero es mucho menor que antes.
- `postgres` y `redis` documentan por qué son la excepción a "cero capacidades": el día que se cambie de imagen base (por ejemplo, a una que ya corra como su usuario final sin entrypoint que baje privilegios), esta lista se puede volver a probar y achicar.
- Un runaway process en cualquier contenedor no puede, solo, tumbar el VPS entero: el techo de CPU y de PIDs de cada uno queda bien por debajo del total de la máquina.
- Cada imagen base tiene ahora quien la mira: Dependabot puede abrir el PR de Mailpit (y de cualquier otra) la próxima vez que corra, y cada pin por digest tiene un bump real que lo mueve en vez de quedar pineado para siempre a mano.
- Un CVE crítico con arreglo disponible en cualquiera de las dos imágenes propias frena el merge a `main` desde `publish-images.yml`; uno alto sigue visible en el summary y el artifact sin frenar nada.
- Si algún día una imagen deja de poder correr en solo lectura (una versión nueva que agregue un paso de inicialización que escriba en un lugar nuevo), el patrón para resolverlo es agregar el `tmpfs` puntual que necesite, no volver todo el servicio escribible.

## Refs

- [ADR-0091](0091-the-stage-runs-as-production-and-seeding-is-a-deploy-step.md): el mecanismo de `migrate` y `seed` que este cambio no toca, solo endurece.
- [`docker-compose.stage.yml`](../../docker-compose.stage.yml), [`docker-compose.prod.yml`](../../docker-compose.prod.yml), [`backend/Dockerfile`](../../backend/Dockerfile), [`frontend/Dockerfile`](../../frontend/Dockerfile), [`.dockerignore`](../../.dockerignore), [`.github/dependabot.yml`](../../.github/dependabot.yml), [`.github/workflows/publish-images.yml`](../../.github/workflows/publish-images.yml).
- [`docs/engineering/runbook.md`](../engineering/runbook.md), [`docs/engineering/deploy.md`](../engineering/deploy.md).
- [`k6/README.md`](../../k6/README.md): de ahí sale el dato de 2 vCPU del VPS.
