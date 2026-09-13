# Runbook de stage y deploy

Qué mirar y qué hacer cuando el stage no actualiza o un recurso de Dokploy falla. El armado y el cutover están en [`deploy.md`](deploy.md); la política de reversión, en [`rollback.md`](rollback.md).

## Estado conocido

- Stage se define como ambiente persistente con perfil Production y datos persistentes.
- La topología decidida usa PostgreSQL y Redis Databases, más API, web, Migrate y Mailpit Applications.
- Migrate es una Application run-once: Swarm Mode Replicated con 1 réplica y Restart Policy `none`; su task corre una vez por deploy y no se reinicia.
- Producción todavía no existe.
- El cutover completo a Applications no fue verificado en esta pieza.
- En Dokploy v0.26.3 se verificó que el prefijo `planb-stage-api` generó `appName` `planb-stage-api-7mmcdb`. El sufijo es mutable y ese valor no se usa como convención estable.
- Se verificó por incidente que Mailpit necesita `/tmp` escribible.
- Se verificó por incidente que un redeploy de una Database con el default `start-first` de Dokploy corre dos PostgreSQL sobre el mismo volumen (caso 8): las Databases llevan `stop-first`.

## Fuentes de verdad

1. **GitHub Actions:** la corrida del commit muestra si publicó imágenes, si la task de Migrate terminó con exit 0, si desplegó API y web y si pasó health. Un cambio solo de docs debe figurar como omitido, no como deploy.
2. **`/health`:** devuelve el estado de API, PostgreSQL y Redis y el SHA servido. Una imagen publicada no está desplegada hasta que ese SHA aparece.
3. **Dokploy Applications:** Deployment y Logs de Migrate, API, web y Mailpit. Se busca por el prefijo humano, pero se opera el recurso por su id y `appName` reales.
4. **Dokploy Databases:** estado, endpoint, almacenamiento y backups de PostgreSQL y Redis.
5. **Variables no sensibles:** ids de Applications y hostnames internos generados que usa el workflow. Si un recurso se recrea, se actualizan antes de desplegar.

## Casos

### 1. El merge terminó y stage no cambió

**Síntoma:** `/health` sirve el SHA anterior o la corrida terminó en rojo.

**Diagnóstico:**

1. Confirmar que el cambio no sea exclusivamente documental. En ese caso no debe existir deploy.
2. Revisar si falló publicación o escaneo. Si fue así, Dokploy no debería haber sido tocado.
3. Revisar Migrate. `applicationStatus=done` solo confirma el deployment de Dokploy; si la task nueva del job no termina en `exited` con `ExitCode` 0 (`docker.getConfig`), API y web no deben desplegarse. En el panel, los logs de esa ejecución terminan en `Wolverine: listo.` cuando salió bien.
4. Si Migrate terminó bien, revisar el deploy y health de API y web.
5. Confirmar que los ids de Applications y hostnames internos guardados sigan coincidiendo con los recursos actuales.

**Acción:** corregir la causa con un PR y relanzar la corrida permitida. No ejecutar `seed-db` para destrabar un deploy.

**Señal:** el workflow rojo es la señal mínima de stage. Cuatro fallas consecutivas ya quedaron ocultas una vez detrás de una versión vieja que seguía respondiendo, así que no se da por sano un deploy porque la URL contesta.

### 2. Migrate falla

**Síntoma:** la task de Migrate sale con código distinto de 0 o no termina, y API/web no reciben el SHA nuevo.

**Diagnóstico:** abrir los logs de la Application cuyo prefijo es `planb-stage-migrate`. Confirmar:

- imagen API con el SHA esperado;
- Command `dotnet Planb.Api.dll migrate-db`;
- Replicated 1 y Restart Policy `none`;
- endpoints y credenciales de PostgreSQL y Redis;
- error exacto de EF Core o Wolverine.

**Acción:** no ejecutar la migración desde API ni convertir Migrate en servicio de larga vida. Preparar una migración correctiva y volver a desplegar Migrate. El default de schema es roll-forward, no `Down()` sobre un ambiente persistente.

### 3. Migrate termina, pero API o web no quedan sanos

**Síntoma:** Migrate completó y `/health` da 502, 503 o un SHA distinto; web no sirve la ruta pública.

**Diagnóstico:**

- API: revisar configuración Production, conexiones, JWT, SMTP, tipos pregenerados y health check.
- Web: revisar que la imagen sea la específica de stage y que `NEXT_PUBLIC_API_URL` haya sido horneada con el hostname interno real de API.
- Ambos: comparar el SHA configurado en Dokploy con el SHA de la corrida.

**Acción:** si el arreglo no es inmediato, volver API y web al último SHA sano según [`rollback.md`](rollback.md). No retroceder schema por default.

### 4. Una Application fue recreada

**Síntoma:** la Application existe, pero web no llega a API, API no llega a Mailpit o Actions recibe not found al desplegar.

**Diagnóstico:** comparar id, `appName` y hostname interno actuales con las variables no sensibles de GitHub y Dokploy. El prefijo solicitado no alcanza: Dokploy agrega un sufijo aleatorio.

**Acción:**

1. Actualizar el id de la Application donde lo consume Actions.
2. Actualizar el hostname interno real en GitHub y Dokploy.
3. Si se recreó API, reconstruir web porque `NEXT_PUBLIC_API_URL` queda horneada.
4. Si se recreó Mailpit, actualizar el host SMTP de API.
5. Desplegar y repetir health y flujo de correo.

No copiar `planb-stage-api-7mmcdb` como si fuera patrón. Es evidencia de una instancia, no DNS contractual.

### 5. Mailpit cae con `Read-only file system`

