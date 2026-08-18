# planb

Instrumento de presión estudiantil sobre las universidades argentinas: convierte lo que los alumnos saben por haberlo vivido (hoy disperso en grupos y pasillos) en datos agregados que aguantan una discusión. Dos ejes por cursada que nunca se mezclan (exigencia y gestión), publicados como frases con la proporción de voces que las sostiene y no como puntajes; la atribución la decide el eje (lo exigente es la carrera siendo dura, lo mal gestionado es alguien fallando); testimonio por frases curadas; lectura sin cuenta. Proyecto Final de la Tecnicatura Universitaria en Desarrollo y Calidad de Software (UNSTA).

La tesis completa, que gobierna todo lo demás: [`docs/THESIS.md`](docs/THESIS.md). **El código de este repo contiene además la versión anterior del producto (el planificador de cuatrimestre) en retiro**: el viraje está registrado en [ADR-0063](docs/decisions/0063-the-product-is-a-pressure-instrument.md) y la poda se planifica en [`docs/STATUS.md`](docs/STATUS.md).

Detalle del dominio: [`docs/domain/ubiquitous-language.md`](docs/domain/ubiquitous-language.md).

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

## Stack

| Capa | Tecnología |
|---|---|
| Backend | .NET 10 + ASP.NET Core (modular monolith) |
| Messaging | Wolverine (mediator + outbox durable) |
| Endpoints | Carter |
| Data | EF Core 10 (writes) + Dapper (reads complejos) |
| DB | PostgreSQL 17 (la imagen trae pgvector, pero la extensión está sin uso: ver revisión de [ADR-0007](docs/decisions/0007-pgvector-implementado-ui-gated-off.md)) |
| Cache / ephemeral state | Redis 7 (refresh tokens, rate limiting, hot reads, idempotency). Ver [ADR-0034](docs/decisions/0034-redis-como-cache-y-ephemeral-state.md) |
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
│   ├── modules/             6 bounded contexts
│   │   ├── identity/        User, StudentProfile, TeacherProfile
│   │   ├── academic/        University, Career, Subject, Teacher, Commission
│   │   ├── enrollments/     EnrollmentRecord, HistorialImport
│   │   ├── reviews/         Review, TeacherResponse
│   │   ├── moderation/      ReviewReport, ReviewAuditLog
│   │   └── planning/        SimulationDraft (versión anterior, en retiro: ADR-0063)
│   └── tests/Planb.IntegrationTests/
├── frontend/                Next.js 15 App Router
│   └── src/{app,features,components,lib}/
├── docs/
│   ├── decisions/           ADRs (MADR), fuente de verdad de decisiones
│   ├── domain/              Ubiquitous language, casos de uso, lifecycles
│   ├── architecture/        ERD, data model
│   ├── testing/             Convenciones cross-stack de testing (ADR-0036)
│   └── operations/          Playbooks operacionales (rollback, ...)
├── scripts/                 TS scripts (bun): no usar bash
├── Justfile                 Task runner (todas las operaciones comunes)
├── lefthook.yml             Git hooks
└── docker-compose.yml       Postgres + Redis + Mailpit
```

## Reglas cross-cutting

- **Código en inglés** (clases, métodos, tablas, rutas, identificadores). **Comentarios y docstrings en español rioplatense** (así razona el equipo; el código no). **UI en español rioplatense**. Error messages internos en inglés.
- **Conventional Commits** enforceado por lefthook commit-msg (`bun scripts/check-commit-msg.ts`). Formato: `type(scope): descripción`. Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert. Los commits alimentan `CHANGELOG.md` automáticamente vía un workflow GHA que appendea bullets a `[Unreleased]` en cada merge a main ([ADR-0037](docs/decisions/0037-changelog-automation-auto-append.md)). **No editar `CHANGELOG.md` a mano.**
- **Versioning**: pre-deploy no hay versiones ni releases. Tags narrativos manuales (`presentacion-fase-2-...`) permitidos para hitos. Política completa en [ADR-0038](docs/decisions/0038-release-and-versioning-policy.md); revisar cuando aterrice primer deploy.
- **No pusheos directos a `main`**. Flow PRs-only. Branches `type/scope-description` (ej. `feat/identity-register`, `fix/moderation-threshold`). **Sin US numbers en el branch name** (las US van en commit body o PR body). Merge strategy: **Rebase and merge** por default, **Squash and merge** si el PR tiene commits WIP, **nunca "Create a merge commit"** en esta fase. Ver [ADR-0026](docs/decisions/0026-git-workflow-github-flow-con-rebase.md) (decisión) y [`docs/operations/git-workflow.md`](docs/operations/git-workflow.md) (bitácora operacional con anti-patterns).
- **Decisiones con alternativas reales → ADR** en `docs/decisions/NNNN-titulo.md`. Ver [`docs/decisions/README.md`](docs/decisions/README.md) para criterios.
- **Gestión del proyecto (US / epics / sprints)**: **el tracker es el repo**: [`docs/STATUS.md`](docs/STATUS.md) (sprints, foco, estado), [`docs/domain/user-stories.md`](docs/domain/user-stories.md) (el catálogo) y una ficha `US-NNN.md` por story en sprint, con su `Status` en el header. Notion se dejó de usar el 2026-08-18: no se sincroniza, no se crean pages, y lo que quedó ahí es historia. **Al mergear un PR, el que mergea actualiza el `Status` de la ficha y STATUS.md en el mismo PR.** Lecciones operativas en [`docs/operations/lessons-learned.md`](docs/operations/lessons-learned.md).
- **Persistence ignorance** ([ADR-0017](docs/decisions/0017-persistence-ignorance.md)): el dominio no sabe ni le importa dónde se persisten los datos. No FKs cross-schema, no EF navigation cross-module.
- **Scripts en TypeScript** (`bun`), no en bash. Consistencia.
- **No referenciar paths locales, proyectos privados externos, ni secrets en código/docs.**

## Comandos frecuentes

```
just setup           # Primera vez: .env + infra + deps + hooks
just dev             # Backend + frontend en paralelo (requiere bash)
just dev-backend     # Solo backend
just dev-frontend    # Solo frontend
just test            # Todos los tests
just lint            # Biome + dotnet format check
just lint-fix        # Autofix
just migrate         # Aplicar migraciones EF Core pendientes
just infra-up        # Levantar Postgres + Redis + Mailpit (auto-detecta podman/docker)
just infra-reset     # Volar volúmenes y rearmar
just ci              # Las mismas gates que corre GitHub Actions
```

## Documentación

Las cosas críticas para entender el sistema antes de programar:

1. [`docs/THESIS.md`](docs/THESIS.md). La tesis del producto: qué es, qué no hace, la posición tomada. Todo lo demás se lee contra esto.
2. [`docs/domain/ubiquitous-language.md`](docs/domain/ubiquitous-language.md). Glosario de términos del dominio. Antes de inventar un nombre, chequear acá.
3. [`docs/architecture/data-model.md`](docs/architecture/data-model.md). ERD consolidado por bounded context.
4. [`docs/decisions/`](docs/decisions). ADRs (MADR) del proyecto. Antes de decidir algo estructural, buscar si ya hay un ADR relevante.
5. [`docs/testing/conventions.md`](docs/testing/conventions.md). Qué test escribir para qué cambio, dónde vive, cómo correrlo. Pirámide formal en [ADR-0036](docs/decisions/0036-testing-pyramid-cross-stack.md).
6. [`docs/operations/rollback.md`](docs/operations/rollback.md). Qué hacer cuando algo entra a main y rompe. Política "revert first, investigate after" + comandos exactos para code, DB schema y tags narrativos.
7. [`docs/operations/git-workflow.md`](docs/operations/git-workflow.md). Reglas duras de commit, branching, conflict y merge. TL;DR table + anti-patterns observados. Complementa ADR-0026.
8. [`docs/design/design-system.md`](docs/design/design-system.md). Contrato visual del producto (paleta, tipografía, tokens y su mapping al frontend). Antes de tocar visuales, chequear acá. Qué se construye lo dicen las user stories y las personas ([`docs/domain/user-stories.md`](docs/domain/user-stories.md), [`docs/domain/user-personas.md`](docs/domain/user-personas.md)); el mapa mid-fi ([`docs/design/map/`](docs/design/map/README.md)) es orientativo sobre vistas y flujos, no un contrato de UX/UI. Las capturas del canvas de la versión anterior están congeladas como historia.
9. [`docs/STATUS.md`](docs/STATUS.md). Tracker operativo por sprints (cadencia, foco y estado de cada uno) + las convenciones del sistema de US: numeración `US-NNN[-x]` (sufijos `-b/-f/-i/-t`), la US como incremento de valor, y el parent (`US-NNN`) que se reemplaza por subdivisiones al entrar a sprint. Catálogo en [`docs/domain/user-stories.md`](docs/domain/user-stories.md), epics en [`docs/domain/epics.md`](docs/domain/epics.md), plantilla en [`docs/domain/us-template.md`](docs/domain/us-template.md), Definition of Done en [`docs/domain/definition-of-done.md`](docs/domain/definition-of-done.md).

Detalle por capa: [`backend/CLAUDE.md`](backend/CLAUDE.md) y [`frontend/CLAUDE.md`](frontend/CLAUDE.md).

## Boundaries

- **No** commitear `.env`, secrets, `.claude/`, archivos de IDE.
- **No** pushear directo a `main`. Siempre via PR.
- **No** introducir referencias a paths absolutos locales o a proyectos privados externos.
- **No** hacer `git push --force` a `main` salvo que sea explícitamente pedido.
- **No** hacer merge de PR sin que pase CI.
