# planb — task runner
# Detects container runtime (podman preferred, falls back to docker).
# Override with: CONTAINER_CMD=docker just <recipe>

set dotenv-load := true
set windows-shell := ["pwsh", "-NoLogo", "-Command"]

container_cmd := env("CONTAINER_CMD", `bun scripts/detect-container.ts`)
compose := container_cmd + " compose"

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

# Run backend only (any shell)
dev-backend: infra-up
    cd backend/host/Planb.Api && dotnet watch run

# Run frontend only (any shell)
dev-frontend: infra-up
    cd frontend && bun dev

# ═══════════════════════════════════════════════════════════════
# Infra (auto-detect ports)
# ═══════════════════════════════════════════════════════════════

# Start containers, reusing running ones. Auto-finds free ports if defaults busy.
# Depends on _ensure-env so POSTGRES_PASSWORD and friends are guaranteed present.
infra-up: _ensure-env
    bun scripts/ensure-infra.ts {{container_cmd}}

infra-down:
    {{compose}} down

infra-status:
    {{compose}} ps

infra-logs service="":
    bun scripts/infra-logs.ts {{container_cmd}} {{service}}

# Reset: down + remove volumes + up
infra-reset:
    {{compose}} down -v
    just infra-up

# Show detected container runtime and compose command
container-info:
    @echo "Container runtime: {{container_cmd}}"
    @echo "Compose command:   {{compose}}"
    @echo ""
    @echo "Override with: CONTAINER_CMD=docker just <recipe>"

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
    cd backend && dotnet test --filter Category=Unit

backend-test-integration:
    cd backend && dotnet test --filter Category=Integration

frontend-test:
    cd frontend && bun run test

frontend-test-e2e *args:
    cd frontend && bunx playwright test {{args}}

# E2E con browser visible y slowMo (ver el flow correr en pantalla).
# Usalo para inspección visual o cuando un spec falla y querés mirar.
# Acepta los mismos args que playwright test (filtros, --grep, etc.).
# Ej: just frontend-test-e2e-show e2e/auth/onboarding.spec.ts
#     just frontend-test-e2e-show --grep "happy path"
# Wrapped en TS porque pwsh (default Windows shell del Justfile) no entiende
# la sintaxis bash `VAR=value cmd`. El script setea PLAYWRIGHT_SLOWMO via
# process.env y forwardea args.
frontend-test-e2e-show *args:
    bun scripts/run-e2e-show.ts {{args}}

lint: backend-lint frontend-lint

lint-fix: backend-lint-fix frontend-lint-fix

backend-lint:
    cd backend && dotnet format --verify-no-changes

backend-lint-fix:
    cd backend && dotnet format

frontend-lint:
    cd frontend && bun run lint

frontend-lint-fix:
    cd frontend && bun run lint:fix

# ═══════════════════════════════════════════════════════════════
# Package management
# ═══════════════════════════════════════════════════════════════

backend-restore:
    cd backend && dotnet restore

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

db-seed:
    cd backend/host/Planb.Api && dotnet run -- seed

# ═══════════════════════════════════════════════════════════════
# Cleanup
# ═══════════════════════════════════════════════════════════════

# Stop containers, remove volumes, delete .env files
teardown:
    {{compose}} down -v
    rm -f .env frontend/.env.local

clean:
    cd backend && dotnet clean
    cd frontend && rm -rf node_modules .next .turbo

# ═══════════════════════════════════════════════════════════════
# CI (same recipes the GitHub Actions workflow runs)
# ═══════════════════════════════════════════════════════════════

ci: backend-build backend-test frontend-lint frontend-build frontend-test
    @echo "✓ All quality gates passed"
