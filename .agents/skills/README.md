# Skills del repo

Los skills viven acá, en el directorio estándar que leen Codex y los demás clientes, y en ningún otro lado del repo; `.claude/skills/` es la copia local que lee Claude Code, gitignorada y generada por `just sync-agent-config` (la corre el hook `SessionStart`). Los propios del proyecto (`slice-*`, `dapper-read`, `integration-event`, `new-adr`, `ship`, `regen-screenshots`) se escribieron para planb (`sync-notion` se retiró el 2026-08-18 con Notion). Los de UX/UI son de terceros, copiados como archivos (sin CLI ni ejecución de instaladores) y revisados antes de entrar. Se listan acá con procedencia para que la copia sea auditable.

## UX/UI (terceros, instalados 2026-08-16)

| Skill | Origen | Licencia | Rol en planb | Cambios locales |
|---|---|---|---|---|
| `bencium-controlled-ux-designer` | [bencium/bencium-claude-code-design-skill](https://github.com/bencium/bencium-claude-code-design-skill) | MIT | **Default de UX/UI.** Sistemático, WCAG 2.1 AA, escalas matemáticas, y pregunta antes de decidir. Se dispara al construir pantallas. | Cuerpo partido en `SKILL.md` corto + `references/` |
| `bencium-innovative-ux-designer` | ídem | MIT | Alternativa estilizada para vitrina/campañas. Solo por nombre. | Trigger acotado para que no compita con el default; cuerpo partido en `SKILL.md` corto + `references/` |
| `bencium-impact-designer` | ídem | MIT | Alternativa anti-slop (adaptación del frontend-design de Anthropic). Solo por nombre. | Trigger acotado; cuerpo partido en `SKILL.md` corto + `references/` |
| `design-audit` | ídem | MIT | Auditoría visual de lo que ya existe, produce plan por fases. Solo visual, no funcionalidad. | Ninguno |
| `ui-typography` | ídem (`typography`) | MIT | Tipografía correcta en toda UI generada (comillas, guiones, espaciado, jerarquía). Modo enforcement silencioso. | Renombrado el directorio a `ui-typography` (coincide con su `name`) |
| `web-design-guidelines` | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) | MIT | Revisor de código UI contra las Web Interface Guidelines (100+ reglas de accesibilidad, foco, formularios, estados). Consulta las reglas desde GitHub con la herramienta web disponible: depende de red para refrescarlas. | Ninguno |
| `design-taste-frontend` | [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) (`skills/taste-skill`) | MIT | Anti-slop para landing pages. **Solo la landing pública**: el propio skill se declara fuera de alcance para dashboards, tablas y UI de producto. | Trigger acotado a la landing; incluye su LICENSE; cuerpo partido en `SKILL.md` corto + `references/` |

De bencium se dejaron afuera a propósito: `relationship-design` (interfaces AI-first con memoria: chatbots, no aplica) y todo lo que no es diseño (marketing, productividad, el hook de estado emocional).

## Cómo conviven

Un solo default se dispara al construir (`controlled`); `ui-typography` corre siempre en silencio; `web-design-guidelines` y `design-audit` son revisores que se invocan sobre algo que ya existe; `innovative`, `impact` y `design-taste-frontend` solo por pedido explícito. La UX/UI de cada pantalla se decide desde su user story y su persona (`docs/product/`), con los tokens de `docs/product/design-system.md`; el mapa mid-fi es orientativo. Ningún skill decide qué se construye: eso lo dicen las stories.
