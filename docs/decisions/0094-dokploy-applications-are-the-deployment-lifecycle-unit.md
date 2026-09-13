# ADR-0094: Dokploy applications are the deployment lifecycle unit

- **Estado**: aceptado
- **Fecha**: 2026-09-12

## Contexto

El primer stage agrupó PostgreSQL, Redis, Mailpit, migración, API y web en un Compose monolítico. Ese modelo acopló datos persistentes con procesos reemplazables y convirtió una falla de siembra en una caída completa. También dejó al pipeline sin una unidad nativa para actualizar una imagen, esperar un job y verificar cada servicio por separado.

Dokploy ofrece Databases para PostgreSQL y Redis, y Applications para los procesos desplegables. La separación permite que cada recurso tenga su propio ciclo de vida sin convertir la base en parte del reemplazo de la aplicación.

Esta decisión sustituye la topología Compose anterior y consolida lo que sigue vigente de ella: stage corre con perfil Production, usa imágenes pregeneradas, migra antes de arrancar API y nunca siembra durante un deploy.

## Decisión

**Stage y producción usan recursos nativos de Dokploy. Las Applications son la unidad de ciclo de vida del deploy; PostgreSQL y Redis son Databases persistentes. Los Compose de deploy se retiran.**

[`docker-compose.yml`](../../docker-compose.yml) queda reservado a development local descartable.

### Recursos

Los nombres indicados son prefijos ingresados por una persona, no DNS interno estable:

| Ambiente | Tipo | Prefijo solicitado | Ciclo de vida |
|---|---|---|---|
| Stage | PostgreSQL Database | `planb-stage-postgres` | Persistente. |
| Stage | Redis Database | `planb-stage-redis` | Persistente. |
| Stage | API Application | `planb-stage-api` | Larga vida, imagen API por SHA. |
| Stage | Web Application | `planb-stage-web` | Larga vida, imagen web específica de stage por SHA. |
| Stage | Migrate Application | `planb-stage-migrate` | Run-once: Replicated de una réplica con Restart Policy `none`, una ejecución por deploy, misma imagen que API, Command `dotnet Planb.Api.dll migrate-db`. |
| Stage | Mailpit Application | `planb-stage-mailpit` | Larga vida, solo stage. |
| Production | PostgreSQL Database | `planb-production-postgres` | Persistente, todavía no creada. |
| Production | Redis Database | `planb-production-redis` | Persistente, todavía no creada. |
| Production | API Application | `planb-production-api` | Larga vida, todavía no creada. |
| Production | Web Application | `planb-production-web` | Larga vida, todavía no creada. |
| Production | Migrate Application | `planb-production-migrate` | Run-once, todavía no creada. |

Dokploy v0.26.3 agrega un sufijo aleatorio al `appName` de una Application. En la creación observada, ingresar `planb-stage-api` produjo `planb-stage-api-7mmcdb`. Ese valor confirma el mecanismo, no fija un hostname eterno. Cada integración consume el `appName` o hostname interno que el panel generó, lo guarda como variable no sensible en GitHub y Dokploy, y lo actualiza si el recurso se recrea.

Las conexiones a Databases también usan los endpoints generados por Dokploy. No se construyen hostnames a partir de los prefijos de la tabla.

### Orden de deploy

1. Publicar API y web con identidad de SHA y exigir que la CI de ese SHA esté verde. Migrate referencia exactamente la imagen API de ese SHA.
2. Actualizar y ejecutar Migrate como service Replicated de una réplica con Restart Policy `none`: la task corre una vez y no se reinicia, y cada deploy dispara una ejecución nueva.
3. Esperar el deployment de Dokploy y después la task del job: el contenedor nuevo etiquetado con el `appName` de Migrate, con la imagen del SHA, tiene que quedar en `exited` con `ExitCode` 0 y `FinishedAt` posterior al inicio del deploy, leído con `docker.getConfig` (`docker inspect`). `applicationStatus=done` no prueba que la task terminó. Si la task sale con otro código o no termina, cortar el deploy y dejar la corrida en rojo. Dokploy 0.26.3 no expone los logs de un contenedor por API, así que `Wolverine: listo.` queda para la lectura humana en el panel.
4. Actualizar y desplegar API. Esperar un deployment nuevo y una task nueva que use la imagen del SHA y quede `running` y `healthy`.
5. Actualizar y desplegar web con la misma prueba de deployment y task nueva. Su health interno tiene que alcanzar la API nueva.
6. Verificar desde afuera que `/health` publica el SHA esperado a través de web y que una ruta pública de web responde.

