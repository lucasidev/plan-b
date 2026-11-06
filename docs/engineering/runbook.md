# Runbook de stage y deploy

Qué mirar y qué hacer cuando el stage no actualiza o un recurso de Coolify falla. El contrato está en [`deploy.md`](deploy.md); la política de reversión, en [`rollback.md`](rollback.md).

## Estado conocido

- Stage se define como ambiente persistente con perfil Production y datos persistentes.
- API, web y Migrate son Services de Coolify 4.6.0 con un único servicio Compose cada uno. PostgreSQL, Redis y Mailpit tienen ciclos de vida independientes.
- Migrate conserva `restart: 'no'` y perfil `manual`. El cliente lo habilita temporalmente para ejecutar `dotnet Planb.Api.dll migrate-db`, exige un marcador único de esa corrida con código 0 y restaura su entrypoint y perfil al terminar.
- Producción todavía no existe.
- Las verificaciones de Actions del 2026-09-13 corresponden al stack anterior de Dokploy. Los tests locales del nuevo cliente no prueban un deploy real por Coolify.
- La migración conservó los nombres Compose y alias internos, incluido `planb-stage-api-7mmcdb`. Se configuran explícitamente junto al UUID de cada recurso; no se deducen de un prefijo.
- Se verificó por incidente que Mailpit necesita `/tmp` escribible.
- Nunca deben convivir dos PostgreSQL escribiendo sobre el mismo directorio de datos. El workflow no reinicia ni modifica la base.

## Fuentes de verdad

