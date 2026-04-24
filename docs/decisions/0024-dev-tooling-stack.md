# ADR-0024: Development tooling stack

- **Estado**: aceptado
- **Fecha**: 2026-04-23

## Contexto

Planb es un monorepo con dos stacks (backend .NET 10 + frontend Next.js 15/Bun) que tienen que poder desarrollarse, testearse, linterarse y deployarse de forma consistente desde una sola consola. Cada tooling tiene alternativas populares; elegir sin criterio lleva a un mix inconsistente.

Hay que decidir: task runner, pre-commit hooks, package manager del frontend, linter/formatter, test runners, orquestación de containers dev, deploy target, CI.

## Decisión

Stack elegido por herramienta, con justificación:

| Layer | Herramienta | Alternativas descartadas |
|---|---|---|
| Task runner | **Just** (Justfile) | Make, npm scripts, scripts bash |
| Pre-commit hooks | **Lefthook** | Husky, pre-commit (Python) |
| Frontend package manager | **Bun** | pnpm, npm, yarn |
| Frontend linter/formatter | **Biome** | ESLint + Prettier |
| Backend linter | **dotnet format + analyzers** via `Directory.Build.props` | StyleCop standalone, ReSharper |
| Unit tests frontend | **Vitest** | Jest |
| E2E tests frontend | **Playwright** | Cypress, WebdriverIO |
| Unit tests backend | **xUnit** | NUnit, MSTest |
| Integration tests backend | **xUnit + Testcontainers** | docker-compose manual, in-memory DB |
| Container orchestration dev | **docker-compose** | Podman compose, Tilt |
| Deploy | **Dokploy sobre VPS** | raw Docker, Kubernetes, Vercel, Fly.io, Railway |
| CI | **GitHub Actions** | GitLab CI, CircleCI, Jenkins |

### Justificaciones clave

**Just**: sintaxis simple, cross-platform (Windows + Unix con WSL o nativo), un solo `Justfile` en la raíz con recetas para backend y frontend. Superior a Make en Windows y más estructurado que scripts ad-hoc.

**Lefthook**: escrito en Go, fast, cross-platform. Husky tiene issues en Windows y depende de Node. `pre-commit` es Python y menos común en equipos JS/.NET.

**Bun**: el instalador más rápido del ecosistema JS (10-30x pnpm en casos), runtime compatible con Node APIs, TypeScript nativo, lockfile robusto. Su adopción en proyectos nuevos es dominante en 2026.

**Biome**: consolida linter + formatter en una sola tool Rust-based. Reemplaza ESLint + Prettier con ~10x la velocidad y configuración mínima. Ecosistema en crecimiento (2026: estable para React/TS).

**Vitest**: Vite-native, API casi igual a Jest pero con mejor DX (watch mode rápido, UI de debugging, TypeScript first-class). Jest sigue siendo viable pero Vitest es mejor elección para proyectos nuevos con toolchain moderno.

**Playwright**: modern E2E cross-browser, mejor tooling que Cypress (trace viewer, codegen, multi-browser), mantenido activamente por Microsoft. Cypress dominó 2020-2023; Playwright lo superó en features y velocidad.

**xUnit**: de facto standard moderno en .NET. Parallel tests por default. MSTest y NUnit siguen vivos pero xUnit tiene mejor DX y ecosistema.

**Testcontainers**: levanta un Postgres real para integration tests. Permite tests auténticos con pgvector, CHECKs, triggers, etc. Alternativa (in-memory DB) es engañosa: los tests pasan pero production falla por diferencias específicas de Postgres.

**docker-compose**: standard. Podman compose es compatible pero planb va a Dokploy que asume Docker. Tilt es overkill para el tamaño del proyecto.

**Dokploy**: self-hosted PaaS sobre un VPS. Sin vendor lock-in, sin cargo pay-per-use, maneja Traefik + SSL + rolling deploys. Alineado con la política del proyecto de no gastar en servicios (ver memoria de contexto). Vercel/Fly/Railway son excelentes pero cuestan.

**GitHub Actions**: donde vive el repo. Integración natural. Workflows yaml declarativos. Pipeline gratis para repos públicos / límites razonables para privados.

## Alternativas consideradas (a alto nivel)

- **Make en vez de Just**: funcional, pero sintaxis anticuada y Windows-hostile.
- **npm scripts solo**: cubre frontend pero no backend. Justfile abstrae ambos bajo un solo punto de entrada.
- **pnpm en vez de Bun**: pnpm es maduro y rock-solid, pero bun ganó velocidad y DX comparativa.
- **ESLint + Prettier**: maduro y omnipresente, pero Biome es mejor para proyectos nuevos (velocidad + simplicidad).
- **Kubernetes para deploy**: overkill, mucho overhead operativo, costo de infra más alto que VPS + Dokploy.

## Consecuencias

**Positivas:**

- Un solo punto de entrada (`Justfile`) para todos los comandos de dev: `just dev`, `just test`, `just lint`, `just migrate`, `just deploy`.
- Consistencia dev/CI: los workflows de GitHub Actions llaman los mismos recipes del Justfile que los devs usan local.
- Velocidad: Bun + Biome + Vitest = feedback loops rápidos. El tiempo de "guardé archivo → test pasa" es el KPI real del DX.
- Self-hosted deploy (Dokploy) alineado con la política de no gastar.

**Negativas:**

- Bun y Biome son más nuevos que npm/ESLint. Puede haber edge cases con libs que no soportan bien los nuevos tools (raro en 2026, pero posible).
- Lefthook y Just requieren instalación separada (no son npm-distributable). Los devs tienen que instalarlos localmente.
- Dokploy sobre VPS implica responsabilidad operativa (backups, monitoreo, upgrades del host). Vercel-like services evitan eso a cambio de costo.

**Onboarding de un dev nuevo:**

```
1. Instalar .NET 10 SDK, bun, docker, just, lefthook
2. Clonar repo
3. Ejecutar `just setup` (crea .env, levanta Postgres, corre migraciones, seed)
4. Ejecutar `just dev` (backend + frontend en paralelo)
```

~10 minutos hasta primera página corriendo.

**Cuándo revisitar:**

- Si Bun o Biome tienen issues graves o pierden momentum.
- Si el equipo crece y GitHub Actions se vuelve caro (habría que auto-hostear runners).
- Si operar el VPS se vuelve costoso en tiempo vs migrar a un PaaS.
