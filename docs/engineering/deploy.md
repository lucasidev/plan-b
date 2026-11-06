# Deploy

Contrato operativo para publicar planb mediante Services de Coolify 4.6.0 con Compose propio. El diagnóstico está en [runbook.md](runbook.md) y la reversión en [rollback.md](rollback.md).

## Estado y alcance de la evidencia

Stage usa recursos migrados a Coolify. Producción todavía no existe. Development sigue siendo local y descartable, los previews son opcionales y efímeros, stage sigue a `main` y producción se promueve desde un Release de GitHub ([ADR-0089](../decisions/0089-the-stage-follows-main-and-production-is-promoted-from-a-release.md)).

El contrato del cliente se contrastó con el código de Coolify 4.6.0, commit `0becfba9113063336b09860579627fd218cb3fc4`. Los tests locales usan una API doble: prueban validación, preservación, secuencia y fallos, pero no prueban una migración real ni una corrida de Actions contra el servidor. Las corridas exitosas del 2026-09-13 corresponden a la infraestructura anterior de Dokploy y no validan este cliente.

## Recursos y nombres

Cada recurso de despliegue contiene exactamente un servicio Compose y una application de Coolify, sin databases dentro del mismo recurso. PostgreSQL, Redis y Mailpit tienen ciclos de vida independientes y el workflow no los modifica.

| Recurso de stage | Nombre del recurso Coolify | Nombre del servicio Compose |
|---|---|---|
| API | `planb-stage-api` | `planb-stage-api-7mmcdb` |
| Web | `planb-stage-web` | `planb-stage-web-phqofv` |
| Migrate | `planb-stage-migrate` | `planb-stage-migrate-by4rbu` |

El UUID identifica el recurso; el nombre Compose identifica su application, contenedor y consulta de logs. No se intercambian. Los alias internos anteriores se conservaron durante la migración: el build web de stage usa `http://planb-stage-api-7mmcdb:8080`. Si cambia el alias, actualizar la variable y reconstruir web.

El script exige UUID distintos y verifica UUID, nombre del recurso, nombre del servicio y repositorio de imagen antes de mutar. Producción usa recursos propios con nombres `planb-production-api`, `planb-production-web` y `planb-production-migrate`, cuando se creen.

## Configuración de GitHub

**Secretos:** `COOLIFY_API_TOKEN`, con permisos `read`, `read:sensitive`, `write` y `deploy` para los recursos del destino. El permiso sensible es necesario para leer Compose y logs; las respuestas también pueden incluir secretos anidados. El cliente nunca imprime esos cuerpos, el Compose, las variables ni los logs.

**Variables no sensibles:**

| Variable | Uso |
|---|---|
| `COOLIFY_URL` | Origen HTTPS del panel, sin `/api/v1`, credenciales ni query. |
| `COOLIFY_<TARGET>_MIGRATE_SERVICE_UUID` | UUID de Migrate. |
| `COOLIFY_<TARGET>_API_SERVICE_UUID` | UUID de API. |
| `COOLIFY_<TARGET>_WEB_SERVICE_UUID` | UUID de web. |
| `COOLIFY_<TARGET>_MIGRATE_SERVICE_NAME` | Nombre Compose de Migrate, según la tabla de stage. |
| `COOLIFY_<TARGET>_API_SERVICE_NAME` | Nombre Compose de API. |
| `COOLIFY_<TARGET>_WEB_SERVICE_NAME` | Nombre Compose de web. |
| `COOLIFY_<TARGET>_API_INTERNAL_URL` | URL interna de API que se hornea en web. |
| `COOLIFY_PRODUCTION_HEALTH_URL`, `COOLIFY_PRODUCTION_WEB_URL` | Probes de producción. |

`<TARGET>` es `STAGE` o `PRODUCTION`. Stage conserva las probes públicas `https://planb.olisar.com.ar/health` y `https://planb.olisar.com.ar` en el workflow. Faltar configuración del destino corta el job de resolución antes de publicar o mutar Coolify. El script vuelve a validar sus entradas antes de hacer requests; no existe fallback de producción a stage.

Las credenciales de PostgreSQL, Redis, JWT y SMTP siguen en Coolify. Las variables antiguas `DOKPLOY_*` no son consumidas por este workflow.

## Imágenes y Compose

API y Migrate usan exactamente la misma referencia `ghcr.io/lucasidev/plan-b/planb-api:<SHA>@sha256:<digest>`. Web usa `ghcr.io/lucasidev/plan-b/planb-web:<SHA>-<target>@sha256:<digest>`. Los digests vienen de los outputs del build y son las mismas referencias que escanea Trivy. `main` y `latest` no son destinos válidos.

El helper [coolify-service.ts](../../scripts/lib/coolify-service.ts) obtiene `GET /api/v1/services/{uuid}`, valida el Compose con Bun YAML y prepara un `PATCH` cuyo único campo es `docker_compose_raw`, codificado en base64 UTF-8. Cambia solamente `image` y `pull_policy: always`. Conserva environment, placeholders, volúmenes externos, redes, aliases, labels, límites y controles de seguridad; la serialización puede cambiar formato y comentarios. Rechaza builds, includes, extends y réplicas múltiples.

Las imágenes migradas estaban fijadas por digest y varios servicios tenían `pull_policy: never`. Un restart solo no publica el build nuevo: hay que cambiar explícitamente la imagen y permitir su pull. Antes de cada cambio se vuelve a comparar el Compose para detectar ediciones concurrentes. El servidor no ofrece una actualización condicional atómica; durante el deploy no se edita el mismo recurso desde el panel.

