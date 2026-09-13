# Skills del repo

`.agents/skills/` contiene skills en el formato abierto Agent Skills cuyas instrucciones sirven en Codex sin depender de nombres de herramientas, hooks o convenciones exclusivas de otro cliente. No es un espejo de `.claude/skills/` y no existe ningún proceso de sincronización entre ambos catálogos.

## Propios de planb

| Skill | Uso |
|---|---|
| `browser-repro` | Reproducir un síntoma renderizado concreto con un presupuesto acotado. |
| `source-research` | Investigar una cuestión ordinaria con fuentes primarias y pocas consultas. |
| `slice-backend` | Construir un vertical slice de escritura en el backend. |
| `slice-frontend` | Construir un feature slice del frontend. |
| `dapper-read` | Implementar reads complejos o cross-schema con Dapper. |
| `integration-event` | Emitir y consumir eventos de integración entre módulos. |
| `new-adr` | Redactar una decisión estructural en el formato vigente del proyecto. |
| `regen-screenshots` | Regenerar evidencia visual desde el canvas histórico. |
| `ship` | Verificar, commitear y completar el ciclo de PR con aprobaciones separadas. |

## Terceros revisados

| Skill | Origen | Licencia | Alcance local |
|---|---|---|---|
| `web-design-guidelines` | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) | MIT | Auditoría de interfaces contra las Web Interface Guidelines. |
| `design-taste-frontend` | [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) | MIT | Solo landing pública y piezas de vitrina, nunca pantallas de producto. |

Los skills visuales escritos específicamente para Claude Code permanecen en `.claude/skills/`. Si una capacidad no tiene una versión válida para Codex, no se porta ni se copia acá.
