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

# Run backend + frontend in parallel (Ctrl+C stops both). Requires bash (Git Bash on Windows).
dev: infra-up
    #!/usr/bin/env bash
    trap 'kill 0' SIGINT
    (cd backend/host/Planb.Api && dotnet watch run) &
    (cd frontend && bun dev) &
    wait

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
    #!/usr/bin/env bash
    if [ -z "{{service}}" ]; then
        {{compose}} logs -f
    else
        {{compose}} logs -f {{service}}
    fi

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

frontend-test-e2e:
    cd frontend && bunx playwright test

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