La API no migra al arrancar. El deploy nunca ejecuta `seed-db`.

### Estado operativo

**Verificado antes de aceptar esta decisión:** `migrate-db` funciona en modo Production, aplica EF Core y Wolverine, y una segunda corrida sin cambios no agrega migraciones. `seed-db` puede fallar contra una base acumulada y efectivamente bloqueó el stage cuando estaba en la cadena.

**Verificado en el stage con Dokploy 0.26.3:** Swarm rechaza un job que traiga `UpdateConfig` (`Jobs may not have an update config`) y Dokploy manda siempre uno, así que `ReplicatedJob` no es desplegable desde una Application. El run-once con Restart Policy `none` sí: la task corrió una vez, salió con 0 y no se reinició.

**Verificado en el stage nuevo (2026-09-13):** el arranque coordinado de las nuevas Applications y el cutover de dominios sobre los recursos reales, con Migrate como run-once y API, web y Mailpit `healthy`.

**Decidido y todavía no verificado:** la espera del exit code de la task de Migrate desde GitHub Actions. La primera corrida del workflow sobre estas Applications es la que lo prueba.

**No operativo:** producción todavía no existe.

### Cutover de stage

El cambio de topología es una migración de datos, no un reemplazo directo:

1. Crear las nuevas Databases y Applications sin borrar ni modificar destructivamente el Compose existente.
2. Hacer un backup de PostgreSQL del stage anterior.
3. Restaurar el backup en la nueva PostgreSQL Database y verificar su integridad.
4. Ejecutar Migrate y verificar que termine con éxito.
5. Desplegar y probar API, web y Mailpit contra las nuevas Databases.
6. Verificar `/health`, las rutas críticas y los dominios antes de mover tráfico.
7. Cambiar los dominios a las nuevas Applications.
8. Retirar el Compose anterior solo después de una decisión explícita. Crear los recursos nuevos no autoriza su borrado.

Mailpit requiere `/tmp` escribible mediante `tmpfs` o read-only desactivado, según lo que permita la Application.

## Alternativas consideradas

**Compose monolítico.** Mantiene la topología versionada en un archivo, pero ata Databases y Applications al mismo reemplazo y vuelve más frágil el orden migración, API y web. Ya convirtió una falla auxiliar en una caída. Descartada.

**Migrar durante el startup de API.** Evita una Application, pero cada réplica pasa a competir por el schema y una migración fallida se confunde con un proceso que no arranca. Descartada.

**Runner externo conectado a la base.** Puede ejecutar la migración antes del deploy, pero exige otro camino de red y credenciales hacia PostgreSQL y no garantiza usar el mismo artefacto que API. Descartada.

## Consecuencias

- Cada Application se actualiza, despliega, observa y revierte por separado.
- GitHub Actions coordina el orden y verifica health. Un cambio solo de docs no despliega.
- El web se construye por destino mientras `NEXT_PUBLIC_API_URL` quede horneado. Recrear API cambia su hostname interno y obliga a actualizar la variable correspondiente y reconstruir web.
- La configuración de runtime deja de vivir en Compose y pasa a Dokploy. El runbook debe registrar qué está decidido y qué fue verificado en el panel.
- Stage persiste datos como producción. Un reset requiere una acción destructiva explícita y un backup previo.
- Antes de crear producción tienen que existir backups externos con retención definida y una notificación activa para deploys fallidos. El rojo del workflow alcanza como señal de stage, no como operación de producción.
- Producción todavía no existe. Esta decisión define su contrato, no afirma que esté operativo.

## Refs

- [ADR-0089](0089-the-stage-follows-main-and-production-is-promoted-from-a-release.md): stage sigue a `main` y producción sale de un Release.
- [ADR-0092](0092-containers-run-least-privilege-and-the-image-chain-is-pinned-and-gated.md): privilegios e identidad de imágenes.
- [ADR-0093](0093-the-deploy-migrates-the-schema-and-never-seeds-data.md): el despliegue migra, el seed queda fuera y los datos persisten.
- [`docs/engineering/deploy.md`](../engineering/deploy.md), [`docs/engineering/runbook.md`](../engineering/runbook.md) y [`docs/engineering/rollback.md`](../engineering/rollback.md).
- [Dokploy, Applications, Advanced, Mode](https://docs.dokploy.com/docs/core/applications/advanced).
