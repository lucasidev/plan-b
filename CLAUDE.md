# planb

Instrumento de presión estudiantil sobre las universidades argentinas: convierte lo que los alumnos saben por haberlo vivido (hoy disperso en grupos y pasillos) en datos agregados que aguantan una discusión. Solo se reseña la cursada, en tres capas (contexto que no se publica, conducta observable de la cátedra en frecuencias gruesas, vivencia en primera persona); la ficha publica conteos con sus voces y nunca un puntaje (la moda literal, la distribución por opción, lo que converge entre ítems, y la comparación solo contra las cátedras hermanas); el campo libre no se publica y alimenta la curaduría; los datos oficiales van con su fuente al lado de las voces; lectura sin cuenta. Proyecto Final de la Tecnicatura Universitaria en Desarrollo y Calidad de Software (UNSTA).

La tesis completa, que gobierna todo lo demás: [`docs/THESIS.md`](docs/THESIS.md). **El código de este repo contiene además la versión anterior del producto (el planificador de cuatrimestre) en retiro**: el viraje está registrado en [ADR-0063](docs/decisions/0063-the-product-is-a-pressure-instrument.md) y la poda se planifica en [`docs/plan/status.md`](docs/plan/status.md).

Detalle del dominio: [`docs/product/language.md`](docs/product/language.md).

## Cultura de ingeniería

Cómo pensamos y decidimos en este proyecto. No son procesos a cumplir: son lentes para tomar mejores decisiones. Todos los defaults se anulan con razonamiento explícito, nunca por dogma.

**Pragmatismo (gobierna todo): las reglas son defaults fuertes, no mandamientos.** DDD, clean architecture, el outbox, Metz, el algoritmo de Musk, y estos mismos mindsets son sugerencias ponderadas por contexto. Se anulan argumentando, nunca por vibra ni por dogma, ni el de construir ni el de borrar.

**El orden de Musk: no optimices lo que no debería existir.** El error más caro de un ingeniero es optimizar o automatizar algo que no debería existir. La secuencia va en un solo sentido: (1) cuestionar el requisito, (2) borrar la parte o el proceso (si después no devolvés ~10% de lo que borraste, no borraste suficiente), (3) simplificar lo que sobrevive, (4) acelerar el ciclo, (5) automatizar. Antes de hacer algo más rápido o automático, preguntá si debería existir. Saltar a 3-5 sobre algo que había que cuestionar o borrar (1-2) es el error que más caro sale.

### Los mindsets

