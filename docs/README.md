# Documentación

Esta carpeta organiza toda la documentación del proyecto planb, agrupada por propósito.

## Estructura

| Directorio | Contiene | Estado |
|---|---|---|
| [`decisions/`](decisions/) | Decision Records (ADRs): decisiones de diseño con alternativas consideradas. | 34 ADRs |
| [`domain/`](domain/) | Modelo conceptual del negocio independiente de la tecnología: lenguaje, lifecycles, casos de uso. | 5 docs ([ubiquitous-language](domain/ubiquitous-language.md), [actors-and-use-cases](domain/actors-and-use-cases.md), [review-lifecycle](domain/review-lifecycle.md), [enrollment-lifecycle](domain/enrollment-lifecycle.md), [verification-flows](domain/verification-flows.md)) |
| [`architecture/`](architecture/) | Diseño técnico: ERD, capas del backend, estructura del frontend, API, deploy. | 2 docs ([data-model](architecture/data-model.md), [redis-key-patterns](architecture/redis-key-patterns.md)) |
| [`design/`](design/) | Source-of-truth visual: paleta, tipografía, primitivas, layouts macro. El mockup original vendoreado + README explicando cómo se mapea a `frontend/`. | [reference/](design/reference/) |
| `reference/` | Especificaciones externas o modelos archivados que conviene preservar. | Vacío |

## Cuándo va cada cosa

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
