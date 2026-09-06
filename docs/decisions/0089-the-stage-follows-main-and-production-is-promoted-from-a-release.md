# ADR-0089: The stage follows main and production is promoted from a release

- **Estado**: aceptado
- **Fecha**: 2026-09-06

## Contexto

El stage existe desde el 2026-09-04: un servicio Compose de Dokploy con las imágenes de GHCR. Hasta hoy las imágenes se publicaban a mano (`workflow_dispatch`) y el stage se desplegaba cambiando dos tags en Dokploy. Dos días después del primer deploy, `main` tenía cinco PRs más que el stage, y quien lo abría veía una versión que nadie decidió dejar ahí.

La política de releases vigente (ADR-0038, del 2026-04-30) se escribió para un repo sin deploy y pedía revisarse al primer deploy. Este ADR la reemplaza y consolida lo que de ella sigue vigente.

## Decisión

**El stage sigue a `main`; producción se promueve desde un Release de GitHub. No hay rama de release.**

1. **Cada push a `main` publica las imágenes y redespliega el stage.** El workflow *Publish images* construye `planb-api` y `planb-web` con dos tags: el sha corto (inmutable) y `main` (móvil). Con las dos imágenes publicadas, un último paso le pide a Dokploy por su API que redespliegue el servicio Compose del stage. El compose del stage corre `main` por defecto y vuelve a bajar la imagen en cada deploy (`pull_policy: always`). El Autodeploy de Dokploy queda apagado: dispara con el push, antes de que existan las imágenes.
2. **`main` es lo que el stage muestra, y CI en cada PR es lo que lo protege.** Un merge que rompe el stage es exactamente lo que el stage existe para mostrar: se arregla con un PR o se revierte ([`rollback.md`](../engineering/rollback.md)).
3. **Producción se promueve desde un Release de GitHub** cuando exista su servicio: el tag dispara el mismo workflow con la URL de producción, y ese sha es lo que se apunta, a mano hasta que producción tenga su propio paso. Un Release lleva versión semver (`v0.1.0` el primero) y su changelog generado desde los commits ([ADR-0074](0074-the-changelog-is-generated-on-demand-not-appended-on-every-push.md)); la cadencia es por deploy a producción. Hasta que haya producción no hay Releases ni versiones: la pestaña Releases queda vacía.
4. **La corrida manual del workflow sigue existiendo** para publicar cualquier ref con el tag del sha: una prueba, o una imagen de producción antes de que exista el disparo por Release. No publica `main` ni `latest`: nada consume un `latest`.
5. **Los tags narrativos siguen permitidos para hitos** (una presentación, una demo, un punto de retorno): manuales, pusheables, sin `v`, fuera del changelog y sin Release. `v*` queda reservado a versiones.

Para el primer corte, la versión sale de los commits desde el último Release: `feat` sube MINOR, `fix` y `perf` suben PATCH, `BREAKING CHANGE` sube MINOR mientras la versión sea `0.x`, y el resto no sube nada.

## Alternativas consideradas

**Seguir a mano** (lo decidido en ADR-0038 para el pre-deploy): correr el workflow, anotar el sha, cambiar dos tags, Deploy. Cada paso es corto y la suma dejó el stage viejo desde el segundo día. Descartada.

**Autodeploy de Dokploy sobre el repo.** Dispara en el push, cuando las imágenes todavía no existen: relanzaría el compose con los tags viejos. Descartada.

**Una rama de release aparte de `main`.** Sostiene con merges entre ramas lo mismo que da un tag, y agrega la pregunta de qué va a cada rama. Descartada: `main` es el stage y el tag es producción.

**Versión y tag en cada merge a `main`** (release-please, semantic-release). Asume release continuo a producción. El stage se redespliega en cada merge, pero un Release es una decisión, y hasta que haya producción no hay ninguna que tomar. Descartada.

## Consecuencias

- Tres secrets del repo, cargados a mano y nunca en el código: la URL del panel, una API key de Dokploy y el id del servicio Compose del stage. Sin ellos el workflow publica igual y avisa que no redesplegó.
- [`deploy.md`](../engineering/deploy.md) describe el camino continuo del stage y conserva el manual para pinear un sha.
- `CHANGELOG.md` sigue como una sola sección hasta el primer Release, que se genera de una pasada (ADR-0074).
- El hardening de Production ([ADR-0059](0059-production-startup-does-not-self-repair.md)) queda intacto: producción no se repara sola al arrancar, y por eso su promoción es una decisión y no un merge.

## Refs

- [ADR-0026](0026-git-workflow-github-flow-with-rebase.md): git workflow y Conventional Commits.
- [ADR-0074](0074-the-changelog-is-generated-on-demand-not-appended-on-every-push.md): el changelog se genera cuando hay quien lo lea.
- [ADR-0059](0059-production-startup-does-not-self-repair.md): producción no se repara sola al arrancar.
- [`docs/engineering/deploy.md`](../engineering/deploy.md) y [`docs/engineering/rollback.md`](../engineering/rollback.md).
- Semver: https://semver.org/spec/v2.0.0.html
