# ADR-0037: Changelog automation con auto-append on merge

- **Estado**: aceptado
- **Fecha**: 2026-04-30

## Contexto

Tres hechos:

1. `CHANGELOG.md` existe en raíz, format Keep-a-Changelog, con una entrada `[Unreleased]` que tiene bullets manuales escritos en formato narrativo (resumen de Sprint 0 / Fase 1 / Fase 2).
2. **No hay automatización**. Ni hook de Lefthook, ni step en CI, ni nada. Cada autor tiene que recordar editar el changelog en su PR. Nadie lo recuerda. La sección `[Unreleased]` está desactualizada respecto a los commits de las últimas 3 semanas.
3. **Conventional Commits sí está enforceado** (Lefthook commit-msg via `bun scripts/check-commit-msg.ts`, [ADR-0026](0026-git-workflow-github-flow-con-rebase.md)). Cada commit ya carga la información necesaria para generar un bullet de changelog (`type`, `scope`, `description`, opcional `BREAKING CHANGE`).

El gap es: tenemos el input estructurado (Conventional Commits) pero no la pipa que lo convierta en changelog. El costo de no tenerlo crece con cada sprint.

[ADR-0036](0036-testing-pyramid-cross-stack.md) introduce además un PR template con checklist obligatorio. Sumar al checklist "actualizá el CHANGELOG" sería una decisión coherente pero subóptima: aumenta fricción del developer y depende de memoria humana. Mejor automatizar.

## Decisión

**Workflow GHA `changelog.yml` que en cada push a `main` parsea el commit más reciente y appendea un bullet a la sección `[Unreleased]` del `CHANGELOG.md`**. La lógica vive en un script TypeScript ejecutado por Bun (`scripts/append-changelog.ts`), siguiendo la regla cross-cutting de "scripts en TS, no bash" ([ADR-0024](0024-dev-tooling-stack.md)).

Cómo funciona:

1. Push a `main` (típicamente post-merge de un PR) dispara el workflow.
2. El script:
   a. Lee el último commit (`HEAD`) y parsea su mensaje como Conventional Commit. Mismo regex que `scripts/check-commit-msg.ts`.
   b. Mapea el tipo a una sección de Keep-a-Changelog: `feat`/`perf` → "Added"; `fix` → "Fixed"; `refactor` → "Changed"; `revert` → "Removed"; `docs`/`style`/`test`/`build`/`ci`/`chore` → no entra al CHANGELOG (auto-skip).
   c. Construye el bullet: `- <descripción> (<scope>) — <short-sha>` con link al commit.
   d. Lo inserta en la sección `[Unreleased]` debajo del subheader correspondiente, creando el subheader si no existe.
   e. Si el commit incluye `BREAKING CHANGE:` en el body o `!:` en el header, agrega un sub-bullet "(BREAKING)".
3. El workflow commitea el cambio con mensaje `docs(changelog): auto-update from <sha>`. El commit lo hace un bot (`stefanzweifel/git-auto-commit-action@v5` o equivalente) que NO dispara otros workflows (evita loops).
4. Squash/Rebase irrelevante: el script lee el commit que ya quedó en `main`. Si la merge fue Squash y el título del PR estaba mal, el bullet sale mal — mitigación en el `pr-title.yml` que valida PR titles como Conventional Commits.

### Lo que NO hace este ADR

- **No bumpea versión**. Pre-MVP no necesitamos versionar. No hay `package.json` con version field público que importe, no hay deploys, no hay usuarios externos esperando releases.
- **No crea tags ni GitHub Releases**. Si en algún momento queremos cortar un snapshot ("esto es lo que mostramos al docente al final del sprint"), eso se hace manual (`git tag` + nota), no requiere automatización ahora.
- **No regenera el CHANGELOG entero**. Sólo apendea el último commit. La idea es estado incremental, no rebuild completo. Si alguna vez el archivo se desfasa, lo regenerás manualmente con `git log` y commiteás la corrección.

### Versioning policy

Definida en [ADR-0038](0038-release-and-versioning-policy.md) como decisión separada (porque "cómo se mantiene el changelog" y "cuándo cortás versión" son preguntas ortogonales que merecen ADRs propias). Resumen relevante para esta ADR:

- Pre-deploy: no hay versiones, no hay releases, no hay tags-as-releases. `CHANGELOG.md` mantiene una sola sección `[Unreleased]` que crece sin cortes.
- Trigger para abrir la decisión de versioning: primer deploy a un entorno con URL accesible.
- Tags narrativos manuales (presentaciones, hitos) están permitidos pre-deploy y conviven con esta automatización sin interferir (no entran al CHANGELOG, no hacen nada de versión).

