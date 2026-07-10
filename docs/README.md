# Documentación

Esta carpeta organiza toda la documentación del proyecto planb, agrupada por propósito.

## Estructura

| Directorio / doc | Contiene |
|---|---|
| [`decisions/`](decisions/) | Decision Records (ADRs), decisiones de diseño con alternativas consideradas. |
| [`domain/`](domain/) | Modelo del negocio, independiente de la tecnología: [ubiquitous-language](domain/ubiquitous-language.md), actores + casos de uso ([use-cases/](domain/use-cases/)), **user stories** ([user-stories.md](domain/user-stories.md) + [user-stories/](domain/user-stories/), [plantilla](domain/us-template.md), [Definition of Done](domain/definition-of-done.md)), **epics** ([epics.md](domain/epics.md) + [epics/](domain/epics/)), modelo táctico ([tactical/](domain/tactical/): aggregates + projections), lifecycles y [personas](domain/personas.md). |
| [`architecture/`](architecture/) | Diseño técnico: [data-model](architecture/data-model.md) (ERD), [redis-key-patterns](architecture/redis-key-patterns.md). |
| [`design/`](design/) | Source-of-truth visual: paleta, tipografía, primitivas, layouts. Mockups vendoreados + screenshots en [reference/](design/reference/). |
| [`testing/`](testing/) | Convenciones de testing cross-stack ([conventions.md](testing/conventions.md)). |
| [`operations/`](operations/) | Playbooks operativos (rollback, git-workflow) + [lessons-learned.md](operations/lessons-learned.md). |
| [`STATUS.md`](STATUS.md) | Tracker operativo por sprints (cadencia, foco, estado). El backlog vivo + status se trackean en Notion; este doc es la narrativa. |

## Cuándo va cada cosa

- **Nueva user story / epic** → `domain/user-stories/US-NNN.md` (plantilla: `us-template.md`); trackear también en Notion (DB `plan-b: Tasks`) y linkear vía `Doc link`. Convenciones de numeración + sprint en `domain/user-stories.md` y `STATUS.md`.
- **Decisión con alternativas reales** → `decisions/NNNN-titulo.md`.
- **Definición de término del dominio** → `domain/ubiquitous-language.md`.
- **Flow de negocio** (ciclo de vida de una entidad, flujo de moderación, etc.) → `domain/<nombre-del-flow>.md`.
- **Diagrama o descripción técnica** (ERD, topología, arquitectura) → `architecture/<nombre>.md`.
- **Checklist operativo** (pre-deploy, post-incident) → `docs/<checklist>.md` directo.
- **Código viejo/archivado que se preserva** → `reference/<nombre>.md`.

## Qué NO va acá

- Facts derivables del código (shape de entidades, imports, dependencias) → el código mismo.
- Preferencias personales del desarrollador o del tooling → fuera del repo (dotfiles, configuración local del editor, etc.).
- Cambios operativos (migraciones aplicadas, versiones instaladas) → `CHANGELOG.md` cuando exista.

## Documentos externos referenciados

- **Documento de presentación del proyecto** entregado al docente. Contiene el planteo inicial del problema, la solución propuesta y el MVP. Algunas decisiones se refinaron al bajar a diseño; los cambios relevantes quedan registrados en los ADRs correspondientes. No se incluye en este repositorio por no formar parte del código fuente.