## Secuencia de despliegue

1. Resolver SHA y destino. Validar configuración del destino completo.
2. Construir y publicar API y web con tag del SHA y digest del build. Web es específico del destino.
3. Escanear las referencias por digest y esperar CI verde del mismo SHA. Ambos gates son obligatorios.
4. Leer y validar los tres recursos antes del primer cambio.
5. Ejecutar Migrate con la imagen API nueva y exigir su marcador único con código 0 y estado `exited`.
6. Restaurar el entrypoint y el perfil manual de Migrate, conservando el digest nuevo y `pull_policy: always`.
7. Detener API, esperar `exited` o `stopped`, actualizar Compose, confirmar lo guardado, iniciar y esperar `running:healthy`.
8. Repetir el mismo ciclo con web.
9. Exigir HTTP 200 en `/health` con `version` exactamente igual al SHA y HTTP 200 en la ruta web. No seguir redirecciones ni reutilizar caché.
10. Cualquier falla deja la corrida roja; no hay rollback automático de datos ni seed.

Se permite una interrupción del servicio entre stop y start. La concurrencia se serializa por destino, incluso si dos corridas parten de refs diferentes. Un cambio exclusivamente documental no publica ni despliega.

Los builds hacen checkout del SHA objetivo. Los jobs de deploy hacen checkout de [`github.workflow_sha`](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts#github-context), el commit de la implementación del workflow que inició la corrida: así una corrida del workflow actual puede desplegar un artefacto anterior a este cliente sin buscar el script nuevo en aquel commit. Esto no cambia el SHA ni los digests que se construyen, escanean y verifican.

### Migrate

El recurso conserva `restart: 'no'`, perfil `manual` y el entrypoint de tres elementos para `dotnet Planb.Api.dll migrate-db`. El Compose migrado puede expresar esos elementos con placeholders `M_*`, que se conservan al restaurarlo.

Durante la ejecución el cliente quita únicamente el perfil y reemplaza temporalmente el entrypoint por `/bin/sh -c`: invoca exactamente `dotnet Planb.Api.dll migrate-db`, captura su código, escribe `COOLIFY_CI_MIGRATION:<nonce>:<rc>` y sale con ese mismo código. Las variables del shell se escapan con `$$` para Compose. El nonce aleatorio se genera en cada corrida. Un marcador previo, un estado anterior o un mensaje de arranque no habilitan API ni web.

Los logs se leen en memoria con `GET /services/{uuid}/logs?sub_service_name=<nombre>&lines=1000`. Un código no cero, un timeout o una cancelación bloquean el resto. El cleanup intenta detener una ejecución incompleta y restaurar el entrypoint y el perfil, sin iniciar de nuevo. Si el runner desaparece abruptamente, la red falla o hubo una edición concurrente, esa restauración puede requerir intervención; seguir el runbook antes de reintentar.

### Límites de la API

`POST /services/{uuid}/start` encola trabajo y no devuelve un deployment ID. El cliente usa `POST /services/{uuid}/stop?docker_cleanup=false`: omitir esa query permitiría que Coolify programara limpieza de Docker. No usa delete, down con volúmenes ni prune.

Los estados de applications son el último estado guardado por Coolify, no una inspección directa del contenedor desde CI. El source de StopService marca `exited` tras intentar stop/remove, incluso si esos comandos fallan; por eso la transición por sí sola no prueba la imagen que está ejecutándose. StartService usa force-recreate. La confirmación del digest guardado, la transición y el SHA público constituyen las verificaciones disponibles para API y web. No se afirma inspección del digest del contenedor ni exit code obtenido por inspect.

## Operación, rollback y producción

Un rollback vuelve API y web a los digests sanos del destino, sin volver a ejecutar Migrate ni usar `Down()`. La compatibilidad del schema se revisa antes. Ver [rollback.md](rollback.md).

Producción sigue bloqueada hasta contar con recursos propios, backup externo, retención, restore ensayado y notificación activa de deploy fallido. Los builds web ya separan identidad por destino, pero todavía falta verificar la configuración y una promoción real. No se afirma producción operativa.

Los caches de BuildKit siguen separados por API y web/target. No se reducen límites ni se limpian imágenes o volúmenes desde este workflow. Los recursos persistentes se gestionan por fuera del despliegue.

## Seed y reset

El deploy nunca ejecuta `seed-db`. Una persona puede ejecutarlo con ambiente, base y SHA explícitos, backup si hay datos que conservar y revisión de su resultado. El seed no reescribe ni renumera filas existentes.

Resetear stage requiere autorización explícita, detener escrituras y confirmar base y ambiente. No forma parte del deploy. Ver [runbook.md](runbook.md#7-reset-destructivo-de-stage).

## Referencias

- [ADR-0089](../decisions/0089-the-stage-follows-main-and-production-is-promoted-from-a-release.md): ambientes y promoción.
- [ADR-0092](../decisions/0092-containers-run-least-privilege-and-the-image-chain-is-pinned-and-gated.md): hardening e imágenes.
- [ADR-0093](../decisions/0093-the-deploy-migrates-the-schema-and-never-seeds-data.md): migración y seed.
- [ADR-0094](../decisions/0094-dokploy-applications-are-the-deployment-lifecycle-unit.md): decisión histórica de la topología anterior.
- [publish-images.yml](../../.github/workflows/publish-images.yml) y [deploy-coolify-services.ts](../../scripts/deploy-coolify-services.ts): implementación del contrato.
