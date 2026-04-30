# ADR-0038: Release & versioning policy

- **Estado**: aceptado
- **Fecha**: 2026-04-30

## Contexto

[ADR-0037](0037-changelog-automation-auto-append.md) decide cómo se mantiene `CHANGELOG.md` (auto-append en cada merge a main). Lo que ese ADR no decide, y este sí, es **cuándo cortás versión, cuándo taggeás, qué se considera un release**.

Sin esta política la automatización del changelog flota en el aire: el reviewer no sabe si "BREAKING CHANGE" en un PR debería bumpear algo, el dev no sabe si etiquetar un commit como hito, vos no sabés cuándo es momento de "cortar la versión".

planb está en Fase 2 (post-Sprint 0), sin deploy ni clientes externos. La audiencia actual es **vos + el docente Elio Copas** (proyecto final UNSTA). No hay un usuario que dependa de "qué versión está corriendo" porque no está corriendo en ningún lado público.

## Decisión

La política se divide en tres etapas, con triggers explícitos para pasar de una a la siguiente.

### Etapa 1 — Pre-deploy (estamos acá)

**No hay releases, no hay versiones, no hay tags-as-releases.**

| Concepto | Política |
|---|---|
| Versioning | No existe. El repo no tiene número de versión. |
| Releases | No existen. El concepto no aplica todavía. |
| Tags como release | No se hacen. |
| `CHANGELOG.md` | Una sola sección `[Unreleased]` que crece con cada merge a main vía auto-append (ADR-0037). |
| GitHub Releases | No se crean. La pestaña "Releases" del repo queda vacía. |
| Tags como hito narrativo | **Permitidos**. Manuales. Sin formato fijo. Sirven para marcar puntos importantes del proyecto: presentaciones a docente, demos, refactor pre-points. Ver "Tags como hito" abajo. |

### Etapa 2 — Trigger fires → abrir nueva ADR

**Trigger** (lo primero que ocurra):

- (a) **Primer deploy a un entorno con URL accesible**. Cuando aterrice Dokploy en Fase 6, deploy a un staging o prod URL.
- (b) **Pedido externo de "qué versión están corriendo"**. Improbable pre-deploy, pero queda registrado por las dudas.

**Output esperado al disparar el trigger**:

Una ADR nueva (`0039` o donde corresponda) que decida lo concreto:

1. **Esquema de versioning**: el valor por defecto recomendado es **semver** (`MAJOR.MINOR.PATCH`). La ADR puede confirmar o cambiar a calver/otro si hay razón.
2. **Cadencia de releases**: por deploy, por sprint, por milestone, on-demand. La ADR decide.
3. **Tooling**: `release-please`, manual, otra. La ADR decide.
4. **Migración del `[Unreleased]` actual**: cómo se corta `0.1.0` (o lo que sea). Si los bullets acumulados se mueven, se reescriben, o queda como sección histórica.
5. **Tag policy** post-cutoff: cuáles son releases (= con tag y bump de versión) vs cuáles son hitos narrativos (= solo tag, sin bump).

**Mientras el trigger no se dispare**, esta ADR-0038 es la única política. No se requieren actualizaciones intermedias.

### Etapa 3 — Post-deploy (futuro)

Definida por la ADR que abra el trigger. No la pre-decidimos acá.

## Tags como hito (etapa 1 y posteriores)

Aplicable en todas las etapas. Un git tag es un puntero a un commit; no implica versioning ni release. Casos de uso autorizados:

| Caso | Ejemplo de tag |
|---|---|
| Presentación a docente / clase | `presentacion-fase-2-2026-05-15` |
| Demo interno | `demo-mvp-preview-2026-07` |
| Pre-refactor (rollback point) | `pre-refactor-academic-bc` |
| Hito narrativo del proyecto final | `review-system-funcional`, `auth-completo` |

**Reglas**:

- **Sin formato fijo**. El nombre debe ser legible, idealmente con fecha si es presentación. Sin prefijo `v` (eso queda reservado para versiones futuras).
- **Manual**. No hay automatización. Un humano decide cuándo y por qué.
- **Pusheable**. `git push origin <tag>` para que aparezca en GitHub. Útil porque la pestaña "Tags" se vuelve la línea de tiempo del proyecto.
- **No entran al CHANGELOG**. El CHANGELOG es una bitácora de commits/PRs, no de hitos del proyecto. Los hitos viven como tags + (opcionalmente) menciones en el README o en una sección "Highlights" de `docs/STATUS.md`.
- **No abren un GitHub Release**. Si quisieras notas adjuntas al hito, escribís un doc en `docs/` y lo linkeás. La pestaña "Releases" del repo se mantiene vacía hasta que cambiemos de etapa.