1. **Cuestionar el requisito.** Todo lo que construís desciende de un requisito: trazalo a una persona, una suposición y un resultado de negocio (cliente, plata, objetivo). Si no traza a eso, o se justifica o se va. Los requisitos de gente inteligente son los más peligrosos porque nadie los cuestiona.
2. **Quitar la paja.** Remové lo que está por mal planteamiento, decisión caducada o patrón aplicado porque sí. El discriminador no es tamaño ni minimalismo: son **procedencia** (por qué está) y **encaje** (sirve hoy). Removés el artefacto de un error, no lo que simplemente es "de más". Las decisiones caducan: re-evaluá.
3. **Romperlo a propósito.** Frente a tu propia arquitectura, sos revisor hostil buscando la falla fatal, con evidencia, no defensa. Antes de mergear un diseño, un pase activo intentando romperlo; concedé solo lo que sobrevive el asalto.
4. **El código es la verdad.** Los docs mienten. Citá código real (`file:line`), no memoria ni documentación. Validá contra el contrato o el código real antes de afirmar. Si no lo miraste, no lo sabés.
5. **Abstracción just-in-time (duplicar es más barato que la abstracción equivocada).** No extraigas una abstracción compartida hasta que la duplicación pruebe su forma con consumidores reales. Un bloque nace compartido cuando el **segundo consumidor real** lo necesita, a la altura donde es invariante; lo específico de cada vertical se compone en el producto. Composición sobre herencia, nunca un `if (vertical)`. (Conway: las fronteras siguen al equipo y a los consumidores reales, no al organigrama.)
6. **Sustancia sobre ceremonia.** Los hooks señalan, no bloquean. Se documentan decisiones con alternativas reales, no cada tweak. El CLAUDE.md espeja el código, no lo duplica. Todo artefacto se gana su lugar; si es ceremonia que driftea, se borra.
7. **Sin azúcar.** Corregir directo, con contraejemplo del código. La meta es software de calidad, no comodidad. Si está mal, se dice, con evidencia. Aplica también a corregirte a vos mismo.
8. **La reversibilidad calibra el rigor.** Puerta de dos vías (reversible barato): decidí rápido, sin ceremonia. Puerta de una vía (cara de revertir): ahí gastás el #1 y el #3 a fondo. Aplicar escepticismo uniforme a todo es su propia paja.
9. **Acortá el lazo.** El juicio a-priori es falible; la forma más rápida de saber si algo es paja es shippear chico y mirar. Ante incertidumbre que el debate no cierra, construí el experimento más chico que te da la señal. Y antes de arrancar, escribí cómo vas a saber que está bien (test, repro, output esperado): un criterio de éxito verificable, y looped hasta cumplirlo.
10. **Calibra la confianza.** La falla más cara entre humano y agente es la afirmación confiada que en realidad es una suposición. Toda afirmación carga su nivel: verificado / supuesto / no sé. El "no sé" es información, no debilidad.
11. **YAGNI.** No construyas para un futuro hipotético (ancla nombrada del instinto que comparten #1, #2 y #5). Si la única justificación es "lo vamos a necesitar", no va hasta que lo necesites de verdad.
12. **Cambios quirúrgicos.** El diff hace lo que se pidió y nada más: no "mejores" código, comentarios ni formato adyacente de pasada. Remové solo la paja que tu propio cambio creó; el dead code preexistente que no tocaste no se borra como daño colateral (removerlo es tarea consciente, #2, no un side-effect). Antes de agregar tooling o "arreglar" algo, verificá que el problema sea real y que no exista ya una defensa (chequeá el código, no la memoria).

**Nota final:** estos mindsets son ellos mismos defaults, no mandamientos. Si en un caso concreto uno no aplica, lo anulás con una razón explícita. El único pecado es seguir o romper una regla por dogma en vez de por juicio.

## Reparto del trabajo

El contexto principal orquesta: decide, especifica, verifica lo entregado y reporta. Construir y correr suites es de los agentes de [`.claude/agents/`](.claude/agents), cada uno con su modelo fijado en el frontmatter, y dos hooks de [`.claude/hooks/`](.claude/hooks) lo hacen cumplir: `guard-main-context` en el contexto principal (dentro de un subagente no interviene) y `guard-agent-tier` en cualquier contexto.

| Trabajo | Quién | El hook |
|---|---|---|
| Investigar: dónde está X, todos los usos de Y, un inventario | `scout` (haiku). Un archivo que ya sabés cuál es se lee directo | |
| Construir desde un spec (qué, dónde, contrato, criterio de éxito) | `implementer` (sonnet). En el contexto principal solo cambios quirúrgicos | Cuenta las escrituras de código por sesión (`backend/`, `frontend/src/`, `frontend/e2e/`, `scripts/`, también por heredoc o `sed`): avisa en cada una desde la 8 y bloquea a las 20 |
| Correr suites: `dotnet test`, Playwright, vitest, `just test`, `just ci` | `test-runner` (haiku): devuelve verde/rojo y las fallas | Bloquea esos comandos en el contexto principal |
| Revisar un diff no trivial antes del commit | `reviewer` (opus) | |
| Lanzar un subagente | Un agente del proyecto, con el modelo de su frontmatter; un built-in (`Explore`, `claude-code-guide`) solo con `model` haiku o sonnet | Bloquea `general-purpose`, `fork`, sin tipo, un built-in sin modelo barato, y un `model` que pise el frontmatter |

Escape por sesión, decisión del usuario: `PLANB_GUARD_OFF=1`; topes con `PLANB_GUARD_EDIT_NUDGE` y `PLANB_GUARD_EDIT_DENY`. Estos hooks bloquean a propósito, contra el default de que un hook señala ([ADR-0088](docs/decisions/0088-the-main-context-orchestrates-and-two-hooks-enforce-it.md)): la regla como texto falló dos veces y el costo es una sesión que se compacta a mitad de tarea en el tier más caro.

## Stack

| Capa | Tecnología |
|---|---|
| Backend | .NET 10 + ASP.NET Core (modular monolith) |
| Messaging | Wolverine (mediator + outbox durable) |
| Endpoints | Carter |
| Data | EF Core 10 (writes) + Dapper (reads complejos) |
| DB | PostgreSQL 17 (la imagen trae pgvector, pero la extensión está sin uso: ver revisión de [ADR-0007](docs/decisions/0007-pgvector-deferred-until-there-is-a-real-consumer.md)) |
| Cache / ephemeral state | Redis 7 (refresh tokens, rate limiting, hot reads, idempotency). Ver [ADR-0034](docs/decisions/0034-redis-as-cache-and-ephemeral-state.md) |
| Frontend | Next.js 15 App Router + React 19.1 |
| Data fetching | TanStack Query v5 con RSC prefetch + HydrationBoundary |
| Forms | React 19 primitives + TanStack Form |
| UI | shadcn/ui + Tailwind CSS 4 + lucide-react |
| Tooling | Justfile, Lefthook, Bun, Biome, Docker/Podman, Dokploy |

## Estructura del repo

```
plan-b/
├── backend/                 Modular monolith (.NET 10)
│   ├── libs/shared-kernel/  Result<T>, Error, abstractions
│   ├── host/Planb.Api/      Program.cs, DI, endpoints compose
│   ├── modules/             3 bounded contexts
│   │   ├── identity/        User, StudentProfile, TeacherProfile
│   │   ├── academic/        University, Career, Subject, Teacher, Chair, Commission
│   │   └── reviews/         Instrument, Item, Review
│   └── tests/Planb.IntegrationTests/
├── frontend/                Next.js 15 App Router
│   └── src/{app,features,components,lib}/
├── docs/                    Cinco carpetas, una pregunta cada una (ADR-0070)
│   ├── THESIS.md            ¿qué es y qué no hace? La tesis gobierna todo lo demás
│   ├── product/             ¿qué hace y para quién? Leído como recorridos (ADR-0077):
│   │                        student/, reviewed/ y team/, cada uno con sus tramos (las épicas)
│   │                        y cada tramo con TODO lo suyo adentro: sus stories (una carpeta
│   │                        cada una: letra + escenarios), su flujo y sus pantallas. Al nivel
│   │                        producto: guarantees/ (valen en toda pantalla) y notices/ (canal)
│   ├── engineering/         ¿cómo está construido? ERD, Redis, testing, git, rollback, deploy
│   ├── decisions/           ¿por qué? ADRs (MADR), en orden cronológico
│   ├── plan/                ¿cuándo? Los sprints con el trabajo de cada story, y el DoD
│   └── history/             ¿qué fue? El ático de la versión anterior, sin editar
├── scripts/                 TS scripts (bun): no usar bash. Con su lint y su typecheck
├── Justfile                 Task runner (todas las operaciones comunes)
├── biome.json               Lint/format de scripts/ (el del frontend vive en frontend/)
├── lefthook.yml             Git hooks
└── docker-compose.yml       Postgres + Redis + Mailpit
```

## Reglas cross-cutting

- **Código en inglés** (clases, métodos, tablas, rutas, identificadores). **Comentarios y docstrings en español rioplatense** (así razona el equipo; el código no). **UI en español rioplatense**. Error messages internos en inglés.
- **Un término se usa, no se inventa.** Antes de nombrar cualquier cosa (en UI, en comentarios, en docs, en el chat), buscarla en [`docs/product/language.md`](docs/product/language.md). Si ya tiene nombre, ese es el nombre y no hay segundo. Un sinónimo nuevo para algo que ya se llama de una forma es un bug: obliga a todo el que lee a preguntarse si son dos cosas distintas. Si el concepto no está en el glosario y hace falta, se agrega ahí primero.
- **"Por qué" no es palabrerío.** Un comentario dice el invariante, el tradeoff o la razón por la que la línea existe, en una o dos frases. No defiende la decisión, no explica lo que la cosa *no* es, no narra cómo se llegó (eso va al commit body y al ADR) ni presenta conceptos que no están en el glosario. En docs la vara es más dura: **una definición define y cierra**. Va la conclusión, no el camino. Si hace falta prohibir o contrastar un término, va en la sección que existe para eso (la tabla **Desambiguación** de `language.md`), en una línea, no inflando la definición.
- **Conventional Commits** enforceado por lefthook commit-msg (`bun scripts/check-commit-msg.ts`). Formato: `type(scope): descripción`. Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert. **El subject va en inglés y el body en español** ([git-workflow.md](docs/engineering/git-workflow.md)), y el mismo script lo bloquea si el subject lee como español. El `CHANGELOG.md` está congelado y **no se edita a mano**: se genera de una pasada, desde los propios commits, el día que haya quien lo lea ([ADR-0074](docs/decisions/0074-the-changelog-is-generated-on-demand-not-appended-on-every-push.md)).
- **Versioning**: pre-deploy no hay versiones ni releases. Tags narrativos manuales (`presentacion-fase-2-...`) permitidos para hitos. Política completa en [ADR-0038](docs/decisions/0038-release-and-versioning-policy.md); revisar cuando aterrice primer deploy.
- **No pusheos directos a `main`**. Flow PRs-only. Branches `type/scope-description` (ej. `feat/identity-register`, `fix/reviews-publishing-floor`). **Sin US numbers en el branch name** (las US van en commit body o PR body). Merge strategy: **Rebase and merge** por default, **Squash and merge** si el PR tiene commits WIP, **nunca "Create a merge commit"** en esta fase. Ver [ADR-0026](docs/decisions/0026-git-workflow-github-flow-with-rebase.md) (decisión) y [`docs/engineering/git-workflow.md`](docs/engineering/git-workflow.md) (bitácora operacional con anti-patterns).
- **Decisiones con alternativas reales → ADR** en `docs/decisions/NNNN-title-in-english.md` (título y filename en inglés, cuerpo en español; lo chequea `check-docs`). Ver [`docs/decisions/README.md`](docs/decisions/README.md) para criterios.
- **Gestión del proyecto**: **la story vive en su épica** (`docs/product/<journey>/<epic>/stories/US-NNN-slug/`, una carpeta con su letra y sus escenarios), con su criterio de aceptación y sin estado de gestión. El tracker es [`docs/plan/status.md`](docs/plan/status.md), que la **cita por ID** y le agrega el sprint, las tareas y el contrato técnico ([ADR-0072](docs/decisions/0072-the-story-lives-in-its-epic-and-the-plan-only-references-it.md)). **El ID no cambia nunca y no lleva semántica**: la story no se parte por razones de ejecución, se parte el trabajo. Formato y reglas en [`docs/plan/story-template.md`](docs/plan/story-template.md). Notion se dejó de usar el 2026-08-18: no se sincroniza, no se crean pages, y lo que quedó ahí es historia. **Al mergear un PR, el que mergea actualiza el estado de la story en `status.md`, en el mismo PR.** Lecciones operativas en [`docs/engineering/lessons-learned.md`](docs/engineering/lessons-learned.md).
- **Persistence ignorance** ([ADR-0017](docs/decisions/0017-persistence-ignorance.md)): el dominio no sabe ni le importa dónde se persisten los datos. No FKs cross-schema, no EF navigation cross-module.
- **Scripts en TypeScript** (`bun`), no en bash: es lo que los hace correr igual en Windows, donde el shell del Justfile es pwsh y `rm -rf` no existe. Pasan por biome y `tsc` como el resto del código (`just scripts-lint`, `just scripts-typecheck`).
- **No referenciar paths locales, proyectos privados externos, ni secrets en código/docs.**

## Comandos frecuentes

```
just setup           # Primera vez: .env + infra + deps + hooks
just dev             # Backend + frontend en paralelo (requiere bash)
just dev-backend     # Solo backend
just dev-frontend    # Solo frontend
just test            # Todos los tests
just lint            # Biome (frontend + scripts) + dotnet format check
just lint-fix        # Autofix
just migrate         # Aplicar migraciones EF Core pendientes
just infra-up        # Levantar Postgres + Redis + Mailpit (auto-detecta podman/docker)
just infra-reset     # Volar volúmenes y rearmar
just ci              # Las mismas gates que CI, menos E2E (necesita el stack: just frontend-test-e2e)
```

## Documentación

Las cosas críticas para entender el sistema antes de programar:

1. [`docs/THESIS.md`](docs/THESIS.md). La tesis del producto: qué es, qué no hace, la posición tomada. Todo lo demás se lee contra esto.
2. [`docs/product/language.md`](docs/product/language.md). Glosario de términos del dominio. Antes de inventar un nombre, chequear acá.
3. [`docs/engineering/data-model.md`](docs/engineering/data-model.md). ERD consolidado por bounded context.
4. [`docs/decisions/`](docs/decisions). ADRs (MADR) del proyecto. Antes de decidir algo estructural, buscar si ya hay un ADR relevante.
5. [`docs/engineering/testing.md`](docs/engineering/testing.md). Qué test escribir para qué cambio, dónde vive, cómo correrlo. Pirámide formal en [ADR-0036](docs/decisions/0036-testing-pyramid-cross-stack.md).
6. [`docs/engineering/rollback.md`](docs/engineering/rollback.md). Qué hacer cuando algo entra a main y rompe. Política "revert first, investigate after" + comandos exactos para code, DB schema y tags narrativos.
7. [`docs/engineering/git-workflow.md`](docs/engineering/git-workflow.md). Reglas duras de commit, branching, conflict y merge. TL;DR table + anti-patterns observados. Complementa ADR-0026.
8. [`docs/product/design-system.md`](docs/product/design-system.md). Contrato visual del producto (paleta, tipografía, tokens y su mapping al frontend). Antes de tocar visuales, chequear acá. Qué se construye lo dicen las stories y las personas, que viven juntos en [`docs/product/`](docs/product/README.md): la letra de cada story en su épica, las [personas](docs/product/personas.md) y el índice de las pantallas en [`docs/product/README.md`](docs/product/README.md). Los canvas y el mapa del que salió todo están congelados en [`docs/history/`](docs/history).
9. [`docs/plan/status.md`](docs/plan/status.md). Tracker operativo por sprints: cadencia, foco, qué entró y qué quedó, y el trabajo de cada story planificada. El formato de una story y las reglas de su ID están en [`docs/plan/story-template.md`](docs/plan/story-template.md); el Definition of Done, en [`docs/plan/definition-of-done.md`](docs/plan/definition-of-done.md).

Detalle por capa: [`backend/CLAUDE.md`](backend/CLAUDE.md) y [`frontend/CLAUDE.md`](frontend/CLAUDE.md).

## Boundaries

- **No** commitear `.env`, secrets, archivos de IDE, ni `.claude/` salvo lo compartido que `.gitignore` deja pasar (agents, hooks, rules, skills, workflows y `settings.json`).
- **No** pushear directo a `main`. Siempre via PR.
- **No** introducir referencias a paths absolutos locales o a proyectos privados externos.
- **No** hacer `git push --force` a `main` salvo que sea explícitamente pedido.
- **No** hacer merge de PR sin que pase CI.
