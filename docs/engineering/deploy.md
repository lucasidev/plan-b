# Deploy

Contrato operativo para publicar planb en Dokploy. El camino de una falla está en [`runbook.md`](runbook.md) y la reversión en [`rollback.md`](rollback.md).

## Estado

**Decidido:** development es local y descartable; los previews de PR son opcionales y efímeros; stage es persistente y sigue a `main`; producción será persistente y saldrá de un GitHub Release. Stage y producción usan Databases y Applications nativas de Dokploy, no Compose de deploy.

**Verificado en Dokploy v0.26.3:** ingresar el prefijo `planb-stage-api` creó una Application cuyo `appName` fue `planb-stage-api-7mmcdb`. Dokploy agrega un sufijo aleatorio, por lo que el prefijo no es DNS interno estable.

**Verificado por incidente:** Mailpit cayó con filesystem read-only al intentar escribir en `/tmp`. Su Application necesita `/tmp` escribible mediante `tmpfs` o read-only desactivado.

**No verificado en esta pieza:** el cutover completo del stage, la secuencia automatizada de Migrate, API y web, el restore sobre la nueva Database y los dominios sobre las nuevas Applications.

**No operativo:** producción todavía no existe.

## Ambientes

| Ambiente | Persistencia | Fuente de código | Infraestructura |
|---|---|---|---|
| Development local | Descartable | Checkout local | [`docker-compose.yml`](../../docker-compose.yml), solo Postgres, Redis y Mailpit locales. |
| Preview de PR | Efímera y opcional | SHA del PR | Recursos temporales. No nace de una rama de ambiente. |
| Stage | Persistente | SHA mergeado en `main` | Databases y Applications de Dokploy. |
| Production | Persistente | SHA de un GitHub Release | Databases y Applications propias, cuando se cree. |

No existe rama `development`. Tampoco hay rama de release.

## Recursos Dokploy

Los nombres siguientes son prefijos solicitados. El `appName`, hostname interno, id y endpoint efectivos son los que genera Dokploy:

| Ambiente | Recurso | Prefijo solicitado | Función |
|---|---|---|---|
| Stage | PostgreSQL Database | `planb-stage-postgres` | Datos persistentes. |
| Stage | Redis Database | `planb-stage-redis` | Estado efímero de la aplicación, persistente entre deploys. |
| Stage | API Application | `planb-stage-api` | API de larga vida. |
| Stage | Web Application | `planb-stage-web` | Web de larga vida. |
| Stage | Migrate Application | `planb-stage-migrate` | Run-once: Replicated de una réplica con Restart Policy `none`, una ejecución de `migrate-db` por deploy. |
| Stage | Mailpit Application | `planb-stage-mailpit` | SMTP catcher y UI, solo stage. |
| Production | PostgreSQL Database | `planb-production-postgres` | Datos persistentes, todavía no creada. |
| Production | Redis Database | `planb-production-redis` | Estado efímero, todavía no creada. |
| Production | API Application | `planb-production-api` | API, todavía no creada. |
| Production | Web Application | `planb-production-web` | Web, todavía no creada. |
| Production | Migrate Application | `planb-production-migrate` | Run-once, todavía no creada. |

No hay Mailpit en producción. El correo productivo usará un relay SMTP real.

Toda Database lleva Update Config `{"Parallelism": 1, "Order": "stop-first"}` antes de su primer redeploy. El default de Dokploy es `start-first`: en un redeploy la instancia nueva arranca mientras la vieja sigue viva sobre el mismo volumen, y dos PostgreSQL sobre un solo directorio de datos dejan el clúster inconsistente (verificado en el stage el 2026-09-13; ver [`runbook.md`](runbook.md), caso 8).

### Identificadores generados

No se arma un hostname agregando o quitando sufijos. Después de crear o recrear un recurso se copian desde Dokploy:

- el id de cada Application que usa GitHub Actions;
- el `appName` o hostname interno real de API que necesita el build de web;
- el hostname interno real de Mailpit que usa API en stage;
- los endpoints reales de PostgreSQL y Redis.

El hostname interno real de API se guarda como variable no sensible en GitHub y en el Environment de Dokploy. Si la Application se recrea, se actualiza en ambos lugares antes del siguiente build. Los ids y hostnames no son secretos; las credenciales asociadas sí.

