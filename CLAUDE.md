@AGENTS.md

## Claude Code

Adaptador del contrato de `AGENTS.md` ("Reparto del trabajo") para este cliente. Los roles viven en [`.claude/agents/`](.claude/agents) con su modelo en el frontmatter: `scout`, `test-runner`, `browser-runner` y `source-researcher` en haiku, `implementer` en sonnet, `reviewer` en opus. Un built-in (`Explore`, `claude-code-guide`) solo con `model` haiku o sonnet.

Tres hooks cableados en `.claude/settings.json` hacen cumplir el reparto y bloquean ([ADR-0088](docs/decisions/0088-the-main-context-orchestrates-and-two-hooks-enforce-it.md)):

- `guard-main-context` ([`.claude/hooks/`](.claude/hooks)), solo en el contexto principal (dentro de un subagente no interviene): niega las suites (`dotnet test`, Playwright, vitest, `just test`, `just ci`) y cuenta las escrituras de código por sesión (`backend/`, `frontend/src/`, `frontend/e2e/`, `scripts/`, también por heredoc o `sed`): avisa en cada una desde la 8 y bloquea a las 20.
- `guard-agent-tier` (`.claude/hooks/`), en cualquier contexto: niega `general-purpose`, `fork`, un `Agent` sin tipo, un built-in sin modelo barato y un `model` que pise el frontmatter.
- `guard-tool-budget` ([`.agents/hooks/`](.agents/hooks), compartido con Codex): cuenta por sesión y subagente las llamadas de browser (Playwright, Chrome) y de web (`WebSearch`, `WebFetch`) y niega al agotar el presupuesto, 12 y 6 por default.

Escape por sesión, decisión del usuario: `PLANB_GUARD_OFF=1` apaga los dos primeros y `PLANB_TOOL_BUDGET_OFF=1` el tercero; topes con `PLANB_GUARD_EDIT_NUDGE`, `PLANB_GUARD_EDIT_DENY`, `PLANB_BROWSER_TOOL_LIMIT` y `PLANB_WEB_TOOL_LIMIT`.

El resto del adaptador: `.claude/skills/` es el catálogo nativo e independiente de Claude Code; no se sincroniza con `.agents/skills/`. Para decisiones visuales usa `bencium-controlled-ux-designer` y aplica `ui-typography` en UI; las alternativas visuales respetan sus propios triggers. `.claude/rules/` carga reglas por path al tocar un endpoint, un read Dapper o un test; `.claude/workflows/` son las revisiones multi-agente (`deep-review`, `doc-drift`, `security-audit`, `test-gaps`), de solo lectura y con el fan-out que declara cada script.
