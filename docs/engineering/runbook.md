# Runbook del stage

Qué hacer cuando el stage se rompe o hay que intervenirlo. El armado desde cero está en [`deploy.md`](deploy.md); el revert de código y de schema, en [`rollback.md`](rollback.md). Cada caso lleva síntoma, diagnóstico y acción, y dice si se probó contra el stage real o no.

## Cómo se lee el stage

- **`https://planb.olisar.com.ar/health`**: 200 con `{"status":"ok","service":"planb-api","version":"<sha corto>","checks":[...]}` cuando el api, Postgres y Redis contestan; 503 con `status: fail` y el `error` de la dependencia que falló. `version` es el sha del build que corre: la forma más corta de saber qué hay desplegado.
- **Dokploy, servicio `stage`** (proyecto `planb`, environment `development`): *Deployments* lista cada deploy con su log (el pull de cada imagen con su tag, los contenedores recreados, `Healthy`, y `Docker Compose Deployed` al final); *Logs* muestra la salida de cada contenedor (100 líneas por default, "Limit to" trae más); *Monitoring* muestra CPU, memoria, disco y red por contenedor. El servidor tiene 3,82 GiB de memoria y 2 vCPU ([`k6/README.md`](../../k6/README.md)).
- **GitHub, Actions, *Publish images***: la corrida de cada merge a `main`. El job "Redeploy the stage" pide el deploy por la API y después espera hasta cinco minutos a que `/health` responda 200 con el sha del merge; si no llega, ese job falla y dice el último `/health` que vio.

## Casos

### 1. El merge terminó y el stage no cambió

**Síntoma.** El job "Redeploy the stage" falla con "El stage no llegó a `<sha>`", o `/health` sigue devolviendo el sha anterior.

**Diagnóstico.** En *Deployments*, el log del último deploy. Tres causas, en este orden:

1. Si dice `planb-api:<sha viejo> Pulled`, el Environment tiene `PLANB_API_TAG` y `PLANB_WEB_TAG` pineadas: una variable pineada le gana al default `main` del compose.
2. Si un servicio de un solo uso terminó en error, `api` no se recreó y el contenedor anterior siguió atendiendo: desde afuera el stage responde, con la versión vieja. Hoy el único de un solo uso es `migrate`, y sus logs dicen qué migración falló.
3. Si no hay deploy nuevo, la llamada a la API no llegó: el job lo dice (secrets faltantes o una respuesta distinta de `Deployment queued`).

**Acción.** Para (1), borrar las dos variables en *Environment*, Save y Deploy. Para (2), arreglar en `main` con un PR o con `git revert` ([`rollback.md`](rollback.md)); mientras tanto el stage sigue sirviendo la versión anterior. Para (3), cargar los secrets en GitHub (sección Secretos) y relanzar el workflow desde Actions.

Verificado el 2026-09-07 para la causa (1): fue exactamente lo que pasó en el primer merge con el stage continuo.

**Esta falla se acumula en silencio.** El 2026-09-10 se descubrió que los cuatro despliegues anteriores habían fallado en fila desde el 8 de septiembre, y desde afuera el stage seguía contestando con la versión vieja. La única señal es la corrida de *Publish images* en rojo: no hay aviso, hay que mirarla. Ese incidente sacó la siembra de la cadena del deploy ([ADR-0093](../decisions/0093-the-deploy-migrates-the-schema-and-never-seeds-data.md)), que era lo que fallaba, pero cualquier falla de `migrate` deja el mismo cuadro.

### 2. Crash loop después de un deploy que Dokploy dio por exitoso

**Síntoma.** `/health` responde 502 o 503 sostenido; en *Monitoring* el contenedor `api` reinicia; Dokploy no avisa, porque el deploy terminó bien y el contenedor se cayó después.

**Diagnóstico.** *Logs* del contenedor `api`: una migración que falla, una variable de Environment que falta (`JWT__Secret`, la connection string), o Wolverine pidiendo tipos pregenerados que la imagen no trae.

**Acción.** Pinear el sha anterior (caso 3) para que el stage vuelva a servir, y arreglar en `main` con un PR o con `git revert` ([`rollback.md`](rollback.md)). Con el arreglo mergeado, borrar el pin.

Sin verificar contra el stage real.

### 3. Pinear un sha y volver a `main`

**Pinear.** En *Environment*: `PLANB_API_TAG=<sha corto>` y `PLANB_WEB_TAG=<sha corto>`, Save, Deploy. El sha corto es el tag de la imagen que publicó *Publish images* (la pestaña *Packages* del repo lista los tags).

**Volver.** Borrar las dos variables, Save, Deploy: el compose vuelve a `main` y a partir de ahí cada merge redespliega.

Verificado el 2026-09-07 en las dos direcciones.

### 4. Disco lleno

**Síntoma.** Un deploy falla al bajar imágenes con `no space left on device`, o Postgres deja de escribir y el api responde 500.

**Diagnóstico.** Dokploy → *Monitoring* (el del servidor, no el del servicio) muestra el disco; por SSH, `df -h` y `docker system df`.

