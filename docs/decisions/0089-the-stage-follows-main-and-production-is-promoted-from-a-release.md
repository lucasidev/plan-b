# ADR-0089: The stage follows main and production is promoted from a release

- **Estado**: aceptado
- **Fecha**: 2026-09-06
- **Revisado**: 2026-09-12

## Contexto

El primer stage se desplegaba como un servicio Compose de Dokploy y consumía tags móviles. Ese mecanismo dejó dos fuentes de deriva: `main` podía avanzar sin que el stage cambiara, y un reinicio podía traer bytes distintos bajo el mismo tag. Además, usar ramas largas para representar ambientes mezclaría promoción con desarrollo.

La decisión central sigue vigente: el stage muestra lo que llegó a `main` y producción representa una promoción deliberada. La topología y la identidad de las imágenes cambian por [ADR-0094](0094-dokploy-applications-are-the-deployment-lifecycle-unit.md).

## Decisión

**El stage persistente sigue a `main`; producción persistente se promueve desde un Release de GitHub. No hay rama `development` ni rama de release.**

Los ambientes son:

| Ambiente | Vida | Fuente |
|---|---|---|
| Development local | Descartable | El checkout local y [`docker-compose.yml`](../../docker-compose.yml), solo para infraestructura de desarrollo. |
| Preview de PR | Opcional y efímera | El commit del PR. No es una rama ni un ambiente persistente. |
| Stage | Persistente | Cada merge a `main` que cambia algo desplegable. |
| Production | Persistente | El commit señalado por un GitHub Release. Producción todavía no existe. |

Cada imagen desplegable se referencia por un tag derivado del SHA inmutable. `main` y `latest` no se publican ni se consumen como tags de deploy.

Para stage, GitHub Actions construye y publica las imágenes del SHA, pero no toca Dokploy hasta que la corrida de CI de ese mismo SHA termina verde. Después ejecuta primero la Application de migración como one-shot y espera su éxito. Recién entonces despliega API y web, exige tasks nuevas y sanas y verifica `/health` más una ruta pública. Una corrida que solo cambia documentación no construye ni despliega.

Para producción, un GitHub Release dispara la misma secuencia contra recursos propios de producción. Hasta que producción exista, no se afirma que esa promoción esté operativa.

El frontend sigue siendo específico del destino mientras `NEXT_PUBLIC_API_URL` se hornee durante el build. Stage y producción requieren builds web separados, cada uno con el hostname interno real de su API. Ese costo y el riesgo de colisión entre artefactos del mismo commit deben resolverse en el workflow antes del primer deploy a producción. No se reemplaza esa identidad con tags móviles.

Los nombres ingresados al crear Applications son prefijos humanos. Dokploy v0.26.3 agrega un sufijo aleatorio al `appName`, que es el hostname interno efectivo. El hostname generado se guarda como dato no sensible en GitHub y en el Environment de Dokploy, y se actualiza en ambos lugares si la Application se recrea. No se deriva DNS interno desde el prefijo.

## Alternativas consideradas

**Seguir desplegando a mano.** El primer stage quedó atrás de `main` a los dos días. Descartada: la promoción manual no daba una señal confiable de qué commit se estaba viendo.

**Autodeploy de Dokploy sobre el repositorio.** Puede dispararse antes de que las imágenes del commit estén publicadas y no expresa el orden migración, API, web y health. Descartada.

**Una rama por ambiente.** Duplica estados y obliga a merges entre ramas para representar una promoción que ya puede identificar un SHA o un Release. Descartada.

**Tags móviles `main` o `latest`.** Hacen que un restart pueda cambiar los bytes sin una decisión de deploy y vuelven ambiguo el rollback. Descartada.

**Versionar cada merge a `main`.** Confunde la actualización continua del stage con una promoción a producción. Descartada: una versión nace cuando existe un Release y un destino productivo.

## Consecuencias

- El SHA servido por `/health` y el SHA configurado en cada Application son la fuente de verdad de una versión desplegada.
- La Application de migración usa la misma imagen inmutable que la API y su éxito es un gate del deploy, no del arranque del proceso web.
- Publicar y escanear imágenes no autoriza el deploy: el SHA también tiene que haber pasado CI.
- El pipeline necesita los identificadores de las Applications y los hostnames internos generados por Dokploy. Los hostnames son variables no sensibles, pero mutables al recrear un recurso.
- El workflow rojo es la señal mínima de un deploy fallido en stage. Una notificación activa de ese rojo es requisito previo a producción.
- Los tags narrativos sin prefijo `v` siguen permitidos como hitos. No son Releases ni disparan producción.
- El primer Release usa SemVer. Mientras la versión sea `0.x`, `feat` sube MINOR, `fix` y `perf` suben PATCH, `BREAKING CHANGE` sube MINOR y los demás tipos no cambian la versión.

## Refs

- [ADR-0026](0026-git-workflow-github-flow-with-rebase.md): flujo Git y Conventional Commits.
- [ADR-0074](0074-the-changelog-is-generated-on-demand-not-appended-on-every-push.md): el changelog se genera para un Release.
- [ADR-0093](0093-the-deploy-migrates-the-schema-and-never-seeds-data.md): migrar es parte del deploy y sembrar no.
- [ADR-0094](0094-dokploy-applications-are-the-deployment-lifecycle-unit.md): recursos y unidad de ciclo de vida en Dokploy.
- [`docs/engineering/deploy.md`](../engineering/deploy.md) y [`docs/engineering/rollback.md`](../engineering/rollback.md).
