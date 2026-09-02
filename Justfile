# planb — task runner
# Detects container runtime (podman preferred, falls back to docker).
# Override with: CONTAINER_CMD=docker just <recipe>

set dotenv-load := true
set windows-shell := ["pwsh", "-NoLogo", "-Command"]

# El runtime del container NO vive en una variable de just: las asignaciones se
# evaluan antes de correr cualquier receta, asi que el chequeo de daemon rompia
# 39 de las 40 recetas cuando el daemon estaba apagado, incluidas las 32 que no
# tocan un container. Ahora cada script que lo necesita lo detecta al correr.
# El override CONTAINER_CMD=docker lo sigue leyendo detect-container.ts.

# Default: list recipes
default:
    @just --list

# ═══════════════════════════════════════════════════════════════
# Setup
# ═══════════════════════════════════════════════════════════════

# First-time setup: generate secrets, start infra, install deps, install hooks
setup: _ensure-env infra-up backend-restore frontend-install lefthook-install
    @echo ""
    @echo "✓ Setup complete. Run 'just dev' to start."

# Create/update .env files with generated secrets (preserves existing)
_ensure-env:
    bun scripts/create-env.ts

# Force regenerate .env files with new secrets (DESTRUCTIVE)
_ensure-env-force:
    bun scripts/create-env.ts --force

lefthook-install:
    lefthook install

# ═══════════════════════════════════════════════════════════════
# Dev
# ═══════════════════════════════════════════════════════════════

# Run backend + frontend in parallel (Ctrl+C stops both). Cross-platform (bun script).
dev: infra-up
    bun scripts/dev.ts

# Run backend only. PLANB_SEED_CORPUS=1 enables the test review corpus (see SeedCorpusHostedService).
[unix]
dev-backend: infra-up
    cd backend/host/Planb.Api && PLANB_SEED_CORPUS=1 dotnet watch run

[windows]
dev-backend: infra-up
    $env:PLANB_SEED_CORPUS='1'; cd backend/host/Planb.Api; dotnet watch run

# Run frontend only (any shell)
dev-frontend: infra-up
    cd frontend && bun dev

# ═══════════════════════════════════════════════════════════════
# Infra (auto-detect ports)
# ═══════════════════════════════════════════════════════════════

# Start containers, reusing running ones. Auto-finds free ports if defaults busy.
# Depends on _ensure-env so POSTGRES_PASSWORD and friends are guaranteed present.
infra-up: _ensure-env
    bun scripts/ensure-infra.ts

infra-down:
    bun scripts/compose.ts down

infra-status:
    bun scripts/compose.ts ps

infra-logs service="":
    bun scripts/infra-logs.ts {{service}}

# Reset: down + remove volumes + up
infra-reset:
    bun scripts/compose.ts down -v
    just infra-up

# Show detected container runtime and compose command
container-info:
    @bun scripts/detect-container.ts --info

# Validate toolchain: dotnet, bun, lefthook, playwright browsers, container runtime.
# Reads pins from .tool-versions and backend/global.json, compares with installed.
# Reports drift but does not auto-install (devs decide what to bump).
doctor:
    bun scripts/doctor.ts

# ═══════════════════════════════════════════════════════════════
# Build / Test / Lint
# ═══════════════════════════════════════════════════════════════

build: backend-build frontend-build

backend-build:
    cd backend && dotnet build

frontend-build:
    cd frontend && bun run build

test: backend-test frontend-test

backend-test:
    cd backend && dotnet test

backend-test-unit:
    cd backend && dotnet test --filter "FullyQualifiedName!~Planb.IntegrationTests"

backend-test-integration:
    cd backend && dotnet test tests/Planb.IntegrationTests

# Mutation testing sobre el corazón de reviews: mide si la suite detecta cambios reales al código, sin gate (ADR-0036).
backend-mutation:
    cd backend/modules/reviews/tests/Planb.Reviews.Tests && dotnet stryker

# Stryker con vitest sobre la lógica de reseñar (frontend/stryker.config.mjs). Necesita al menos un
# test unitario que importe el feature: con cero tests relacionados el runner aborta.
frontend-mutation:
    cd frontend && bunx stryker run

