# ADR-0092: Containers run least-privilege and the image chain is pinned and gated

- **Estado**: aceptado
- **Fecha**: 2026-09-08
- **Revisado**: 2026-09-12

## Contexto

Las imágenes propias ya ejecutan API y web con usuarios no root. Faltaba hacer explícitos el resto del límite de privilegios, la identidad inmutable de las imágenes y el gate de vulnerabilidades. La topología anterior expresaba esos controles en dos archivos Compose de deploy; [ADR-0094](0094-dokploy-applications-are-the-deployment-lifecycle-unit.md) mueve el ciclo de vida a recursos nativos de Dokploy, así que el control debe vivir en cada Application y en el pipeline.

También apareció una corrección necesaria: Mailpit no funciona con el filesystem entero en solo lectura sin un área temporal escribible. En el stage real cayó al intentar escribir en `/tmp`. La afirmación anterior de que no necesitaba excepción era falsa.

## Decisión

### Imágenes propias

- API, web y migrate corren sin root.
- Las Applications dropean todas las capacidades Linux y no agregan ninguna salvo una necesidad observada y documentada.
- El filesystem es de solo lectura. Cada path legítimamente escribible se habilita de forma puntual con volumen o `tmpfs`.
- Cada Application tiene límites explícitos de CPU, memoria y procesos acordes al host y se vuelve a medir cuando cambia la carga o la imagen.
- Migrate usa exactamente la misma imagen inmutable que API, con el comando `migrate-db`.

### Mailpit

Mailpit existe solo en stage. Su Application necesita `/tmp` escribible mediante `tmpfs` o, si Dokploy no permite esa excepción para la Application, `read-only` desactivado. No se documenta ni se acepta como válida una configuración enteramente read-only sin `/tmp` escribible.

### Databases

PostgreSQL y Redis se ejecutan como recursos Database de Dokploy, no como contenedores definidos por el repo. Sus usuarios, volúmenes, límites, backups y capacidades se configuran y verifican en esos recursos. Este ADR no atribuye a las Databases controles que todavía no se hayan comprobado en el panel y en el runtime.

### Cadena de imágenes

- Las imágenes base de los Dockerfiles y las imágenes de terceros desplegadas directamente se fijan por digest, conservando el tag legible cuando corresponda.
- Las imágenes propias desplegadas se identifican por SHA. Nunca se usan `main` ni `latest`.
- Dependabot observa los directorios que declaran imágenes base para que un pin no quede congelado sin actualización.
- Trivy informa vulnerabilidades HIGH y CRITICAL y bloquea la publicación o el deploy ante CRITICAL según el gate vigente del pipeline.
- `docker-compose.yml` queda fuera de la política de deploy: es infraestructura local descartable y puede conservar tags legibles sin digest.

## Verificación y estado

**Verificado antes de esta revisión:** las imágenes propias construyen y corren como usuarios no root; los Dockerfiles usan imágenes base pineadas; Dependabot cubre sus directorios; el pipeline produce reportes de escaneo y tiene gate para CRITICAL. Las pruebas locales previas también confirmaron capacidades nulas y filesystem read-only para API, web y migrate bajo la topología Compose retirada.

**Verificado en el stage real:** Mailpit cayó al escribir en `/tmp` con filesystem read-only. Por eso su excepción de escritura es parte de la decisión, no una posibilidad teórica.

**Decidido y no verificado en esta pieza:** la configuración equivalente de capacidades, límites y filesystem en las nuevas Applications de Dokploy. El cutover debe comprobarla Application por Application. Producción todavía no existe.

## Alternativas consideradas

**Confiar solo en el usuario no root de la imagen.** Reduce privilegios, pero deja capacidades, escritura y consumo de recursos sin límite explícito. Descartada.

**Filesystem escribible para todas las Applications.** Evita configurar excepciones, pero amplía la superficie modificable ante una intrusión. Descartada para API, web y migrate. Mailpit conserva solo la excepción necesaria para `/tmp`, o read-only off si el runtime no permite el `tmpfs` puntual.

**Tags móviles para simplificar el redeploy.** Un mismo tag podría resolver a bytes distintos y el rollback dejaría de identificar un artefacto. Descartada.

**Pinear imágenes sin automatizar su renovación.** Convierte el pin en deuda silenciosa. Descartada: todo pin debe tener un mecanismo que proponga su actualización.

**Bloquear también por HIGH.** Haría rojo el pipeline por hallazgos que requieren evaluación y entrenaría a ignorar el gate. Descartada mientras HIGH permanezca visible y CRITICAL corte.

## Consecuencias

- Recrear una Application exige volver a aplicar y verificar sus límites y privilegios, además de actualizar su hostname generado.
- Una nueva escritura legítima se resuelve con el path mínimo escribible. Mailpit ya tiene una excepción conocida en `/tmp`.
- Los controles de PostgreSQL y Redis dejan de estar versionados en Compose y pasan a necesitar evidencia operativa del recurso Dokploy.
- Un rollback de aplicación vuelve a un SHA conocido; no depende de que un tag móvil conserve su significado.

## Refs

- [ADR-0089](0089-the-stage-follows-main-and-production-is-promoted-from-a-release.md): promoción por SHA y Release.
- [ADR-0094](0094-dokploy-applications-are-the-deployment-lifecycle-unit.md): Applications y Databases de Dokploy.
- [`backend/Dockerfile`](../../backend/Dockerfile), [`frontend/Dockerfile`](../../frontend/Dockerfile), [`.dockerignore`](../../.dockerignore), [`.github/dependabot.yml`](../../.github/dependabot.yml), [`.github/workflows/publish-images.yml`](../../.github/workflows/publish-images.yml).
- [`docs/engineering/deploy.md`](../engineering/deploy.md) y [`docs/engineering/runbook.md`](../engineering/runbook.md).
