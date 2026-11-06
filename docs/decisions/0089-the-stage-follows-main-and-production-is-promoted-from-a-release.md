# ADR-0089: The stage follows main and production is promoted from a release

- **Estado**: aceptado
- **Fecha**: 2026-09-06
- **Revisado**: 2026-11-06

## Contexto

El primer stage se desplegaba como un servicio Compose de Dokploy y consumía tags móviles. Ese mecanismo dejó dos fuentes de deriva: `main` podía avanzar sin que el stage cambiara, y un reinicio podía traer bytes distintos bajo el mismo tag. Además, usar ramas largas para representar ambientes mezclaría promoción con desarrollo.

La decisión central sigue vigente: el stage muestra lo que llegó a `main` y producción representa una promoción deliberada. La topología anterior de [ADR-0094](0094-dokploy-applications-are-the-deployment-lifecycle-unit.md) fue migrada a Services de Coolify con Compose propio. El contrato vigente está en [deploy.md](../engineering/deploy.md).

## Decisión

**El stage persistente sigue a `main`; producción persistente se promueve desde un Release de GitHub. No hay rama `development` ni rama de release.**

Los ambientes son:

| Ambiente | Vida | Fuente |
|---|---|---|
| Development local | Descartable | El checkout local y [`docker-compose.yml`](../../docker-compose.yml), solo para infraestructura de desarrollo. |
| Preview de PR | Opcional y efímera | El commit del PR. No es una rama ni un ambiente persistente. |
| Stage | Persistente | Cada merge a `main` que cambia algo desplegable. |
| Production | Persistente | El commit señalado por un GitHub Release. Producción todavía no existe. |

Cada imagen desplegable se referencia por el digest del build, asociado a un tag derivado del SHA. Web agrega el destino al tag. `main` y `latest` no se publican ni se consumen como tags de deploy.

Para stage, GitHub Actions construye y publica las imágenes del SHA, pero no toca Coolify hasta que la corrida de CI de ese mismo SHA y el escaneo de las imágenes terminan verdes. Después ejecuta primero Migrate y exige el marcador único de esa corrida con código 0 y estado `exited`. Recién entonces actualiza API y web por digest, con stop previo, y exige health más el SHA exacto en `/health` y una ruta pública con HTTP 200. Una corrida que solo cambia documentación no construye ni despliega. Los límites de los estados cacheados de Coolify están documentados en deploy.md.

Para producción, un GitHub Release dispara la misma secuencia contra recursos propios de producción. Hasta que producción exista, no se afirma que esa promoción esté operativa.

El frontend sigue siendo específico del destino mientras `NEXT_PUBLIC_API_URL` se hornee durante el build. Stage y producción usan tags separados por destino y digests del build, cada uno con la URL interna real de su API. La configuración productiva debe validarse antes de su primer deploy.

El UUID del recurso Coolify, el nombre Compose y el alias interno son identidades distintas. La migración conservó los nombres y aliases previos. Se guardan como datos no sensibles en GitHub y se actualizan si un recurso se recrea. No se deriva DNS interno desde el nombre humano del recurso.

## Alternativas consideradas

**Seguir desplegando a mano.** El primer stage quedó atrás de `main` a los dos días. Descartada: la promoción manual no daba una señal confiable de qué commit se estaba viendo.

**Autodeploy de Dokploy sobre el repositorio.** Puede dispararse antes de que las imágenes del commit estén publicadas y no expresa el orden migración, API, web y health. Descartada.

**Una rama por ambiente.** Duplica estados y obliga a merges entre ramas para representar una promoción que ya puede identificar un SHA o un Release. Descartada.

**Tags móviles `main` o `latest`.** Hacen que un restart pueda cambiar los bytes sin una decisión de deploy y vuelven ambiguo el rollback. Descartada.

**Versionar cada merge a `main`.** Confunde la actualización continua del stage con una promoción a producción. Descartada: una versión nace cuando existe un Release y un destino productivo.

## Consecuencias

- El SHA servido por `/health` y los digests configurados en cada Service identifican la versión desplegada dentro de los límites observables de la API.
- Migrate usa exactamente la misma referencia inmutable que API y su éxito es un gate del deploy, no del arranque del proceso web.
- Publicar y escanear imágenes no autoriza el deploy: el SHA también tiene que haber pasado CI.
- El pipeline necesita UUID y nombres Compose de cada Service, y la URL interna de API. Son variables no sensibles, pero pueden cambiar al recrear un recurso. Una producción sin configurar falla antes de publicar o mutar recursos.
- El workflow rojo es la señal mínima de un deploy fallido en stage. Una notificación activa de ese rojo es requisito previo a producción.
- Los tags narrativos sin prefijo `v` siguen permitidos como hitos. No son Releases ni disparan producción.
- El primer Release usa SemVer. Mientras la versión sea `0.x`, `feat` sube MINOR, `fix` y `perf` suben PATCH, `BREAKING CHANGE` sube MINOR y los demás tipos no cambian la versión.

## Refs

- [ADR-0026](0026-git-workflow-github-flow-with-rebase.md): flujo Git y Conventional Commits.
- [ADR-0074](0074-the-changelog-is-generated-on-demand-not-appended-on-every-push.md): el changelog se genera para un Release.
- [ADR-0093](0093-the-deploy-migrates-the-schema-and-never-seeds-data.md): migrar es parte del deploy y sembrar no.
- [ADR-0094](0094-dokploy-applications-are-the-deployment-lifecycle-unit.md): topología histórica de Dokploy.
- [`docs/engineering/deploy.md`](../engineering/deploy.md) y [`docs/engineering/rollback.md`](../engineering/rollback.md).
