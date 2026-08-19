# Documentación

Esta carpeta organiza toda la documentación del proyecto planb, agrupada por propósito.

## Estructura

| Directorio / doc | Contiene |
|---|---|
| [`decisions/`](decisions) | Decision Records (ADRs), decisiones de diseño con alternativas consideradas. |
| [`domain/`](domain) | El producto, independiente de la tecnología: [la tesis](THESIS.md) manda; el [glosario](domain/ubiquitous-language.md), el [catálogo de frases](domain/phrases.md) (las que se ofrecen para marcar, con sujeto y eje), las [personas](domain/user-personas.md), el [catálogo de stories](domain/user-stories.md) con sus fichas `US-NNN`, el [template de US](domain/us-template.md) y el [Definition of Done](domain/definition-of-done.md). |
| [`epics/`](epics) | La unidad vertical del producto: una carpeta por épica (lo que una persona viene a hacer) con sus stories (la letra completa, única copia), sus decisiones, su flujo en mermaid y las pantallas que solo existen para ella, con ficha y boceto ([ADR-0070](decisions/0070-product-docs-group-by-epic-one-story-per-epic-screens-owned-or-shared-and-design-as-text.md)). |
| [`reviews/`](reviews) | Revisiones y auditorías: un registro por revisión, cada hallazgo con ID y estado (resuelto, cerrado, pendiente, descartado). Los ADRs y las stories los citan por ID. |
| [`history/`](history) | El ático: lo que describía la versión anterior (actores y casos de uso, ciclos de vida, event storming, agregados, épicas y glosario v1). No se edita; se va con el código que describe. |
| [`architecture/`](architecture) | Diseño técnico: [data-model](architecture/data-model.md) (ERD), [redis-key-patterns](architecture/redis-key-patterns.md). |
| [`design/`](design) | Cómo se ve y cómo se recorre: [design-system](design/design-system.md) (el contrato visual: paleta, tipografía, tokens), [screens/](design/screens/README.md) (una carpeta por pantalla, con su ficha y su boceto), [product-map](design/product-map.md) (el índice de pantallas y flujos, orientativo) y [map/](design/map/README.md) (el canvas del que sale todo, orientativo). |
| [`testing/`](testing) | Convenciones de testing cross-stack ([conventions.md](testing/conventions.md)). |
| [`operations/`](operations) | Playbooks operativos (rollback, git-workflow) + [lessons-learned.md](operations/lessons-learned.md). |
| [`THESIS.md`](THESIS.md) | La tesis del producto: qué es, qué no hace, la posición tomada. Todo lo demás se lee contra esto. |
| [`STATUS.md`](STATUS.md) | Tracker operativo por sprints (cadencia, foco, estado). Es el tracker: el backlog vivo es el catálogo de stories y el status de cada US vive en su ficha. |

## Cuándo va cada cosa

- **Nueva user story / epic** → `domain/user-stories/US-NNN.md` (plantilla: `us-template.md`), con su `Status` en el header; el sprint en `STATUS.md`. Convenciones de numeración + sprint en `domain/user-stories.md` y `STATUS.md`.
- **Decisión con alternativas reales** → `decisions/NNNN-titulo.md`.
- **Definición de término del dominio** → `domain/ubiquitous-language.md`.
- **Flujo de una épica** (persona, disparador, pasos, salidas) → `epics/<epic>/flow.md`, en mermaid; la ficha y el boceto de una pantalla, en `epics/<epic>/screens/<screen>/` si solo esa épica la usa, o en `design/screens/<screen>/` si la componen varias; la letra de una story, en el README de su épica.
- **Diagrama o descripción técnica** (ERD, topología, arquitectura) → `architecture/<nombre>.md`.
- **Checklist operativo** (pre-deploy, post-incident) → `docs/<checklist>.md` directo.
- **Lo que describía la versión anterior** → `history/`, sin editar.
- **Idioma**: la prosa va en español rioplatense con su ortografía (ñ, tildes); los nombres de carpeta y archivo, los slugs y los títulos de una línea (ADR, commit, branch) van en inglés en kebab-case, como todo identificador del repo ([`decisions/README.md`](decisions/README.md), [`operations/git-workflow.md`](operations/git-workflow.md)). Un nombre visible va en español en el texto y en inglés en el path: Ficha de cátedra vive en `design/screens/chair/`, Reseñar en `epics/write-a-review/`. Castellano sin ñ ni tildes como identificador no es ninguno de los dos idiomas.

## Qué NO va acá

- Facts derivables del código (shape de entidades, imports, dependencias) → el código mismo.
- Preferencias personales del desarrollador o del tooling → fuera del repo (dotfiles, configuración local del editor, etc.).
- Cambios operativos (migraciones aplicadas, versiones instaladas) → `CHANGELOG.md` cuando exista.

## Documentos externos referenciados

- **Documento de presentación del proyecto** entregado al docente. Contiene el planteo inicial del problema, la solución propuesta y el MVP. Algunas decisiones se refinaron al bajar a diseño; los cambios relevantes quedan registrados en los ADRs correspondientes. No se incluye en este repositorio por no formar parte del código fuente.