## Alternativas consideradas

### A. Manual con guardrail (PR template + reviewer check)

Costo: 5 min de setup.

Contras:
- Olvidable. La mitad de los PRs no van a editar `CHANGELOG.md`. El reviewer también puede no chequearlo.
- Conflicts merge: cada PR que toca `[Unreleased]` mete una línea en la misma posición. Conflicts triviales pero ruidosos.

Descartada — todo lo malo del proceso manual sin upside.

### B. Lefthook commit-msg gate ("si el commit es feat/fix, debe tocar CHANGELOG.md")

Costo: 30 min.

Contras:
- Sigue siendo manual: el dev escribe el bullet a mano, sólo que el hook le pega si se olvida.
- No funciona con Squash and merge (el commit que falla es el local pre-squash, no el de main).
- El bullet escrito por el dev puede ser distinto del título del commit, generando ruido.

Descartada — fricción local sin solucionar el problema real.

### C. CI gate (job de GHA que falla si el PR no toca CHANGELOG.md)

Costo: 30 min.

Igual que B pero en CI. Mismas contras. Descartada.

### D. release-please (Google)

Considerada y descartada. release-please hace **CHANGELOG + version bump + git tag + GitHub Release** como bundle indivisible. Para un repo pre-MVP sin deploys, los tres últimos son ruido visual: cada push a main abre/actualiza un release PR que no tiene función real hasta que se mergea.

Cuando aterrice la decisión de versioning (ver "Versioning policy: deferred" arriba), release-please vuelve a ser candidato natural y se reevaluará en esa ADR. Hoy no.

### E. changesets (npm-style: cada PR agrega un `.md` describing the change)

Considerada y descartada. Pensado para monorepos npm con múltiples packages publicables. planb no publica nada. Overkill + fricción manual extra.

### F. La decisión elegida (auto-append)

Pros:
- Reusa el contrato Conventional Commits que ya enforceamos.
- Cero fricción para el developer: escribe un buen commit msg (lo que ya hace) y el changelog se mantiene solo.
- No introduce el concepto de "release" antes de que lo necesitemos.
- Script TS (~50 líneas) en `scripts/`, igual que el resto de tooling del repo. Mantenible por nosotros sin depender de un vendor.

Contras:
- Squash and merge requiere disciplina con el título del PR (mismo problema que tendrían B, C, D, F). Mitigado con `pr-title.yml` que valida PR titles como CC.
- Si alguien escribe un Conventional Commit con tipo equivocado (e.g. `chore:` para algo que es feature), el changelog lo refleja mal. Esto vale para cualquier solución basada en CC.
- El CHANGELOG va a crecer indefinidamente bajo `[Unreleased]` hasta que decidamos versionar. Aceptable a corto plazo; cuando sea molesto, eso es un trigger para abrir la ADR de versioning.

## Consecuencias

### Positivas

- `CHANGELOG.md` se mantiene actualizado sin esfuerzo manual.
- El developer no piensa en changelog: piensa en escribir un buen Conventional Commit message (lo que ya hace).
- No introducimos versioning antes de necesitarlo.

### Negativas

- Una pieza más de infra para entender. Mitigación: doc breve en `docs/testing/conventions.md`.
- El bot que commitea el changelog usa la identidad de GitHub Actions (`github-actions[bot]`). Los commits aparecen como tales en `git log`, lo cual contamina ligeramente la historia. Aceptable.
- Si el script tiene un bug y commitea un changelog malformado, hay que arreglarlo a mano + push. Mitigación: el script tiene tests (cuando aterrice, US-T05).

## Implementación

US-T05-i cubre:

- `.github/workflows/changelog.yml` — trigger push:main, ejecuta el script, commitea el cambio.
- `scripts/append-changelog.ts` — lógica de parseo + insert.
- `.github/workflows/pr-title.yml` — valida PR titles como Conventional Commit, red de seguridad para Squash and merge.
- Updates en `docs/testing/conventions.md`, `CLAUDE.md` (root) y `.github/pull_request_template.md` para reflejar el flujo.

## Refs

- [ADR-0024](0024-dev-tooling-stack.md): tooling stack base + scripts en TS.
- [ADR-0026](0026-git-workflow-github-flow-con-rebase.md): git workflow + Conventional Commits.
- [ADR-0036](0036-testing-pyramid-cross-stack.md): testing pyramid (companion).
- [ADR-0038](0038-release-and-versioning-policy.md): release & versioning policy (companion).
- Conventional Commits spec: https://www.conventionalcommits.org/
- Keep a Changelog: https://keepachangelog.com/en/1.1.0/