1. **GitHub Actions:** la corrida del commit muestra si CI y escaneo habilitaron el deploy, si Migrate emitió el marcador nuevo con código 0, si API y web pasaron health y si la prueba pública confirmó el SHA. Un cambio solo de docs no despliega.
2. **`/health`:** devuelve el estado de API, PostgreSQL y Redis y el SHA servido. Una imagen publicada no está desplegada hasta que ese SHA aparece.
3. **Coolify Services:** Compose y estado de cada application. El status es cacheado, no una inspección directa hecha por CI. Un `running:healthy` anterior o un start encolado no prueban el deploy nuevo.
4. **Recursos persistentes:** endpoint, almacenamiento y backups de PostgreSQL; endpoint y estado de Redis.
5. **Variables no sensibles:** UUID, nombre Compose y URL interna de API. Consultar la tabla completa de [deploy.md](deploy.md#configuración-de-github). Los logs y respuestas sensibles se revisan de forma privada, nunca se copian al output de Actions.

## Casos

### 1. El merge terminó y stage no cambió

**Síntoma:** `/health` sirve el SHA anterior o la corrida terminó en rojo.

**Diagnóstico:**

1. Confirmar que el cambio no sea exclusivamente documental. En ese caso no debe existir deploy.
2. Revisar configuración del destino, CI, publicación y escaneo. Una falla ahí debe cortar antes de tocar Coolify.
3. Revisar Migrate: el cliente exige `exited` y `COOLIFY_CI_MIGRATION:<nonce>:0` del nonce de esa corrida. Un log previo o `Wolverine: listo.` por sí solo no alcanza.
4. Si Migrate terminó bien, revisar los digests configurados, el stop confirmado antes de start, `running:healthy` de API y web y el SHA público.
5. Confirmar que UUID, nombre del recurso, nombre Compose y hostname interno coincidan. Un 401/403 indica token o permisos; el token necesita `read:sensitive` para Compose y logs, además de lectura, escritura y deploy.

**Acción:** corregir la causa con un PR y relanzar la corrida permitida. No ejecutar `seed-db` para destrabar un deploy.

**Señal:** el workflow rojo es la señal mínima de stage. Cuatro fallas consecutivas ya quedaron ocultas una vez detrás de una versión vieja que seguía respondiendo, así que no se da por sano un deploy porque la URL contesta.

### 2. Migrate falla

**Síntoma:** la task de Migrate sale con código distinto de 0 o no termina, y API/web no reciben el SHA nuevo.

**Diagnóstico:** revisar de forma privada los logs de la application de Migrate dentro del Service `planb-stage-migrate`. Confirmar:

- imagen API con el SHA y digest esperados;
- el wrapper temporal invocó exactamente `dotnet Planb.Api.dll migrate-db`;
- `restart: 'no'`, sin réplicas múltiples;
- endpoints y credenciales de PostgreSQL y Redis;
- error exacto de EF Core o Wolverine.

**Acción:** no ejecutar la migración desde API ni convertir Migrate en servicio de larga vida. Preparar una migración correctiva y volver a desplegar Migrate. El default de schema es roll-forward, no `Down()` sobre un ambiente persistente.

Si el runner se canceló o desapareció, confirmar que Migrate esté detenido y recuperar el entrypoint original de tres elementos, incluido cualquier placeholder `M_*`, y el perfil `manual`, conservando el digest nuevo. El cleanup no vuelve a iniciar el job. Si falta el marcador nuevo o no se puede probar su finalización, no habilitar API ni web. Una falla de restauración también deja el deploy bloqueado. No reintentar hasta resolverla.

### 3. Migrate termina, pero API o web no quedan sanos

**Síntoma:** Migrate completó y `/health` da 502, 503 o un SHA distinto; web no sirve la ruta pública.

**Diagnóstico:**

- API: revisar configuración Production, conexiones, JWT, SMTP, tipos pregenerados y health check.
- Web: revisar que la imagen sea la específica de stage y que `NEXT_PUBLIC_API_URL` haya sido horneada con el hostname interno real de API.
- Ambos: comparar tag y digest configurados en Coolify con los outputs de la corrida. La API de Services no expone inspect del contenedor; no confundir la configuración con la imagen probada en runtime.

**Acción:** si el arreglo no es inmediato, volver API y web al último SHA sano según [`rollback.md`](rollback.md). No retroceder schema por default.

### 4. Un Service fue recreado

**Síntoma:** el recurso existe, pero web no llega a API, API no llega a Mailpit o Actions recibe not found al desplegar.

**Diagnóstico:** comparar UUID, nombre del recurso, nombre Compose y alias interno con las variables no sensibles de GitHub y Coolify. El preflight rechaza recursos ambiguos o con más de una application.

**Acción:**

1. Actualizar el UUID y nombre Compose donde los consume Actions.
2. Actualizar el alias o hostname interno real en GitHub y Coolify.
3. Si se recreó API, reconstruir web porque `NEXT_PUBLIC_API_URL` queda horneada.
4. Si se recreó Mailpit, actualizar el host SMTP de API.
5. Desplegar y repetir health y flujo de correo.

`planb-stage-api-7mmcdb` es el alias conservado en la migración actual; no permite deducir otros nombres.

### 5. Mailpit cae con `Read-only file system`

**Síntoma:** Mailpit no queda sano y sus logs muestran una escritura fallida en `/tmp`.

**Diagnóstico:** revisar si `/tmp` es escribible. El stage real ya confirmó que la imagen lo necesita.

**Acción:** configurar `/tmp` como `tmpfs` en su Compose y verificar arranque, health y recepción de un mail. No retirar controles de otros servicios para resolver este mount.

### 6. Ejecutar `seed-db` a mano

**Cuándo:** una persona decide cargar o actualizar los datos del stage. No se usa para reparar un deploy.

**Antes:**

1. Confirmar visualmente que el destino es stage.
2. Registrar el SHA de la imagen API que se va a ejecutar.
3. Hacer backup si hay datos que importan.
4. Recordar que la idempotencia consulta ids y claves naturales: no reescribe filas existentes ni corrige ids que ya difieren del seed.

**Acción:** ejecutar `seed-db` una vez con la misma imagen inmutable de API, dentro de la red del destino y contra los endpoints reales. Revisar el exit code y los logs. No crear un servicio de seed de larga vida y no agregarlo al workflow.

**Si falla:** conservar el error. No resetear automáticamente. La aplicación sigue desplegada porque seed no es parte de su health.

### 7. Reset destructivo de stage

**Autorización:** un reset requiere una decisión explícita. No se infiere de un seed fallido, un deploy fallido ni un cutover exitoso.

**Preparación de una demo (R7, #526):** los recorridos con cuenta (`just walk lucia`, `just walk matias`, `just walk copas` y `just walk sofia`) se ejecutan antes del reset final. Escriben reseñas, cuentas, cátedras o frases, así que nunca corren sobre el corpus que se deja para mostrar. Primero se corrigen sus hallazgos y se verifica el SHA desplegado; después se hace el reset y seed autorizado de ese mismo SHA, con el respaldo que corresponda a los datos que se deben conservar.

**Acción:**

1. Confirmar nombre, id y ambiente de la PostgreSQL Database. Tiene que ser stage.
2. Hacer un backup y guardar su ubicación si hay datos que conservar. Para preparar una demo con datos de prueba recreables, puede omitirse cuando la autorización del reset incluye descartarlos; registrar esa decisión. No hace falta agregar infraestructura de backups para ese caso.
3. Detener o bloquear escrituras.
4. Vaciar o recrear la base mediante la operación autorizada sobre el recurso identificado de Coolify.
5. Si cambió el endpoint, actualizar API y Migrate.
6. Ejecutar Migrate y esperar una finalización exitosa.
7. Desplegar API y web y verificar `/health`.
8. Ejecutar `seed-db` solo si una persona decide cargar el corpus.

No usar delete de Services, prune ni down con volúmenes como atajo de reset. El cliente de deploy no modifica almacenamiento persistente.

**Después del seed para la demo:** importar la AGN desde `/admin/universities`, ejecutar `just walk valentina` sin cuenta y revisar el backoffice en modo lectura con administración. Confirmar Ruiz con 6 reseñas, Bravo con 9, la fama en Ibáñez, la comparación de Pérez calculada solo con hermanas que publican, el corte de Aráoz y Método sin frases de prueba. Registrar el SHA servido y el resultado en el [guion de la demo](../plan/demo-script.md), y poner el tag narrativo sobre ese SHA cuando la aceptación termine. Si una corrección requiere escribir con una cuenta, se repite esta preparación antes de dejar el stage listo.

### 8. PostgreSQL perdió o corrompió datos

**Síntoma:** faltan filas, hay corrupción confirmada o la Database no puede recuperar su estado.

**Acción:** detener escrituras y seguir la restauración de [`rollback.md`](rollback.md). Un bug de código o una migración incompatible sin pérdida de datos no autoriza restore: se corrige por roll-forward.

**Antecedente histórico:** en Dokploy, `start-first` llegó a arrancar dos PostgreSQL sobre el mismo volumen y provocó inconsistencia. Ese parámetro Swarm no configura los Services actuales de Coolify. Se conserva el invariante: una sola instancia escribe en cada directorio, y no se reinicia la base mientras Migrate o `seed-db` están escribiendo.

### 9. Certificado o dominio falla

**Síntoma:** TLS vencido, DNS inválido o tráfico apuntando al recurso viejo.

**Diagnóstico:** comparar DNS público, labels de Traefik y dominio de Coolify con el recurso actual.

**Acción:** corregir DNS o el dominio en Coolify y verificar desde afuera. No borrar recursos ni volúmenes como parte automática del cambio.

### 10. Coolify o el host se queda sin recursos

**Síntoma:** deploys que no inician, tareas rechazadas, OOM o falta de espacio.

**Diagnóstico:** revisar métricas del host y los límites de cada recurso. El workflow preserva los límites existentes del Compose; no prueba si esos valores tienen margen suficiente.

**Acción:** liberar solo recursos no usados y ajustar límites con evidencia. No desactivar globalmente los controles de [ADR-0092](../decisions/0092-containers-run-least-privilege-and-the-image-chain-is-pinned-and-gated.md).

## Configuración sensible y no sensible

### GitHub

**Secretos:** `COOLIFY_API_TOKEN` y credenciales necesarias para el registry.

**Variables no sensibles:** `COOLIFY_URL`, UUID y nombres Compose por destino, probes y hostname interno de API para el build web. Se actualizan si un recurso se recrea; producción no hereda valores de stage.

### Coolify

**Secretos:** credenciales de PostgreSQL y Redis, JWT, credenciales SMTP y cualquier autenticación de Mailpit.

**Variables no sensibles:** `ASPNETCORE_ENVIRONMENT`, bases de links, hostnames internos generados y configuración de health.

Ningún valor sensible vive en el repo ni en este documento.

## Producción

Producción todavía no existe. Antes de crearla deben estar resueltos y probados:

- backups externos de PostgreSQL;
- retención definida;
- restore ensayado;
- notificación activa de deploy fallido;
- verificación de los artefactos web específicos por destino y de su configuración productiva.

## Refs

- [`deploy.md`](deploy.md): recursos, configuración y cutover.
- [`rollback.md`](rollback.md): SHA rollback, roll-forward de schema y restore.
- [ADR-0089](../decisions/0089-the-stage-follows-main-and-production-is-promoted-from-a-release.md): promoción.
- [ADR-0092](../decisions/0092-containers-run-least-privilege-and-the-image-chain-is-pinned-and-gated.md): hardening.
- [ADR-0093](../decisions/0093-the-deploy-migrates-the-schema-and-never-seeds-data.md): Migrate y seed.
- [ADR-0094](../decisions/0094-dokploy-applications-are-the-deployment-lifecycle-unit.md): topología histórica de Dokploy.
