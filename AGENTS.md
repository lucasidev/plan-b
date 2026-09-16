# planb

Instrumento de presión estudiantil sobre las universidades argentinas: convierte lo que los alumnos saben por haberlo vivido (hoy disperso en grupos y pasillos) en datos agregados que aguantan una discusión. Solo se reseña la cursada, en tres capas (contexto que no se publica, conducta observable de la cátedra en frecuencias gruesas, vivencia en primera persona); la ficha publica conteos con sus voces y nunca un puntaje (la moda literal, la distribución por opción, lo que converge entre ítems, y la comparación solo contra las cátedras hermanas); el campo libre no se publica y alimenta la curaduría; los datos oficiales van con su fuente al lado de las voces; lectura sin cuenta. Proyecto Final de la Tecnicatura Universitaria en Desarrollo y Calidad de Software (UNSTA).

La tesis completa, que gobierna todo lo demás: [`docs/THESIS.md`](docs/THESIS.md). **El código de este repo contiene además la versión anterior del producto (el planificador de cuatrimestre) en retiro**: el viraje está registrado en [ADR-0063](docs/decisions/0063-the-product-is-a-pressure-instrument.md) y la poda se planifica en [`docs/plan/status.md`](docs/plan/status.md).

Detalle del dominio: [`docs/product/language.md`](docs/product/language.md).

## Cultura de ingeniería

Cómo pensamos y decidimos en este proyecto. No son procesos a cumplir: son lentes para tomar mejores decisiones. Todos los defaults se anulan con razonamiento explícito, nunca por dogma.

**Pragmatismo (gobierna todo): las reglas son defaults fuertes, no mandamientos.** DDD, clean architecture, el outbox, Metz, el algoritmo de Musk, y estos mismos mindsets son sugerencias ponderadas por contexto. Se anulan argumentando, nunca por vibra ni por dogma, ni el de construir ni el de borrar.

**El orden de Musk: no optimices lo que no debería existir.** El error más caro de un ingeniero es optimizar o automatizar algo que no debería existir. La secuencia va en un solo sentido: (1) cuestionar el requisito, (2) borrar la parte o el proceso (si después no devolvés ~10% de lo que borraste, no borraste suficiente), (3) simplificar lo que sobrevive, (4) acelerar el ciclo, (5) automatizar. Antes de hacer algo más rápido o automático, preguntá si debería existir. Saltar a 3-5 sobre algo que había que cuestionar o borrar (1-2) es el error que más caro sale.

### Los mindsets

