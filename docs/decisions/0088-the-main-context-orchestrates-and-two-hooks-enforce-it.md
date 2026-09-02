# 0088: The main context orchestrates, and two hooks enforce it

- **Estado**: aceptado
- **Fecha**: 2026-09-02

## Contexto

El repo define desde julio cuatro agentes en `.claude/agents/`, cada uno con su modelo fijado en el frontmatter: `scout` (haiku) investiga, `test-runner` (haiku) corre suites y devuelve verde o rojo con las fallas, `implementer` (sonnet) construye una pieza desde un spec, `reviewer` (opus) revisa un diff. La regla que los acompaña dice que el contexto principal, que corre en el tier más caro, orquesta: decide, especifica, verifica lo entregado y reporta.

Esa regla vivió como texto, en una memoria del asistente y en una línea de su índice, y falló dos veces en direcciones opuestas. El 2026-07-29 una sesión lanzó unos 264 agentes `general-purpose`, que heredan el modelo de la sesión, gastó unos 18M de tokens y chocó dos veces el límite. El 2026-09-02, la inversa: 1067 tool calls sin un solo subagente, una story entera escrita a mano, un audit leyendo decenas de archivos, y las suites de integración, vitest y E2E corridas desde el contexto principal; el contexto se compactó a mitad de tarea. La memoria que describía el primer incidente estaba cargada durante el segundo.

Claude Code ofrece hooks `PreToolUse` que reciben cada tool call por stdin y pueden negarla (`permissionDecision: deny`) o inyectar contexto (`additionalContext`). Cuando la llamada ocurre dentro de un subagente, el input trae `agent_id` y `agent_type`. La cultura del repo dice que un hook señala y no bloquea (mindset 6 de `CLAUDE.md`).

## Decisión

**Dos hooks del repo hacen cumplir el reparto, y bloquean.** Viven en `.claude/hooks/`, se cablean en `.claude/settings.json`, y los tres archivos entran al repo.

1. `guard-main-context`, solo en el contexto principal (si el input trae `agent_id`, no interviene): niega los comandos que corren una suite (`dotnet test`, Playwright, vitest, `just test`, `just ci` y sus variantes con prefijo, `sh -c` o multilínea; lo entre comillas es prosa y no cuenta), y cuenta las escrituras de código por sesión (Edit y Write sobre `backend/`, `frontend/src/`, `frontend/e2e/` y `scripts/`, más las mismas escrituras hechas por la shell): avisa en cada una desde la octava y niega desde la vigésima.
2. `guard-agent-tier`, en cualquier contexto: niega un `Agent` sin tipo, `general-purpose` o `fork`; un built-in sin `model` haiku o sonnet; y un `model` que pise el del frontmatter de un agente del proyecto.
3. El escape es del usuario, al lanzar la sesión, nunca del agente desde adentro: `PLANB_GUARD_OFF=1` apaga los dos; `PLANB_GUARD_EDIT_NUDGE` y `PLANB_GUARD_EDIT_DENY` mueven los topes.
4. Los hooks fallan abiertos: stdin ilegible, sin `session_id`, estado inaccesible o roster ausente dejan pasar. Lo que se niega es siempre lo explícito.

## Alternativas consideradas

**A. La regla como texto (memoria del asistente, `CLAUDE.md`).** Lo que había. Se descarta como único mecanismo porque falló dos veces con la regla cargada en contexto: el texto compite con la inercia de "una más y termino", y pierde. La sección "Reparto del trabajo" de `CLAUDE.md` se conserva porque dice quién hace qué; el hook es lo que lo cobra.

**B. Hooks que solo señalan, fieles al mindset 6.** Se descarta para las suites y para el tope de escrituras: una señal es texto, y el texto es lo que ya falló. Se conserva para la zona gris: de la octava a la decimonovena escritura el hook avisa y deja pasar, porque un arreglo quirúrgico largo existe y no hay que romperlo; a la vigésima ya no es un arreglo.

**C. `CLAUDE_CODE_SUBAGENT_MODEL=sonnet` como red.** En la versión en uso (2.1.220) la variable pisa el `model` del frontmatter: pondría `reviewer` en sonnet, y `scout` y `test-runner` en sonnet en vez de haiku. Desde 2.1.251 queda debajo del frontmatter, pero sigue sin tocar a los built-ins `Explore` y `Plan`. El hook de tier cubre el mismo hueco sin ese efecto.

**D. `permissions.deny` en settings.** Niega `dotnet test` para todos, subagentes incluidos: sin `test-runner` no queda forma de correr las suites. El hook distingue por `agent_id`.

**E. Un tope por tokens o por tamaño de contexto.** El input del hook no trae esa señal. Las escrituras de código y las suites son el proxy medible de lo que llenó el contexto en los dos incidentes.

## Consecuencias

**Positivas:**

- Correr una suite o construir desde el contexto principal deja de ser una decisión de cada momento: rebota, con el camino correcto en el mensaje.
- El reparto queda versionado en el repo con sus pruebas (72 casos en seco) y verificado en vivo: un `dotnet test` del contexto principal rebota, el mismo comando desde `test-runner` pasa, un `general-purpose` rebota.
- Un `general-purpose` no vuelve a heredar el tier de la sesión sin que el usuario lo pida con `PLANB_GUARD_OFF`.

**Negativas:**

- Cada tool call de Bash y de edición paga un proceso de node, decenas de milisegundos.
- Un comando que nombra un runner en posición de comando sin correrlo (por ejemplo `bunx vitest --version`) rebota igual, y hay que delegarlo o reformularlo.
- El conteo es por sesión y vive en el directorio temporal: una sesión reanudada arranca de cero. Aceptado: el tope protege el contexto, y un contexto reanudado también empieza de cero.
- El mindset 6 gana una excepción explícita y es la única: otro hook que bloquee necesita su propio ADR.