frontend-test:
    cd frontend && bun run test

# E2E contra una base efímera, igual que el job `e2e` de ci.yml. El script levanta su propio
# backend + frontend contra una `planb_e2e` recreada, así que el stack de dev tiene que estar
# ABAJO (si `just dev` corre, corta con el puerto ocupado).
#
# Antes esto era `bunx playwright test` a secas contra el stack de dev, y cada corrida dejaba
# usuarios, reseñas y borradores acumulados en la base de dev. El costo no era el desorden: los
# specs no podían afirmar datos concretos porque el estado era compartido y mutable.
frontend-test-e2e *args:
    bun scripts/run-e2e.ts {{args}}

# E2E con browser visible y slowMo (ver el flow correr en pantalla).
# Usalo para inspección visual o cuando un spec falla y querés mirar.
# Acepta los mismos args que playwright test (filtros, --grep, etc.).
# Ej: just frontend-test-e2e-show e2e/auth/sign-up.spec.ts
#     just frontend-test-e2e-show --grep "happy path"
# Wrapped en TS porque pwsh (default Windows shell del Justfile) no entiende
# la sintaxis bash `VAR=value cmd`. El script setea PLAYWRIGHT_SLOWMO via
# process.env y forwardea args.
frontend-test-e2e-show *args:
    bun scripts/run-e2e-show.ts {{args}}

# Levanta el stack completo (backend + frontend) contra una base efímera propia (`planb_scratch`)
# para recorrer la app a mano sin ensuciar la base de dev. Usalo en vez de `just dev` cuando solo
# querés mirar/probar algo y no te interesa que quede guardado.
#
# Igual que E2E, pisa los puertos de siempre y necesita el stack de dev ABAJO. A diferencia de
# E2E: no corre ningún test, queda arriba imprimiendo las URLs y las personas sembradas hasta que
# cortás con Ctrl+C. Siembra las personas y el catálogo, pero NO reseñas: todavía no hay quien las
# genere, así que las fichas dicen "junta 0" (issue #374). Ahí dropea la
# base: no deja rastro en la base de dev ni en ninguna otra.
dev-scratch:
    bun scripts/run-scratch.ts

lint: backend-lint frontend-lint scripts-lint

lint-fix: backend-lint-fix frontend-lint-fix scripts-lint-fix

# Solo whitespace: el estilo y los analizadores los gatea el build (EnforceCodeStyleInBuild).
# El format completo compila y corre analizadores de nuevo; para corregir, backend-lint-fix.
backend-lint:
    cd backend && dotnet format whitespace --verify-no-changes --no-restore

backend-lint-fix:
    cd backend && dotnet format

frontend-lint:
    cd frontend && bun run lint

frontend-lint-fix:
    cd frontend && bun run lint:fix

frontend-typecheck:
    cd frontend && bunx tsc --noEmit

# Biome sobre scripts/ con la config de la raíz. Usa el binario que ya instala
# frontend en vez de `bunx biome`: desde la raíz no hay package.json, y ahí
# `bunx biome` se baja y ejecuta un paquete de npm que se llama igual y no es
# este (0.3.3, sin relación con @biomejs/biome).
scripts-lint:
    ./frontend/node_modules/.bin/biome check scripts

scripts-lint-fix:
    ./frontend/node_modules/.bin/biome check --write scripts

# Typecheck de scripts/. Los tipos de node salen de las deps de frontend via
# typeRoots relativo (scripts/tsconfig.json): no hace falta un package.json en
# la raiz, y tsc es el mismo binario que ya usa el frontend.
scripts-typecheck:
    ./frontend/node_modules/.bin/tsc --noEmit -p scripts/tsconfig.json

# ═══════════════════════════════════════════════════════════════

# Coherencia de la documentación de producto (ADR-0070): links, em-dashes,
# stories, pantallas, trazabilidad e idioma de los ADR.
# El punto de partida de TDD/ATDD: el "listo cuando" y los escenarios de una
# story, para escribir el test antes que el codigo (ADR-0072, ADR-0077)
scenarios us:
    bun scripts/show-scenarios.ts {{us}}

