@AGENTS.md

## Claude Code

Adaptador del contrato de `AGENTS.md` ("Reparto del trabajo") para este cliente. Los roles viven en [`.claude/agents/`](.claude/agents) con su modelo en el frontmatter: `scout`, `test-runner`, `browser-runner` y `source-researcher` en haiku, `implementer` y `review-verifier` en sonnet, `reviewer` en opus. Un built-in (`Explore`, `claude-code-guide`) solo con `model` haiku o sonnet.

Dos hooks cableados en `.claude/settings.json` limitan el costo de las delegaciones y herramientas:

- `guard-agent-tier` (`.claude/hooks/`), en cualquier contexto: niega `general-purpose`, `fork`, un `Agent` sin tipo, un built-in sin modelo barato y un `model` que pise el frontmatter.
- `guard-tool-budget` ([`.agents/hooks/`](.agents/hooks), compartido con Codex): cuenta por sesión y subagente las llamadas de browser (Playwright, Chrome) y de web (`WebSearch`, `WebFetch`). Browser emite un recordatorio de progreso cada 12 llamadas, sin bloquear ni medir tokens. `PLANB_BROWSER_TOOL_LIMIT` define el intervalo, y `0` avisa en cada llamada. Web conserva el bloqueo al agotar 6 llamadas por default.

Escape por sesión, decisión del usuario: `PLANB_GUARD_OFF=1` apaga el de modelos y `PLANB_TOOL_BUDGET_OFF=1` el de herramientas; topes con `PLANB_BROWSER_TOOL_LIMIT` y `PLANB_WEB_TOOL_LIMIT`. No hay bloqueo por cantidad de ediciones ni por correr tests en el principal: rige el criterio de delegación de `AGENTS.md`.

El resto del adaptador: `.claude/skills/` es el catálogo nativo e independiente de Claude Code; no se sincroniza con `.agents/skills/`. Para decisiones visuales usa `bencium-controlled-ux-designer` y aplica `ui-typography` en UI; las alternativas visuales respetan sus propios triggers. `.claude/rules/` carga reglas por path al tocar un endpoint, un read Dapper o un test. Las revisiones de `.claude/workflows/` usan un `reviewer` y, solo si hay hallazgos, un `review-verifier` sonnet por lote. Son secuenciales y de solo lectura; no se encadenan las cuatro por rutina.
