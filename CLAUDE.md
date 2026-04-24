# planb

Plataforma web de planificación de cuatrimestre y reseñas crowdsourced de materias y docentes para universidades argentinas. Proyecto Final de la Tecnicatura Universitaria en Desarrollo y Calidad de Software (UNSTA).

Detalle del dominio: [`docs/domain/ubiquitous-language.md`](docs/domain/ubiquitous-language.md).

## Stack

| Capa | Tecnología |
|---|---|
| Backend | .NET 10 + ASP.NET Core (modular monolith) |
| Messaging | Wolverine (mediator + outbox durable) |
| Endpoints | Carter |
| Data | EF Core 10 (writes) + Dapper (reads complejos) |
| DB | PostgreSQL 17 + pgvector |
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
│   ├── modules/             5 bounded contexts
│   │   ├── identity/        User, StudentProfile, TeacherProfile
│   │   ├── academic/        University, Career, Subject, Teacher, Commission
│   │   ├── enrollments/     EnrollmentRecord, HistorialImport
│   │   ├── reviews/         Review, TeacherResponse, ReviewEmbedding
│   │   └── moderation/      ReviewReport, ReviewAuditLog
│   └── tests/Planb.IntegrationTests/
├── frontend/                Next.js 15 App Router
│   └── src/{app,features,components,lib}/
├── docs/
│   ├── decisions/           25 ADRs (MADR) — fuente de verdad de decisiones
│   ├── domain/              Ubiquitous language, casos de uso, lifecycles
│   └── architecture/        ERD, data model
├── scripts/                 TS scripts (bun) — no usar bash
├── Justfile                 Task runner (todas las operaciones comunes)
├── lefthook.yml             Git hooks
└── docker-compose.yml       Postgres (pgvector) + MailHog
```

## Reglas cross-cutting

- **Código en inglés** (clases, métodos, tablas, rutas). **UI en español rioplatense**. Error messages internos en inglés.
- **Conventional Commits** enforceado por lefthook commit-msg (`bun scripts/check-commit-msg.ts`). Formato: `type(scope): descripción`. Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert.
- **No pusheos directos a `main`**. Flow PRs-only. Branches `type/scope-description` (ej. `feat/identity-register`, `fix/moderation-threshold`).
- **Decisiones con alternativas reales → ADR** en `docs/decisions/NNNN-titulo.md`. Ver [`docs/decisions/README.md`](docs/decisions/README.md) para criterios.
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
just infra-up        # Levantar Postgres + MailHog (auto-detecta podman/docker)
just infra-reset     # Volar volúmenes y rearmar
just ci              # Las mismas gates que corre GitHub Actions
```

## Documentación

Las tres cosas críticas para entender el sistema antes de programar:

1. [`docs/domain/ubiquitous-language.md`](docs/domain/ubiquitous-language.md) — glosario de términos del dominio. Antes de inventar un nombre, chequear acá.
2. [`docs/architecture/data-model.md`](docs/architecture/data-model.md) — ERD consolidado por bounded context.
3. [`docs/decisions/`](docs/decisions/) — 25 ADRs. Antes de decidir algo estructural, buscar si ya hay un ADR relevante.

Detalle por capa: [`backend/CLAUDE.md`](backend/CLAUDE.md) y [`frontend/CLAUDE.md`](frontend/CLAUDE.md).

## Boundaries

- **No** commitear `.env`, secrets, `.claude/`, archivos de IDE.
- **No** pushear directo a `main`. Siempre via PR.
- **No** introducir referencias a paths absolutos locales o a proyectos privados externos.
- **No** hacer `git push --force` a `main` salvo que sea explícitamente pedido.
- **No** hacer merge de PR sin que pase CI.
