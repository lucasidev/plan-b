# ADR-0074: El changelog se genera cuando hay quien lo lea, no se appendea en cada push

- **Estado**: aceptado
- **Fecha**: 2026-08-21
- **Supersede**: [ADR-0037](0037-changelog-automation-auto-append.md)

## Contexto

[ADR-0037](0037-changelog-automation-auto-append.md) montó un workflow que, en cada push a `main`, appendea los commits del rango a la sección `[Unreleased]` de `CHANGELOG.md`. Funcionó como se diseñó. La pregunta que nunca se hizo es si hacía falta.

Lo que hay hoy, medido:

- **206 bullets, cada uno con el subject de un commit y un link al commit.** Es el `git log` con formato markdown.
- **Una sola sección, `[Unreleased]`, desde el primer día.** Nunca se cortó una versión, porque [ADR-0038](0038-release-and-versioning-policy.md) fija que pre-deploy no hay versiones ni releases.
- **584 commits en `main`** y ningún usuario: el producto no se deployó.

Y lo que cuesta:

- **Una GitHub App propia** (`planb-ci-bot`) con bypass del ruleset de `main`, que existe únicamente porque este workflow necesita pushear a una rama protegida y GitHub no permite darle ese bypass a la app de Actions en repos personales.
- **Un `[skip ci]`** en el mensaje del commit para no re-disparar CI sobre un cambio docs-only.
- **Dos bugs en su primer live run**, documentados en [lessons-learned](../engineering/lessons-learned.md) (skipeaba commits que no debía; el skip-tag matcheaba en prosa).
- **Un script de 14 KB con su suite de tests** para mantener.

La especificación que el proyecto dice seguir condena exactamente este patrón. [Keep a Changelog](https://keepachangelog.com/en/1.1.0/): *"Using commit log diffs as changelogs is a bad idea: they're full of noise"*, y el tagline de su repo es *"Don't let your friends dump git logs into changelogs"*. [Common Changelog](https://common-changelog.org/) es más duro: *"Don't take the easy way out with full automation. This results in poor changelogs, defeating their purpose"*.

Y funda la necesidad del changelog en algo que acá todavía no existe: **un lector distinto del que escribió el commit**. *"To make it easier for users and contributors to see precisely what notable changes have been made between each release."* Hoy no hay usuarios ni releases, y el único que puede leer `[Unreleased]` es quien escribe los commits.

## Decisión

**La automatización se retira. El changelog se genera de una sola pasada el día que haya quien lo lea.**

1. **Se apagan `changelog.yml` y `scripts/append-changelog.ts`** con su suite de tests. `CHANGELOG.md` queda en el repo, congelado tal como está: es historia real de cuatro meses de trabajo y no se borra.
2. **El changelog se genera bajo demanda** con [`git-cliff`](https://git-cliff.org/), que parsea Conventional Commits (ya enforceado por [ADR-0026](0026-git-workflow-github-flow-con-rebase.md)) y arma el archivo completo desde el historial entero en una pasada. No hay estado incremental que mantener ni CI que se rompa.
3. **El disparador es el mismo que ya fijó [ADR-0038](0038-release-and-versioning-policy.md)**: el primer deploy. Antes de eso, si hace falta un snapshot (una entrega, una presentación), se genera con el mismo comando.
4. **La regla de no editarlo a mano sigue**, y ahora por una razón más simple: no se edita porque se genera.

**Lo que no cambia**: la política de versionado de [ADR-0038](0038-release-and-versioning-policy.md) queda intacta (pre-deploy no hay versiones, ni tags semver, ni releases). Esto reabre cómo se produce el changelog, no cuándo se versiona.

## Alternativas consideradas

**A. Dejarlo como está.** Es la opción por defecto y la que se descarta: mantiene infraestructura (una GitHub App, un script con tests, un workflow) para producir un artefacto que la propia spec que seguimos llama ruido, dirigido a un lector que no existe. Si el día del primer deploy hay que curar igual esos 206 bullets para que sirvan, la automatización no ahorró el trabajo: lo postergó y encima cobró mantenimiento mientras tanto.

**B. Anotar a mano desde ahora, por PR** ([towncrier](https://towncrier.readthedocs.io/en/stable/), [changesets](https://github.com/changesets/changesets)). Es el mejor argumento en contra de esta decisión, y es real: capturar por qué importa un cambio en el momento del PR es más preciso que reconstruirlo meses después. Se descarta por ahora porque agrega un paso manual a cada PR de un repo de una persona, para un lector que todavía no existe. **Es la alternativa a la que hay que volver cuando el producto tenga usuarios**: ahí el changelog deja de poder generarse solo, porque lo que un usuario necesita leer no está en el commit.

**C. `semantic-release`.** Automatiza versión, changelog y publish en cada merge. Asume release continuo, que es exactamente lo que ADR-0038 dice que este proyecto no hace todavía. Descartada.

**D. Borrar `CHANGELOG.md`.** Tentador por simetría, pero esos 206 bullets son el registro de cuatro meses y linkean a sus commits. No molesta a nadie estando quieto. Descartada.

## Consecuencias

- **La GitHub App `planb-ci-bot` se queda**: verificado que `dependabot-bun-lockfile.yml` la usa con el mismo secreto (`LOCKFILE_BOT_APP_ID`). Lo que se retira es un consumidor, no la App.
- **`CHANGELOG.md` deja de moverse.** Los scripts que reescriben paths en masa ya no lo van a pisar, que fue un problema real: dos veces en un mismo día un pase de mantenimiento le reescribió una línea histórica, falsificando qué path había tocado un commit viejo.
- **Un commit a `main` deja de generar un segundo commit del bot**, y el historial de `main` queda más limpio.
- **`git-cliff` no está instalado**: se agrega cuando se lo necesite, no ahora. Instalar una herramienta para no usarla sería el mismo error en versión más chica.
- **US-T05-i queda sin objeto** (los tests de la automatización): vive en el ático con las demás fichas de la versión anterior.

## Refs

- [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/) y su [repo](https://github.com/olivierlacan/keep-a-changelog); [Common Changelog](https://common-changelog.org/); [git-cliff](https://git-cliff.org/); [changesets](https://github.com/changesets/changesets) y [towncrier](https://towncrier.readthedocs.io/en/stable/) como el camino cuando haya usuarios.
- [ADR-0037](0037-changelog-automation-auto-append.md) (lo que esto supersede), [ADR-0038](0038-release-and-versioning-policy.md) (la política de versionado, intacta), [ADR-0026](0026-git-workflow-github-flow-con-rebase.md) (Conventional Commits, que es lo que hace posible generar después).