**Síntoma:** la Application de Mailpit no queda sana y sus logs muestran una escritura fallida en `/tmp`.

**Diagnóstico:** revisar si `/tmp` es escribible. El stage real ya confirmó que la imagen lo necesita.

**Acción:** configurar `/tmp` como `tmpfs`. Si Dokploy no permite ese mount puntual en la Application, desactivar read-only solo para Mailpit y volver a desplegar. No afirmar que quedó endurecido hasta verificar arranque, health y recepción de un mail.

### 6. Ejecutar `seed-db` a mano

**Cuándo:** una persona decide cargar o actualizar los datos del stage. No se usa para reparar un deploy.

**Antes:**

1. Confirmar visualmente que el destino es stage.
2. Registrar el SHA de la imagen API que se va a ejecutar.
3. Hacer backup si hay datos que importan.
4. Recordar que la idempotencia es por ids y puede chocar con claves naturales.

**Acción:** ejecutar `seed-db` una vez con la misma imagen inmutable de API, dentro de la red del destino y contra los endpoints reales. Revisar el exit code y los logs. No crear una Application de seed de larga vida y no agregarla al workflow.

**Si falla:** conservar el error. No resetear automáticamente. La aplicación sigue desplegada porque seed no es parte de su health.

### 7. Reset destructivo de stage

**Autorización:** un reset requiere una decisión explícita. No se infiere de un seed fallido, un deploy fallido ni un cutover exitoso.

**Acción:**

1. Confirmar nombre, id y ambiente de la PostgreSQL Database. Tiene que ser stage.
2. Hacer un backup y guardar su ubicación antes de borrar datos.
3. Detener o bloquear escrituras.
4. Vaciar o recrear la Database desde Dokploy.
5. Si cambió el endpoint, actualizar API y Migrate.
6. Ejecutar Migrate y esperar una finalización exitosa.
7. Desplegar API y web y verificar `/health`.
8. Ejecutar `seed-db` solo si una persona decide cargar el corpus.

No hay comando Compose de reset: los Compose de stage y producción fueron retirados del repo.

### 8. PostgreSQL perdió o corrompió datos

**Síntoma:** faltan filas, hay corrupción confirmada o la Database no puede recuperar su estado.

**Acción:** detener escrituras y seguir la restauración de [`rollback.md`](rollback.md). Un bug de código o una migración incompatible sin pérdida de datos no autoriza restore: se corrige por roll-forward.

**Causa conocida:** un redeploy de la Database con el Update Config default de Dokploy (`start-first`) arranca la instancia nueva mientras la vieja sigue viva sobre el mismo volumen; la nueva hace recovery sobre un clúster en uso, la vieja pisa `postmaster.pid` y el control file al apagarse, y lo escrito en el medio se pierde o queda inconsistente. Toda Database lleva `{"Parallelism": 1, "Order": "stop-first"}`, y un redeploy nunca se dispara mientras Migrate o `seed-db` están escribiendo.

### 9. Certificado o dominio falla

**Síntoma:** TLS vencido, DNS inválido o tráfico apuntando al recurso viejo.

**Diagnóstico:** comparar DNS público y dominio de Dokploy con la Application nueva. Durante el cutover, confirmar que no se retiró el recurso anterior antes de validar el nuevo.

**Acción:** corregir DNS o el dominio en Dokploy, verificar desde afuera y mantener el recurso anterior hasta que el cambio esté sano. No borrar el Compose viejo como parte automática del cutover.

### 10. Dokploy o el host se queda sin recursos

**Síntoma:** deploys que no inician, tareas rechazadas, OOM o falta de espacio.

**Diagnóstico:** revisar Monitoring del host y los límites de cada Application y Database. En Dokploy, memoria se expresa en bytes y CPU en nanoCPUs.

**Acción:** liberar solo recursos no usados y ajustar límites con evidencia. No desactivar globalmente los controles de [ADR-0092](../decisions/0092-containers-run-least-privilege-and-the-image-chain-is-pinned-and-gated.md).

## Configuración sensible y no sensible

### GitHub

**Secretos:** origen y API key de Dokploy, más cualquier credencial necesaria para el registry.

**Variables no sensibles:** ids de Applications, health URL y hostname interno real de API para el build web. Se actualizan si un recurso se recrea.

### Dokploy

**Secretos:** credenciales de PostgreSQL y Redis, JWT, credenciales SMTP y cualquier autenticación de Mailpit.

**Variables no sensibles:** `ASPNETCORE_ENVIRONMENT`, bases de links, hostnames internos generados y configuración de health.

Ningún valor sensible vive en el repo ni en este documento.

## Producción

Producción todavía no existe. Antes de crearla deben estar resueltos y probados:

- backups externos de PostgreSQL;
- retención definida;
- restore ensayado;
- notificación activa de deploy fallido;
- artefactos web específicos por destino sin colisión de identidad.

## Refs

- [`deploy.md`](deploy.md): recursos, configuración y cutover.
- [`rollback.md`](rollback.md): SHA rollback, roll-forward de schema y restore.
- [ADR-0089](../decisions/0089-the-stage-follows-main-and-production-is-promoted-from-a-release.md): promoción.
- [ADR-0092](../decisions/0092-containers-run-least-privilege-and-the-image-chain-is-pinned-and-gated.md): hardening.
- [ADR-0093](../decisions/0093-the-deploy-migrates-the-schema-and-never-seeds-data.md): Migrate y seed.
- [ADR-0094](../decisions/0094-dokploy-applications-are-the-deployment-lifecycle-unit.md): recursos nativos de Dokploy.
- [Dokploy, Applications, Advanced, Mode](https://docs.dokploy.com/docs/core/applications/advanced).