**No autorizados (anti-patterns)**:

- Tag por cada merge a main. Eso es el modelo release-please, descartado en ADR-0037 por overkill pre-deploy.
- Tag para "yo creo que esto está estable". Sin un evento concreto detrás, el tag no aporta. Es ego, no es marca útil.

## Cuándo se considera "suficiente" para bumpear versión

Pre-deploy: **nunca**. La pregunta no aplica.

Post-deploy: la responde la ADR de la etapa 2. Como guía recomendada para esa ADR futura, asumiendo semver:

- `feat:` → MINOR.
- `fix:` → PATCH.
- `perf:` → PATCH (a menos que sea una arquitectura nueva, ahí MINOR).
- `BREAKING CHANGE:` → MAJOR (post-1.0). Pre-1.0: MINOR (las reglas de "anything goes" pre-major).
- `docs:`, `style:`, `refactor:`, `test:`, `build:`, `ci:`, `chore:` → no bumpean nada.

Pero esto es nota orientativa, no decisión. La ADR de etapa 2 puede confirmar o ajustar.

## Cuándo se taggea (formal, no narrativo)

Pre-deploy: **nunca para releases** (no hay releases). Tags narrativos sí, ad-hoc, sin política.

Post-deploy: lo decide la ADR de etapa 2. Opciones que esa ADR debería evaluar:
- Por release (cada vez que se corta versión).
- Por deploy (cada vez que algo se despliega).
- Por hito (manual, ad-hoc).

## Cuándo es un "release"

Pre-deploy: **nunca**. El concepto de "release" no aplica a un repo sin deploy.

Post-deploy: definición exacta a decidir en la ADR de etapa 2. Tres definiciones posibles:
- Release = lo que está deployado en prod.
- Release = snapshot estable presentable, marcado por tag y CHANGELOG entry.
- Release = cualquier merge a main que entre a la sección de release notes.

Recomendación para esa ADR futura: **release = lo que está deployado en prod, con tag + CHANGELOG cut + GitHub Release page**. Coincide con el sentido natural de "release" (algo se libera al mundo). Pre-prod los entornos tienen tags propios sin pretensiones de release.

## Alternativas consideradas

### A. Definir versioning ahora aunque no haya deploy

Costo: ADR + setup + disciplina.

Contras:
- Sin un consumer que requiera versión, "esto es 0.2.0" no significa nada concreto. Es ritual.
- Genera la decisión de "feature vs fix" en cada PR sin que sirva para nada.
- Cuando aterrice deploy, probablemente queramos cambiar la política (ej. de semver a calver, o cadencia distinta). Mejor decidirlo con datos del momento.

Descartada — premature optimization de proceso.

### B. Tag por cada merge a main (modelo release-please)

Considerado en ADR-0037 y descartado allá. Re-confirmado acá: ruido visual sin valor concreto pre-deploy.

### C. Esta política (la elegida)

Pros:
- Decisión clara para cada etapa: hoy no hay versioning, mañana lo decidimos cuando importe.
- Triggers concretos para no diferir indefinidamente.
- Tags narrativos permitidos para hitos del proyecto, sin confundirlos con releases.

Contras:
- Cuando se dispare el trigger, hay que abrir otra ADR. Mitigación: el trigger es claro y rara vez repetible (primer deploy es uno solo).

## Consecuencias

- **`CHANGELOG.md` queda como bitácora `[Unreleased]` única**. Crece sin cortes hasta etapa 2.
- **Tags narrativos pueden aparecer en `git tag --list`** sin ser releases. La pestaña "Tags" de GitHub se vuelve la línea de tiempo del proyecto, distinta de "Releases" (que queda vacía).
- **El reviewer del PR no necesita pensar en versioning** — la pregunta no aplica todavía.
- **El docente y la presentación final pueden referirse a tags concretos** ("para Fase 2 mostramos `presentacion-fase-2-2026-05-15`") sin necesidad de versión formal.

## Refs

- [ADR-0026](0026-git-workflow-github-flow-con-rebase.md): git workflow + Conventional Commits.
- [ADR-0037](0037-changelog-automation-auto-append.md): changelog automation (companion).
- Semver: https://semver.org/spec/v2.0.0.html
- Calver: https://calver.org/
- Keep a Changelog: https://keepachangelog.com/en/1.1.0/
