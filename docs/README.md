# Documentación

Esta carpeta organiza toda la documentación del proyecto planb, agrupada por propósito.

## Estructura

| Directorio / doc | Contiene |
|---|---|
| [`decisions/`](decisions) | Decision Records (ADRs), decisiones de diseño con alternativas consideradas. |
| [`domain/`](domain) | El producto, independiente de la tecnología: [la tesis](THESIS.md) manda; el [glosario](domain/ubiquitous-language.md), las [personas](domain/user-personas.md), el [catálogo de stories](domain/user-stories.md) con sus fichas `US-NNN`, el [template de US](domain/us-template.md) y el [Definition of Done](domain/definition-of-done.md). |
| [`reviews/`](reviews) | Revisiones y auditorías: un registro por revisión, cada hallazgo con ID y estado (resuelto, cerrado, pendiente, descartado). Los ADRs y las stories los citan por ID. |
| [`history/`](history) | El ático: lo que describía la versión anterior (actores y casos de uso, ciclos de vida, event storming, agregados, épicas y glosario v1). No se edita; se va con el código que describe. |
| [`architecture/`](architecture) | Diseño técnico: [data-model](architecture/data-model.md) (ERD), [redis-key-patterns](architecture/redis-key-patterns.md). |
| [`design/`](design) | Cómo se ve y cómo se recorre: [design-system](design/design-system.md) (el contrato visual: paleta, tipografía, tokens), [screens/](design/screens/README.md) (una ficha por pantalla con su boceto), `flows/` (los flujos como diagramas), [product-map](design/product-map.md) (el índice de pantallas y flujos, orientativo) y [map/](design/map/README.md) (el canvas del que sale todo, orientativo). |
| [`testing/`](testing) | Convenciones de testing cross-stack ([conventions.md](testing/conventions.md)). |
| [`operations/`](operations) | Playbooks operativos (rollback, git-workflow) + [lessons-learned.md](operations/lessons-learned.md). |
| [`THESIS.md`](THESIS.md) | La tesis del producto: qué es, qué no hace, la posición tomada. Todo lo demás se lee contra esto. |
| [`STATUS.md`](STATUS.md) | Tracker operativo por sprints (cadencia, foco, estado). Es el tracker: el backlog vivo es el catálogo de stories y el status de cada US vive en su ficha. |

## Cuándo va cada cosa

- **Nueva user story / epic** → `domain/user-stories/US-NNN.md` (plantilla: `us-template.md`), con su `Status` en el header; el sprint en `STATUS.md`. Convenciones de numeración + sprint en `domain/user-stories.md` y `STATUS.md`.
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
