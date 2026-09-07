# Runbook del stage

Qué hacer cuando el stage se rompe o hay que intervenirlo. El armado desde cero está en [`deploy.md`](deploy.md); el revert de código y de schema, en [`rollback.md`](rollback.md). Cada caso lleva síntoma, diagnóstico y acción, y dice si se probó contra el stage real o no.

## Cómo se lee el stage

- **`https://planb.olisar.com.ar/health`**: 200 con `{"status":"ok","service":"planb-api","version":"<sha corto>","checks":[...]}` cuando el api, Postgres y Redis contestan; 503 con `status: fail` y el `error` de la dependencia que falló. `version` es el sha del build que corre: la forma más corta de saber qué hay desplegado.
- **Dokploy, servicio `stage`** (proyecto `planb`, environment `development`): *Deployments* lista cada deploy con su log (el pull de cada imagen con su tag, los contenedores recreados, `Healthy`, y `Docker Compose Deployed` al final); *Logs* muestra la salida de cada contenedor (100 líneas por default, "Limit to" trae más); *Monitoring* muestra CPU, memoria, disco y red por contenedor. El servidor tiene 3,82 GiB de memoria.
- **GitHub, Actions, *Publish images***: la corrida de cada merge a `main`. El job "Redeploy the stage" pide el deploy por la API y después espera hasta cinco minutos a que `/health` responda 200 con el sha del merge; si no llega, ese job falla y dice el último `/health` que vio.

## Casos

### 1. El merge terminó y el stage no cambió

**Síntoma.** El job "Redeploy the stage" falla con "El stage no llegó a `<sha>`", o `/health` sigue devolviendo el sha anterior.

**Diagnóstico.** En *Deployments*, el log del último deploy. Si dice `planb-api:<sha viejo> Pulled`, el Environment tiene `PLANB_API_TAG` y `PLANB_WEB_TAG` pineadas: una variable pineada le gana al default `main` del compose. Si no hay deploy nuevo, la llamada a la API no llegó: el job lo dice (secrets faltantes o una respuesta distinta de `Deployment queued`).

**Acción.** Borrar las dos variables en *Environment*, Save y Deploy. Si faltan secrets, cargarlos en GitHub (sección Secretos) y relanzar el workflow desde Actions.

Verificado el 2026-09-07: fue exactamente lo que pasó en el primer merge con el stage continuo.

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

### 7. Reset del stage

Por SSH, `docker compose -p planb-stage-h30ogf down -v` (el App Name que muestra la cabecera del servicio es el nombre del proyecto de compose) y Deploy desde el panel. Migraciones y siembras corren solas al arrancar: personas, catálogo, frases y el corpus sintético.

Sin verificar contra el stage real.

### 8. Entrar con las cuentas sembradas

Las cuatro personas y el admin (`admin@planb.local`) entran con `PLANB_SEED_PASSWORD`, no con las passwords de `personas.json`, que son públicas. Los mails de verificación y de reset llegan a `https://mail.olisar.com.ar`, que pide el usuario y la password de `MAILPIT_UI_AUTH`.

Mailpit con auth, verificado el 2026-09-04; el recorrido con cuenta, sin verificar.

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
| `PLANB_SEED_PASSWORD` | La password de las cuentas sembradas, incluido el admin. | La siembra ya corrió: cambiar el valor y hacer el reset (caso 7). |

`SMTP_FROM_EMAIL`, `SMTP_FROM_NAME`, `WEB_HOST`, `PLANB_API_TAG` y `PLANB_WEB_TAG` no son secretos.

### En el panel

La cuenta de Lucas (admin de Dokploy), las llaves SSH del servidor (Dokploy → SSH Keys) y el GitHub App `lucasidev-ops`, que es el provider con el que el servicio lee el compose del repo.