**Acción.** Por SSH, `docker image prune -a -f`: borra las imágenes que ningún contenedor usa, y las vigentes se vuelven a bajar en el próximo deploy. Si el espacio se lo llevan los logs de los contenedores, la rotación la fija el compose (`logging` con `max-size` y `max-file`). El prune semanal de GHCR no libera disco en el servidor: mantiene chico el catálogo del registro.

Sin verificar contra el stage real.

### 5. El certificado no renueva

**Síntoma.** El navegador avisa que el certificado venció; `curl -vI https://planb.olisar.com.ar` muestra la fecha.

**Diagnóstico.** El registro A del dominio tiene que seguir apuntando al servidor (Dokploy marca "DNS Valid" en *Domains*); los certificados que Traefik emitió están en Dokploy → *Traefik File System*; los logs de Traefik, en Dokploy → *Docker*, contenedor `traefik`.

**Acción.** Corregir el DNS si cambió. Para forzar una emisión nueva, en *Domains* del servicio desactivar y volver a activar HTTPS en ese dominio y Deploy. Let's Encrypt limita las emisiones por dominio a cinco por semana: no repetir a ciegas.

Sin verificar contra el stage real.

### 6. Dokploy caído

**Síntoma.** El panel no responde. El stage sigue sirviendo: los contenedores del compose no dependen del panel.

**Diagnóstico.** Por SSH, `docker service ls` muestra el servicio `dokploy` y sus réplicas; `docker service logs dokploy --tail 100` dice por qué no levanta.

**Acción.** `docker service update --force dokploy` lo relanza. Si el servidor entero está caído, es el proveedor del VPS. Mientras el panel no responde no hay deploys: el job "Redeploy the stage" falla en la llamada a la API y lo dice; cuando el panel vuelve, relanzar el workflow desde Actions.

Sin verificar contra el stage real.

### 7. Reset del stage, y sembrarlo

**El despliegue migra el esquema y no siembra** ([ADR-0093](../decisions/0093-the-deploy-migrates-the-schema-and-never-seeds-data.md)), así que volver a cero son dos movimientos, no uno.

**Reset.** Por SSH, `docker compose -p planb-stage-h30ogf down -v` (el App Name que muestra la cabecera del servicio es el nombre del proyecto de compose) y Deploy desde el panel. El servicio `migrate` vuelve a correr solo antes de que `api` arranque: migra el schema y aplica los recursos de Wolverine (ADR-0091). La base queda migrada y vacía.

**Sembrar.** El verbo `seed-db` de la misma imagen del `api`, contra la red interna del compose y con las mismas variables de conexión que usa `api`. Los tres valores salen del Environment del servicio:

```bash
docker run --rm --network planb-stage-h30ogf_internal \
  -e ASPNETCORE_ENVIRONMENT=Production \
  -e ConnectionStrings__Planb="Host=postgres;Port=5432;Database=planb;Username=planb;Password=<POSTGRES_PASSWORD>" \
  -e ConnectionStrings__Redis="redis:6379,password=<REDIS_PASSWORD>" \
  -e JWT__Secret="<JWT_SECRET>" \
  ghcr.io/lucasidev/plan-b/planb-api:main seed-db
```

Siembra personas, catálogo académico, catálogo de frases y el corpus sintético; la última línea es `CorpusSeeder: inserted N reviews`. Es el mismo comando para cargar un catálogo nuevo cuando el seed cambie: los datos del stage persisten entre despliegues y van a divergir del seed, y volver a alinearlos es esta corrida, decidida por alguien.

El seed es idempotente por id y no por clave natural, así que contra una base acumulada puede chocar con un unique de la base y cortar. Si pasa, el mensaje dice el índice; el reset de arriba lo resuelve a costa de los datos.

Sin verificar contra el stage real, y sin aplicar todavía: el compose sigue trayendo el servicio `seed`, así que hoy el deploy sigue sembrando solo. El comando de arriba sale de ese mismo servicio (misma imagen, mismas variables) y de que Docker nombra la red `<App Name>_internal`.

### 8. Entrar con las cuentas sembradas

Las cuatro personas, incluido el admin (`admin@planb.local`), entran con las passwords propias de `personas.json`: son públicas a propósito, elenco de prueba ([`dev-seed-personas.md`](dev-seed-personas.md)). Los mails de verificación y de reset llegan a `https://mail.olisar.com.ar`, que pide el usuario y la password de `MAILPIT_UI_AUTH`.

Mailpit con auth, verificado el 2026-09-04; el recorrido con cuenta, sin verificar.

### 9. El proceso de `api` crece en memoria hasta caerse, o el log se llena de líneas de `/health`

**Síntoma.** En *Monitoring*, la memoria de `api` sube en escalones sin bajar hasta pegar contra el `mem_limit` y el contenedor reinicia solo (`OOMKilled`); o en *Logs*, la ventana de líneas visibles se llena de una entrada por cada chequeo del healthcheck (cada 10 s) antes de que rote, tapando lo que importa diagnosticar.

