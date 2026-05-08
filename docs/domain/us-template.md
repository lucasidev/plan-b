# US template

Plantilla de referencia para escribir una nueva User Story. Copiar el bloque entero a un archivo `US-NNN.md` (o `US-NNN-b.md` / `-f.md` / `-i.md` cuando entra a sprint y se subdivide) y reemplazar los placeholders.

Las US existentes que cubren menos secciones se backfillean **cuando entran a sprint**, no preventivamente. Una US en Backlog con solo AC + sub-tasks es válida; lo que hace falta para entrar a sprint es la sección "Edge cases", "Out of scope" y "Test scenarios" completas (ver Definition of Ready más abajo).

## Bases industriales de este template

Este template incorpora las prácticas establecidas que la industria reconoce desde 2003+:

- **INVEST criteria** ([Bill Wake, 2003: artículo original en XP123](https://xp123.com/articles/invest-in-good-stories-and-smart-tasks/)): toda US debería ser **I**ndependent, **N**egotiable, **V**aluable, **E**stimable, **S**mall, **T**estable. La sección "Dependencies" hace explícitas las violaciones de Independent (cuando son inevitables); el formato de AC + Test scenarios apuntan a Testable.
- **Connextra format** ([Mike Cohn, Mountain Goat Software](https://www.mountaingoatsoftware.com/agile/user-stories)): "Como [actor], quiero [capability] para [outcome]". El "para [outcome]" puede omitirse si la US es self-evident.
- **AC limit 6-9 ítems** ([Atlassian](https://www.atlassian.com/work-management/project-management/acceptance-criteria), [AltexSoft](https://www.altexsoft.com/blog/acceptance-criteria-purposes-formats-and-best-practices/)): si tenés 10+ AC, la US es too big y conviene splitear, o el overflow se mueve a "Edge cases" / "Test scenarios".
- **AC cubre edge cases / negative scenarios** ([Atlassian](https://www.atlassian.com/work-management/project-management/acceptance-criteria)): happy path no alcanza. El template separa "Acceptance Criteria" (lo que el sistema hace en el flow esperado) de "Edge cases" (estados inusuales) para que cada uno tenga su propio espacio.
- **Given-When-Then para AC complejos** ([Thoughtworks BDD](https://www.thoughtworks.com/insights/blog/applying-bdd-acceptance-criteria-user-stories), [Gherkin](https://www.parallelhq.com/blog/given-when-then-acceptance-criteria)): la sección "Test scenarios" usa este formato porque mapea 1:1 a tests automatizados (Playwright especs, integration tests).
- **Definition of Ready separada de DoD** ([Pega Academy](https://academy.pega.com/topic/user-story-readiness/v1), [CodeLucky](https://codelucky.com/definition-of-ready-user-stories-sprint/)): la DoR define cuándo una US **entra** a sprint; la DoD cuándo **sale** como Done.

---

## Estructura

```markdown
# US-NNN: <título corto y accionable>

**Status**: Backlog | Sprint actual | Done
**Sprint**: candidato a SX | SX |: 
**Epic**: [EPIC-NN: Nombre](../epics/EPIC-NN.md)
**Priority**: High | Medium | Low
**Effort**: S | M | L
**UC**: [UC-NNN](../use-cases/UC-NNN.md) (si mapea 1:1)
**ADR refs**: [ADR-NNNN](../../decisions/NNNN-titulo.md)

## Como <actor>, quiero <capability> para <outcome>

<1-2 párrafos de contexto: estado actual y porqué el cambio es necesario.>

## Acceptance Criteria

- [ ] AC concreto y verificable.
- [ ] Cada AC es testeable: alguien externo puede leer el AC y saber si está cumplido sin preguntar.
- [ ] Para US con backend + frontend, los AC se agrupan por capa (### Backend / ### Frontend) si suma claridad.

## Out of scope

Esto NO incluye:

- <Cosa que un lector razonable podría asumir incluida pero no lo está.>
- <Otra cosa diferida a una US separada (linkear US-MMM si existe).>
- <Limitación intencional, ej. "mobile completo (decisión cross-cutting ADR-0041)".>

## Edge cases

| Caso | Comportamiento esperado |
|---|---|
| <Estado / flujo inusual> | <Qué hace el sistema> |

Categorías típicas a considerar (no todas aplican siempre):

- **Flujo abandonado**: user cierra browser mid-flow, refresh mid-acción, back button.
- **Network failures**: 4xx específicos del backend, 500, timeout, offline.
- **Concurrencia**: dos tabs editando, doble submit, race del action.
- **Navegación inválida**: deep link a paso intermedio sin pre-condition cumplida.
- **Auth state mid-flow**: sesión expira durante la acción.
- **Data vacía / inconsistente**: catálogo sin entries, soft-deleted, draft vs active.
- **Cross-field validation**: combinaciones inválidas que no caen en validators per-field.
- **A11y**: keyboard-only, screen reader, focus management.
- **Time-based**: timezone, expirations cruzando bordes, DST.

No es obligatorio listar las 9 categorías: solo las que aplican a este US. Si alguna no aplica, omitir.

## Test scenarios

### Críticos (Given-When-Then)

1. **Given** <pre-condition> **When** <acción> **Then** <outcome esperado>.
2. ...

Estos escenarios se traducen 1:1 a tests E2E o integration. Sirven como source-of-truth para QA y para el dev que escribe los specs.

### Cobertura por capa (referencia, no lista exhaustiva)

- **Unit / domain** (xUnit / vitest): <reglas del dominio que se testean acá>
- **Integration** (xUnit + WebApplicationFactory / vitest + fetch mock): <endpoints, repos>
- **E2E** (Playwright): <flow cross-stack si la US lo requiere>

Pirámide formal en [ADR-0036](../../decisions/0036-testing-pyramid-cross-stack.md). Regla dura: subir un nivel sólo si el inferior no alcanza.

## Sub-tasks

### Backend

- [ ] <Sub-task técnica concreta.>

### Frontend

- [ ] <Sub-task técnica concreta.>

### Infra / tooling

- [ ] <Si aplica.>

## Notas de implementación

- **<Decisión técnica no obvia>**: <justificación.>
- **<Deuda diferida explícita>**: <qué se difiere y a qué US / ADR / hito.>

## Dependencies

- **Bloquea a**: US-MMM (esta US tiene que mergear antes que aquella).
- **Depende de**: US-XXX (esta US no puede arrancar hasta que aquella esté Done).
- **Relacionada con**: US-YYY (no bloquea ni es bloqueada, pero se afecta).

## Refs

- DoD: [Definition of Done](../definition-of-done.md)
- Mockup: <link a canvas v2 sección X o filename JSX en docs/design/reference/>
- Use case: [UC-NNN](../use-cases/UC-NNN.md) (si aplica)
- ADRs: [ADR-NNNN](../../decisions/NNNN-titulo.md)
- US relacionadas: [US-MMM](US-MMM.md)
```

---

## Definition of Ready (DoR)

Una US está lista para entrar a sprint cuando:

- [ ] **AC** completos, cada uno verificable, **6-9 ítems max** (más sugiere splitear).
- [ ] **Out of scope** declarado explícito.
- [ ] **Edge cases** identificados (al menos los obvios para flujo, network, auth state).
- [ ] **Test scenarios** críticos en Given-When-Then.
- [ ] **Dependencies** identificadas y resueltas o explícitamente diferidas. Si la US depende de otra US no Done, la dependencia bloquea (no entra a sprint hasta que se cierre o se difiera explícito).
- [ ] **Mockup** linkeado para US con UI.
- [ ] **Sub-tasks** desglosadas por capa.

Una US en Backlog que solo tiene AC + sub-tasks NO está Ready para sprint todavía: eso es backfill que se hace al planificar el sprint.

DoD (post-implementación) sigue en [`definition-of-done.md`](definition-of-done.md). DoR (pre-sprint) vive acá porque depende del shape de la US, no del shape del código.

## Cuándo NO aplicar el template completo

Algunas US son lo suficientemente chicas o mecánicas como para que las secciones nuevas sean overhead. Saltar sin culpa cuando:

- **US de tooling pura** (`-t`): tipo "agregar lefthook hook X". Edge cases y test scenarios pueden quedar implícitos en el sub-task.
- **US de infra one-shot**: tipo "crear migration Y". Los edge cases son del runtime de EF, no nuestro problema.
- **US de docs pura**: actualizar un ADR, escribir glosario. No hay edge cases del usuario.
- **US foundational del Sprint 0**: ya están Done retroactivas y no tienen sentido backfillear.

Para todo lo demás (US con flow, UI, backend con state, integration cross-BC), el template completo aplica.

---

## Cómo backfillear US existentes

Las 50 US del backlog NO se backfillean preventivamente. Se actualizan **cuando entran a sprint**, como parte del planning del sprint. Esto evita gastar tiempo refinando US que pueden cambiar de scope o ser descartadas antes de implementarse.

Sí backfilleadas (template completo aplicado): las US del sprint actual.

---

Actualizado: 2026-05-05.