# ¿Hay un cambio de modelo de EF Core que nadie migró? Necesita el backend compilado.
check-migrations:
    bun scripts/check-migrations.ts

check-docs:
    bun scripts/check-docs.ts

# Igual pero cortando: es la forma en que corre en CI, y la que usa `just ci`.
# Interactivo señala y sigue, para no frenar un push por un doc a medio escribir.
check-docs-strict:
    bun scripts/check-docs.ts --strict

# Veredicto por escenario (E, N, X) de las stories bajo el gate: confirmado (un test lo cita), roto (#issue)
# o no construido. Sin --strict informa (solo un tracker ilegible lo hace fallar); --strict falla
# ante cualquier hallazgo que gatea (la lista está en testing.md).
check-scenarios:
    bun scripts/check-scenarios.ts

check-scenarios-strict:
    bun scripts/check-scenarios.ts --strict

# ═══════════════════════════════════════════════════════════════
# Package management
# ═══════════════════════════════════════════════════════════════

backend-restore:
    cd backend && dotnet restore
    cd backend && dotnet tool restore

frontend-install:
    cd frontend && bun install
    # Idempotente: Playwright skip si el binary ya está instalado y matchea
    # la versión de @playwright/test. Sin esto, `just frontend-test-e2e` falla
    # con "Executable not found" en máquina nueva. CI ya lo hace en e2e.yml,
    # pero el setup local no lo cubría — gap que cierra US devex S2.
    cd frontend && bunx playwright install chromium

# ═══════════════════════════════════════════════════════════════
# Database (EF Core migrations, per module)
# ═══════════════════════════════════════════════════════════════

# Apply EF Core migrations + Wolverine resource setup (db-apply).
# Wolverine's db-apply creates/updates the outbox/queue/durability tables.
migrate:
    cd backend/host/Planb.Api && dotnet ef database update \
        --project ../../modules/identity/src/Planb.Identity.Infrastructure \
        --context IdentityDbContext
    cd backend/host/Planb.Api && dotnet run --no-build -- db-apply

# Add migration to a specific module. Usage: just migrate-add identity InitialSchema
migrate-add module name:
    cd backend/modules/{{module}}/src/Planb.{{capitalize(module)}}.Infrastructure && \
    dotnet ef migrations add {{name}} --startup-project ../../../../host/Planb.Api

# Reset DB: down volumes + up + migrate
db-reset: infra-reset migrate

# Barre las bases planb_* huerfanas (corridas de test o sesiones scratch que quedaron sin
# limpiar). NO toca la base de desarrollo `planb`: para esa, `db-reset` es la receta destructiva
# (dropea todo y recrea de cero). Esta solo limpia el residuo ajeno a la base de dev.
db-prune:
    bun scripts/db-prune.ts

db-seed:
    cd backend/host/Planb.Api && dotnet run -- seed

# ═══════════════════════════════════════════════════════════════
# Cleanup
# ═══════════════════════════════════════════════════════════════

# Stop containers, remove volumes, delete .env files
teardown:
    bun scripts/compose.ts down -v
    bun scripts/remove-paths.ts .env frontend/.env.local

clean:
    cd backend && dotnet clean
    bun scripts/remove-paths.ts frontend/node_modules frontend/.next frontend/.turbo

# ═══════════════════════════════════════════════════════════════
# CI (las mismas gates que corre GitHub Actions, menos E2E)
# ═══════════════════════════════════════════════════════════════

# Todo lo que gatea un PR salvo E2E, que necesita el stack levantado y tarda
# ~10 min: ese corre con `just frontend-test-e2e`. El resto es paridad real
# con ci.yml, docs-links.yml y commits.yml.
ci: backend-lint backend-build check-migrations backend-test frontend-lint frontend-typecheck scripts-lint scripts-typecheck check-docs-strict check-scenarios frontend-build frontend-test
    @echo "✓ All quality gates passed"