**Diagnóstico.** Pasó cuando el stage corría `ASPNETCORE_ENVIRONMENT=Development` hospedado: Wolverine compilaba con Roslyn en runtime (`GeneratedCodeMode = Dynamic`) el handler de cada tipo de mensaje la primera vez que se invocaba, y con 87 endpoints Carter la memoria crecía con cada tipo nuevo ejercitado, no con el volumen de pedidos; aparte, el nivel de log Debug de `appsettings.Development.json` sumado al probe cada 10 s se comía la ventana de diagnóstico. Los dos son consecuencia del mismo problema: `Development` traía capacidades que el stage no había pedido (ver ADR-0091).

**Acción.** Ya no debería repetirse: desde ADR-0091 el stage corre `ASPNETCORE_ENVIRONMENT=Production`, con el código de Wolverine pregenerado en el build (`Static`, sin compilar nada en runtime) y los niveles de log de `appsettings.json`, más el filtro que baja a Verbose los pedidos exitosos a `/health` y `/metrics` (`Program.cs`). Si se repite, es una regresión: revisar que el Environment del servicio `api` en Dokploy siga en `Production` y no haya vuelto a `Development`.

Reproducido en local (podman) contra la imagen de esta rama, ver ADR-0091; sin verificar contra el stage real.

### 10. Un contenedor no arranca o crashea después de un deploy: `Read-only file system` u `Operation not permitted` en los logs

**Síntoma.** Un contenedor sale (`Exited`) apenas después de crear, o crashea en loop; en *Logs*, un mensaje del tipo `Read-only file system`, `Permission denied` o `Operation not permitted` sobre un path que no es uno de los que ese servicio ya declara como `tmpfs`.

**Diagnóstico.** Desde ADR-0092 los nueve servicios corren con `read_only: true` y `cap_drop: ["ALL"]` (`cap_add` puntual solo en Postgres y Redis). Casi siempre es una versión nueva de la imagen (propia o de terceros) que empezó a escribir en un lugar que antes no tocaba, o que ahora necesita una capacidad Linux que hoy nadie le da.

**Acción.** El log dice el path o la syscall que falló. Si es un path de escritura nuevo y legítimo, sumarlo al `tmpfs:` de ese servicio en el compose, no volverlo escribible entero; si es una capacidad (el mensaje suele nombrar la syscall, como `setresuid` para `SETUID`), sumarla puntual a su `cap_add`. Mientras tanto, pinear el sha anterior (caso 3) para que el servicio vuelva a servir.

Sin verificar contra el stage real: el patrón sale de cómo se armó y probó cada `tmpfs`/`cap_add` en ADR-0092, no de un incidente real.

## Secretos

Ningún valor vive en el repo ni se pasa por el chat: solo los nombres. Los carga Lucas.

### En GitHub (Settings → Secrets and variables → Actions, repository secrets)

| Nombre | Qué protege | Cómo se rota |
|---|---|---|
| `DOKPLOY_URL` | El origen del panel de Dokploy. | Cambia solo si cambia el panel. |
| `DOKPLOY_API_KEY` | Una API key del panel con los permisos del admin: el job del stage la usa para pedir el redeploy. | Dokploy → Settings → Profile → API Keys: generar una nueva, reemplazar el secret, revocar la anterior. |
| `DOKPLOY_STAGE_COMPOSE_ID` | El id del servicio Compose del stage. | Cambia solo si el servicio se recrea (último segmento de la URL del servicio). |
| `LOCKFILE_BOT_APP_ID`, `LOCKFILE_BOT_PRIVATE_KEY` | El GitHub App `planb-ci-bot`, que regenera `bun.lock` en los PRs de Dependabot para que los workflows se disparen ([ADR-0043](../decisions/0043-github-app-for-bot-pushes-that-trigger-workflows.md)). | En la página del App, generar una private key nueva, reemplazar el secret y borrar la anterior. |
| `GITHUB_TOKEN` | Lo emite GitHub por corrida; publica las imágenes en GHCR. | No se rota: nace y muere con cada corrida. |

### En Dokploy (servicio `stage`, pestaña Environment)

| Nombre | Qué protege | Cómo se rota |
|---|---|---|
| `POSTGRES_PASSWORD` | La base del stage. | Postgres guarda la password en su volumen: cambiar el valor y hacer el reset (caso 7). |
| `REDIS_PASSWORD` | Redis del stage. | Cambiar el valor y Deploy. |
| `JWT_SECRET` | La firma de las sesiones; lo usan `api` y `web`. | Cambiar el valor y Deploy: cierra todas las sesiones abiertas. |
| `SESSION_SECRET` | Lo exige el esquema de entorno del frontend. | Cambiar el valor y Deploy. |
| `MAILPIT_UI_AUTH` | La UI de Mailpit, donde se ven los links de verificación y de reset. | Cambiar el valor y Deploy. |

`SMTP_FROM_EMAIL`, `SMTP_FROM_NAME`, `WEB_HOST`, `PLANB_API_TAG` y `PLANB_WEB_TAG` no son secretos.

### En el panel

La cuenta de Lucas (admin de Dokploy), las llaves SSH del servidor (Dokploy → SSH Keys) y el GitHub App `lucasidev-ops`, que es el provider con el que el servicio lee el compose del repo.