## Configuración por Application

### API

- Imagen `planb-api` identificada por SHA, nunca `main` ni `latest`.
- `ASPNETCORE_ENVIRONMENT=Production`.
- Conexiones a los endpoints generados de PostgreSQL y Redis.
- Configuración de JWT, SMTP y bases de links cargada en Dokploy.
- Health check contra `/health`.
- Sin migración ni seed al arrancar.
- Usuario no root, capacidades dropeadas, filesystem read-only y límites de recursos según [ADR-0092](../decisions/0092-containers-run-least-privilege-and-the-image-chain-is-pinned-and-gated.md).

### Migrate

- Misma referencia inmutable de imagen que API.
- Command `dotnet Planb.Api.dll migrate-db`: en Dokploy el Command de una Application reemplaza el entrypoint de la imagen, así que lleva el ejecutable y el verbo.
- Swarm Mode Replicated con 1 réplica y Restart Policy `{"Condition": "none"}`: la task corre una vez y no se reinicia; cada deploy dispara una ejecución nueva.
- Mismas conexiones a PostgreSQL y Redis que API.
- Sin dominio público y sin comportamiento de servicio de larga vida.

Dokploy 0.26.3 no puede desplegar un `ReplicatedJob`: manda siempre un `UpdateConfig` y Swarm lo rechaza (`Jobs may not have an update config`). Mode, Restart Policy y Update Config viven en [Applications, Advanced](https://docs.dokploy.com/docs/core/applications/advanced).

### Web

- Imagen identificada por SHA, nunca `main` ni `latest`.
- Build específico del destino mientras `NEXT_PUBLIC_API_URL` siga horneado en el bundle.
- `NEXT_PUBLIC_API_URL` usa el hostname interno real generado para API, no el prefijo solicitado.
- Health check y dominio público configurados en su Application.

Dos builds web del mismo commit pueden diferir si apuntan a API internas distintas. Antes de producción, el pipeline tiene que garantizar referencias inmutables separadas por destino sin reemplazarlas por tags móviles. Este documento no fija la estructura de paquetes porque el workflow que la implementa está fuera de este alcance.

### Mailpit

- Solo stage.
- Imagen de tercero pineada por digest.
- Hostname SMTP y dominio de UI tomados del recurso real.
- UI protegida.
- `/tmp` escribible mediante `tmpfs`. Si Dokploy no permite ese `tmpfs`, read-only queda desactivado para Mailpit.

## Deploy automático de stage

Un push a `main` despliega solo cuando cambia una superficie desplegable y la CI del mismo SHA termina verde. Un cambio exclusivamente documental termina sin build ni deploy. Una imagen publicada o escaneada con éxito no autoriza por sí sola a tocar Dokploy.

Secuencia:

1. Resolver el SHA del commit.
2. Construir y publicar API y web con referencias inmutables por SHA. Web usa el hostname interno real de la API de stage.
3. Escanear las imágenes y esperar la corrida de CI del mismo SHA. Un gate crítico o una CI que no terminó verde corta antes de tocar Dokploy.
4. Actualizar Migrate para usar exactamente la imagen API del SHA.
5. Desplegar Migrate (run-once). Esperar un deployment nuevo de Dokploy y después su task nueva, leída con `docker.getConfig`: pertenece al `appName` de Migrate, corre la imagen del SHA, está en `exited` con `ExitCode` 0 y terminó después de iniciado el deploy. Un `done` anterior ni `applicationStatus=done` prueban esta ejecución.
6. Si Migrate falla, terminar en rojo. No desplegar API ni web.
7. Desplegar API. Esperar un deployment y una task nuevos; la task debe correr la imagen del SHA y quedar `running` y `healthy`.
8. Desplegar web con la misma prueba. Su health interno debe alcanzar la API nueva.
9. Verificar desde afuera `/health`, incluido el SHA servido a través de web, y una ruta pública de web.
10. Si cualquier verificación falla, terminar en rojo y seguir [`runbook.md`](runbook.md).

El rojo del workflow es la señal operativa mínima del stage. No se interpreta una publicación exitosa de imágenes como un deploy exitoso.

## Promoción a producción

Producción usa el mismo orden, pero el disparador es un GitHub Release y los recursos son los del ambiente productivo. No se promueve el tag móvil del stage porque no existe tal tag: se promueve un SHA.

Antes de crear producción son requisitos bloqueantes:

- backup externo de PostgreSQL, fuera del mismo host;
- retención definida y documentada;
- prueba de restore;
- notificación activa de deploy fallido, no solo una corrida roja que alguien tenga que mirar;
- resolución del versionado de los builds web específicos por destino sin colisión bajo un mismo SHA.

Hasta cumplirlos no se afirma que producción está lista ni operativa.

## Cutover del stage desde Compose

El objetivo es conservar los datos y mantener reversible el cambio de tráfico. No se borra el Compose viejo durante la preparación.

1. Identificar el Compose actual, su PostgreSQL y los dominios que sirve.
2. Hacer un backup de PostgreSQL antes de tocar schema o tráfico.
3. Crear las nuevas PostgreSQL y Redis Databases.
4. Crear API, web, Migrate y Mailpit Applications con los prefijos de este documento.
5. Registrar ids, `appName`, hostnames y endpoints generados. Guardar el hostname interno real de API como variable no sensible en GitHub y Dokploy.
6. Configurar credenciales y variables en cada recurso sin copiarlas al repo.
7. Restaurar el backup en la nueva PostgreSQL Database y verificar que el restore termine sin error.
8. Ejecutar Migrate y verificar que su task termine con exit 0; en el panel, los logs de esa ejecución terminan en `Wolverine: listo.`.
9. Desplegar API y comprobar `/health`, PostgreSQL, Redis y el SHA servido.
10. Desplegar web y Mailpit. Comprobar la ruta pública, el flujo API, SMTP y la UI de Mailpit. Mailpit debe tener `/tmp` escribible.
11. Verificar los dominios sobre las nuevas Applications antes de retirar el tráfico anterior.
12. Cambiar los dominios y repetir `/health`, API, web y Mailpit desde afuera.
13. Mantener el Compose anterior intacto hasta cerrar la verificación.
14. Borrar el Compose anterior solo después de una decisión explícita. El cutover exitoso no autoriza ese borrado por sí solo.

El backup previo al cutover es requisito aunque stage no tenga usuarios productivos: sus datos ahora persisten y el objetivo es conservarlos.

## Seed manual

El deploy nunca ejecuta `seed-db`. Una persona puede ejecutar ese verbo con la misma imagen API del SHA, dentro de la red del destino y contra recursos identificados explícitamente.

Antes de correrlo:

1. Confirmar ambiente, Database y SHA.
2. Hacer backup si la Database contiene datos que importan.
3. Saber que el seed reconoce lo existente por la clave natural protegida por cada índice único y no actualiza ni renumera filas existentes: una carga nueva contra una base acumulada suma lo que falta y avisa los ids que no puede alinear.
4. Ejecutar `seed-db` como acción manual, no como Application persistente ni dependencia de API.
5. Revisar el resultado. Una falla del seed no dispara rollback de aplicación.

## Reset

Resetear stage es destructivo y nunca forma parte de un deploy:

1. Confirmar en el panel que el destino es la PostgreSQL Database de stage, no producción.
2. Hacer y conservar un backup previo.
3. Detener o bloquear escrituras.
4. Vaciar o recrear la Database mediante una acción explícita de Dokploy.
5. Si cambió el endpoint, actualizar las conexiones de API y Migrate.
6. Ejecutar Migrate y esperar éxito.
7. Desplegar API y web y verificar health.
8. Ejecutar `seed-db` solo si una persona decide volver a cargar datos.

## Refs

- [ADR-0089](../decisions/0089-the-stage-follows-main-and-production-is-promoted-from-a-release.md): ambientes y promoción.
- [ADR-0092](../decisions/0092-containers-run-least-privilege-and-the-image-chain-is-pinned-and-gated.md): hardening e imágenes.
- [ADR-0093](../decisions/0093-the-deploy-migrates-the-schema-and-never-seeds-data.md): migración y seed.
- [ADR-0094](../decisions/0094-dokploy-applications-are-the-deployment-lifecycle-unit.md): topología de recursos.