1. **Cuestionar el requisito.** Todo lo que construís desciende de un requisito: trazalo a una persona, una suposición y un resultado de negocio (cliente, plata, objetivo). Si no traza a eso, o se justifica o se va. Los requisitos de gente inteligente son los más peligrosos porque nadie los cuestiona.
2. **Quitar la paja.** Remové lo que está por mal planteamiento, decisión caducada o patrón aplicado porque sí. El discriminador no es tamaño ni minimalismo: son **procedencia** (por qué está) y **encaje** (sirve hoy). Removés el artefacto de un error, no lo que simplemente es "de más". Las decisiones caducan: re-evaluá.
3. **Romperlo a propósito.** Frente a tu propia arquitectura, sos revisor hostil buscando la falla fatal, con evidencia, no defensa. Antes de mergear un diseño, un pase activo intentando romperlo; concedé solo lo que sobrevive el asalto.
4. **El código es la verdad.** Los docs mienten. Citá código real (`file:line`), no memoria ni documentación. Validá contra el contrato o el código real antes de afirmar. Si no lo miraste, no lo sabés.
5. **Abstracción just-in-time (duplicar es más barato que la abstracción equivocada).** No extraigas una abstracción compartida hasta que la duplicación pruebe su forma con consumidores reales. Un bloque nace compartido cuando el **segundo consumidor real** lo necesita, a la altura donde es invariante; lo específico de cada vertical se compone en el producto. Composición sobre herencia, nunca un `if (vertical)`. (Conway: las fronteras siguen al equipo y a los consumidores reales, no al organigrama.)
6. **Sustancia sobre ceremonia.** Los controles automáticos señalan por default y bloquean solo cuando una decisión documentada lo justifica. Se documentan decisiones con alternativas reales, no cada tweak. Esta guía espeja el código, no lo duplica. Todo artefacto se gana su lugar; si es ceremonia que driftea, se borra.
7. **Sin azúcar.** Corregir directo, con contraejemplo del código. La meta es software de calidad, no comodidad. Si está mal, se dice, con evidencia. Aplica también a corregirte a vos mismo.
8. **La reversibilidad calibra el rigor.** Puerta de dos vías (reversible barato): decidí rápido, sin ceremonia. Puerta de una vía (cara de revertir): ahí gastás el #1 y el #3 a fondo. Aplicar escepticismo uniforme a todo es su propia paja.
9. **Acortá el lazo.** El juicio a-priori es falible; la forma más rápida de saber si algo es paja es shippear chico y mirar. Ante incertidumbre que el debate no cierra, construí el experimento más chico que te da la señal. Y antes de arrancar, escribí cómo vas a saber que está bien (test, repro, output esperado): un criterio de éxito verificable, y looped hasta cumplirlo.
10. **Calibra la confianza.** La falla más cara entre humano y agente es la afirmación confiada que en realidad es una suposición. Toda afirmación carga su nivel: verificado / supuesto / no sé. El "no sé" es información, no debilidad.
11. **YAGNI.** No construyas para un futuro hipotético (ancla nombrada del instinto que comparten #1, #2 y #5). Si la única justificación es "lo vamos a necesitar", no va hasta que lo necesites de verdad.
12. **Cambios quirúrgicos.** El diff hace lo que se pidió y nada más: no "mejores" código, comentarios ni formato adyacente de pasada. Remové solo la paja que tu propio cambio creó; el dead code preexistente que no tocaste no se borra como daño colateral (removerlo es tarea consciente, #2, no un side-effect). Antes de agregar tooling o "arreglar" algo, verificá que el problema sea real y que no exista ya una defensa (chequeá el código, no la memoria).

**Nota final:** estos mindsets son ellos mismos defaults, no mandamientos. Si en un caso concreto uno no aplica, lo anulás con una razón explícita. El único pecado es seguir o romper una regla por dogma en vez de por juicio.

### Aplicación a agentes, CI/CD e infraestructura

Este criterio también gobierna scripts, workflows, contenedores y configuración de agentes, tanto en Claude Code como en Codex. Antes de ajustar caches, concurrencia o límites, identificá el consumidor real y el costo observado; primero quitá trabajo innecesario dentro del alcance pedido. Un check se elige por lo que puede romper el cambio, no por compartir directorio o dependencias con otro check. Los filtros de CI deben conservar las verificaciones ante un detector fallido.

Medí el resultado con trabajo real comparable. CPU, memoria, workers, pools y retención se ajustan con métricas y margen operativo: la ausencia de un límite no prueba que un valor arbitrario mejore el sistema. Una prueba con dobles no valida un runtime externo; un check verde solo respalda el contrato que ejercitó. Registrá qué se quitó o simplificó, la evidencia y lo que siga sin verificar, sin convertir esta guía en un proceso adicional.

## Reparto del trabajo

El contexto principal decide, especifica, integra, verifica lo entregado y reporta. Puede resolver directamente un cambio acotado o un check conocido: preservar su contexto no exige delegar cada operación. Los roles son parte del contrato del proyecto; cada cliente los implementa con su configuración nativa y el modelo más barato que resuelva bien el trabajo.

| Trabajo | Rol | Contrato |
|---|---|---|
| Investigar dónde está X, todos los usos de Y o un inventario | `scout` | Solo lectura, evidencia con `file:line`, sin diseñar el cambio. Un archivo conocido se lee directo. |
| Construir desde un spec con alcance y criterio de éxito | `implementer` | Una pieza por worktree aislado, sin rediseñar el pedido ni integrar por su cuenta. |
| Correr build, lint o suites | `test-runner` | Ejecuta el comando exacto y devuelve verde/rojo más las fallas relevantes. |
| Revisar un diff no trivial antes del commit | `reviewer` | Contexto fresco, solo correctness, seguridad, invariantes y cobertura faltante. |
| Refutar un lote de hallazgos de revisión | `review-verifier` | Solo lectura, evidencia por hallazgo; lo no comprobado queda pendiente, nunca descartado por default. |
| Reproducir o verificar un síntoma renderizado concreto | `browser-runner` | Solo lectura, usa explícitamente `browser-repro`, no edita y respeta su presupuesto. |
| Investigar una cuestión ordinaria con fuentes públicas | `source-researcher` | Solo lectura, usa explícitamente `source-research`, no edita y respeta su presupuesto. |

- No delegar por reflejo: delegar solo cuando aísla contexto, permite trabajo realmente paralelo o ejecuta una suite larga.
- Máximo dos agentes simultáneos. Más concurrencia exige una razón explícita y tareas sin archivos ni estado compartidos; un workflow de revisión de solo lectura la declara en su propio script.
- Toda delegación fija rol, alcance, entregable, criterio de éxito y archivos prohibidos. El agente no pushea, no mergea y no integra otros worktrees.
- Pasar al agente rutas, hechos comprobados y la pregunta pendiente, no el historial entero. El principal no repite su exploración: verifica el diff y la evidencia relevante.
- Checks conocidos con salida breve pueden correr en el principal. Para salida voluminosa, usar `bun scripts/run-check.ts [--cwd directorio] -- ejecutable argumentos`: conserva el log y el exit code; un verde devuelve solo el resumen. Delegar suites largas cuando permita avanzar en otra tarea útil.
- No repetir un check verde si código, configuración, dependencias y estado relevante siguen iguales. Repetir ante cambios o sospecha concreta de flake; un fallo de infraestructura o una corrida parcial nunca cuenta como verde.
- Los worktrees de subagentes quedan en detached HEAD cuando el cliente lo permite: no crean ramas `worktree-agent-*`. Si un cliente necesita una rama auxiliar, el contexto principal la borra después de integrar su commit y retirar el worktree. Terminar con una rama auxiliar ya integrada es trabajo incompleto.
- `.agents/skills` contiene skills agnósticas útiles para Codex; `.claude/skills` conserva skills nativas o propias de Claude y no se sincroniza automáticamente.
- Si una tarea coincide con un skill de `.agents/skills/`, ese skill se carga completo antes de actuar y se pasa explícitamente al subagente. Nombrarlo en prosa no reemplaza cargarlo.
- Browser tiene un guard de 12 llamadas en Codex y Claude. Web tiene un guard de 6 llamadas en Claude; el WebSearch alojado de Codex no pasa por hooks y `source-research` aplica ese presupuesto por instrucción. El contador se separa por subagente cuando el cliente informa su id.
- El contexto principal espera eventos de finalización; no hace polling corto ni mantiene agentes sin trabajo útil.
- Los modelos y el esfuerzo viven en el adaptador de cada cliente, nunca en este contrato compartido. El default de subagentes debe ser barato; un tier superior se gana por la tarea.

Al integrar trabajo auxiliar, el contexto principal verifica primero que no queden cambios sin commitear, retira el worktree y ejecuta `bun scripts/cleanup-agent-branches.ts --base HEAD --apply`. El script solo borra ramas `worktree-agent-*` inactivas sin parches únicos respecto de la base; una rama activa o con trabajo único nunca se borra automáticamente.

El origen histórico del reparto está en [ADR-0088](docs/decisions/0088-the-main-context-orchestrates-and-two-hooks-enforce-it.md). La operación vigente y cómo medirla están en [agent-workflow.md](docs/engineering/agent-workflow.md).

## Stack y estructura

La tabla del stack por capa y el árbol comentado del repo viven en [`README.md`](README.md) ("Stack técnico" y "Estructura del repo"). Lo que hace falta tener presente sin abrirlo: `backend/` es un modular monolith .NET 10 con tres bounded contexts (`identity`, `academic`, `reviews`); `frontend/` es Next.js 15 App Router; `scripts/` son scripts TS con bun; `.agents/` lleva los skills compartidos y `.claude/` y `.codex/` son los adaptadores de cada cliente. `docs/` son cinco carpetas, una pregunta cada una ([ADR-0070](docs/decisions/0070-product-requirements-are-vertical-by-capability-and-design-is-text.md)): `THESIS.md` (qué es y qué no hace), `product/` (qué hace y para quién, leído como recorridos: [ADR-0077](docs/decisions/0077-the-product-docs-read-as-journeys.md)), `engineering/` (cómo está construido), `decisions/` (por qué), `plan/` (cuándo) e `history/` (qué fue, sin editar).

## Reglas cross-cutting

- **Código en inglés** (clases, métodos, tablas, rutas, identificadores). **Comentarios y docstrings en español rioplatense** (así razona el equipo; el código no). **UI en español rioplatense**. Error messages internos en inglés.
- **Un término se usa, no se inventa.** Antes de nombrar cualquier cosa (en UI, en comentarios, en docs, en el chat), buscarla en [`docs/product/language.md`](docs/product/language.md). Si ya tiene nombre, ese es el nombre y no hay segundo. Un sinónimo nuevo para algo que ya se llama de una forma es un bug: obliga a todo el que lee a preguntarse si son dos cosas distintas. Si el concepto no está en el glosario y hace falta, se agrega ahí primero.
- **"Por qué" no es palabrerío.** Un comentario dice el invariante, el tradeoff o la razón por la que la línea existe, en una o dos frases. No defiende la decisión, no explica lo que la cosa *no* es, no narra cómo se llegó (eso va al commit body y al ADR) ni presenta conceptos que no están en el glosario. En docs la vara es más dura: **una definición define y cierra**. Va la conclusión, no el camino. Si hace falta prohibir o contrastar un término, va en la sección que existe para eso (la tabla **Desambiguación** de `language.md`), en una línea, no inflando la definición.
- **Conventional Commits** enforceado por lefthook commit-msg (`bun scripts/check-commit-msg.ts`). Formato: `type(scope): descripción`. Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert. **El subject va en inglés y el body en español** ([git-workflow.md](docs/engineering/git-workflow.md)), y el mismo script lo bloquea si el subject lee como español. El `CHANGELOG.md` está congelado y **no se edita a mano**: se genera de una pasada, desde los propios commits, el día que haya quien lo lea ([ADR-0074](docs/decisions/0074-the-changelog-is-generated-on-demand-not-appended-on-every-push.md)).
- **Versioning y deploy**: el stage sigue a `main` (cada merge publica las imágenes y lo redespliega) y producción se promueve desde un Release de GitHub, con versión semver recién ahí. Tags narrativos manuales (`presentacion-fase-2-...`) permitidos para hitos. Política completa en [ADR-0089](docs/decisions/0089-the-stage-follows-main-and-production-is-promoted-from-a-release.md).
- **No pusheos directos a `main`**. Flow PRs-only. Branches `type/scope-description` (ej. `feat/identity-register`, `fix/reviews-publishing-floor`). **Sin US numbers en el branch name** (las US van en commit body o PR body). Merge strategy: **Rebase and merge** por default, **Squash and merge** si el PR tiene commits WIP, **nunca "Create a merge commit"** en esta fase. Ver [ADR-0026](docs/decisions/0026-git-workflow-github-flow-with-rebase.md) (decisión) y [`docs/engineering/git-workflow.md`](docs/engineering/git-workflow.md) (bitácora operacional con anti-patterns).
- **Decisiones con alternativas reales → ADR** en `docs/decisions/NNNN-title-in-english.md` (título y filename en inglés, cuerpo en español; lo chequea `check-docs`). Ver [`docs/decisions/README.md`](docs/decisions/README.md) para criterios.
- **Gestión del proyecto**: **la story vive en su épica** (`docs/product/<journey>/<epic>/stories/US-NNN-slug/`, una carpeta con su letra y sus escenarios), con su criterio de aceptación y sin estado de gestión. El tracker es [`docs/plan/status.md`](docs/plan/status.md), que la **cita por ID** y le agrega el sprint, las tareas y el contrato técnico ([ADR-0072](docs/decisions/0072-the-story-lives-in-its-epic-and-the-plan-only-references-it.md)). **El ID no cambia nunca y no lleva semántica**: la story no se parte por razones de ejecución, se parte el trabajo. Formato y reglas en [`docs/plan/story-template.md`](docs/plan/story-template.md). Notion se dejó de usar el 2026-08-18: no se sincroniza, no se crean pages, y lo que quedó ahí es historia. **Al mergear un PR, el que mergea actualiza el estado de la story en `status.md`, en el mismo PR.** Lecciones operativas en [`docs/engineering/lessons-learned.md`](docs/engineering/lessons-learned.md).
- **Persistence ignorance** ([ADR-0017](docs/decisions/0017-persistence-ignorance.md)): el dominio no sabe ni le importa dónde se persisten los datos. No FKs cross-schema, no EF navigation cross-module.
- **Scripts en TypeScript** (`bun`), no en bash: es lo que los hace correr igual en Windows, donde el shell del Justfile es pwsh y `rm -rf` no existe. Pasan por biome y `tsc` como el resto del código (`just scripts-lint`, `just scripts-typecheck`).
- **No referenciar paths locales, proyectos privados externos, ni secrets en código/docs.**

## Comandos frecuentes

```
just setup           # Primera vez: .env + infra + deps + hooks
just dev             # Backend + frontend en paralelo (requiere bash)
just dev-backend     # Solo backend
just dev-frontend    # Solo frontend
just test            # Todos los tests
just lint            # Biome (frontend + scripts) + dotnet format check
just lint-fix        # Autofix
just migrate         # Aplicar migraciones EF Core pendientes
just infra-up        # Levantar Postgres + Redis + Mailpit (auto-detecta podman/docker)
just infra-reset     # Volar volúmenes y rearmar
just ci              # Las mismas gates que CI, menos E2E (necesita el stack: just frontend-test-e2e)
```

## Documentación

Qué abrir antes de programar, según lo que se toca:

- Siempre: [`docs/THESIS.md`](docs/THESIS.md) (qué es y qué no hace) y [`docs/product/language.md`](docs/product/language.md) (el glosario: antes de nombrar algo).
- Modelo o persistencia: [`docs/engineering/data-model.md`](docs/engineering/data-model.md) (ERD por bounded context).
- Algo estructural: [`docs/decisions/`](docs/decisions) (ADRs), buscar si ya hay uno.
- Tests: [`docs/engineering/testing.md`](docs/engineering/testing.md) (qué test para qué cambio; pirámide en [ADR-0036](docs/decisions/0036-testing-pyramid-cross-stack.md)).
- Visuales: [`docs/product/design-system.md`](docs/product/design-system.md) (tokens), las stories y [personas](docs/product/personas.md) en [`docs/product/`](docs/product/README.md).
- Git, incidentes y deploy: [`docs/engineering/git-workflow.md`](docs/engineering/git-workflow.md), [`rollback.md`](docs/engineering/rollback.md), [`runbook.md`](docs/engineering/runbook.md), [`deploy.md`](docs/engineering/deploy.md).
- Planificación: [`docs/plan/status.md`](docs/plan/status.md) (sprints), [`story-template.md`](docs/plan/story-template.md) y [`definition-of-done.md`](docs/plan/definition-of-done.md).

Detalle por capa: [`backend/AGENTS.md`](backend/AGENTS.md) y [`frontend/AGENTS.md`](frontend/AGENTS.md), que amplían [`docs/engineering/backend-conventions.md`](docs/engineering/backend-conventions.md) y [`frontend-conventions.md`](docs/engineering/frontend-conventions.md).

## Boundaries

- **No** commitear `.env`, secrets, archivos de IDE ni estado local de los clientes. En `.agents/`, `.claude/` y `.codex/` solo entra configuración declarativa compartida y revisable.
- **No** pushear directo a `main`. Siempre via PR.
- **No** introducir referencias a paths absolutos locales o a proyectos privados externos.
- **No** hacer `git push --force` a `main` salvo que sea explícitamente pedido.
- **No** hacer merge de PR sin que pase CI.
