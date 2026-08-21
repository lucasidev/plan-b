# Documentación

Cinco carpetas, y **cada una responde una pregunta distinta**. Si no se puede decir qué pregunta responde una carpeta, no existe.

| | Pregunta | Contiene |
|---|---|---|
| [`THESIS.md`](THESIS.md) | **¿qué es y qué no hace?** | La tesis del producto y la posición que toma. Todo lo demás se lee contra esto. |
| [`product/`](product) | **¿qué hace y para quién?** | El producto entero: las [personas](product/personas.md), el [glosario](product/language.md), las [frases](product/phrases.md), el [lenguaje visual](product/design-system.md), y una carpeta por **épica**, con sus stories, su flujo y sus pantallas adentro. |
| [`engineering/`](engineering) | **¿cómo está construido?** | El [modelo de datos](engineering/data-model.md), las [claves de Redis](engineering/redis-key-patterns.md), las [convenciones de testing](engineering/testing.md) y los playbooks: [git](engineering/git-workflow.md), [rollback](engineering/rollback.md), [deploy](engineering/deploy.md), [lecciones](engineering/lessons-learned.md). |
| [`decisions/`](decisions) | **¿por qué?** | Los ADRs, en orden cronológico. Antes de decidir algo estructural, buscar si ya hay uno. |
| [`plan/`](plan) | **¿cuándo, y cuándo está listo?** | El tracker desde que Notion se soltó: los [sprints](plan/status.md) con el trabajo de cada story, el [Definition of Done](plan/definition-of-done.md) y el [formato de una story](plan/story-template.md). |
| [`history/`](history) | **¿qué fue?** | El ático: todo lo que describía la versión anterior, incluidas sus 126 fichas, sus casos de uso y las revisiones ya cerradas. No se edita; se va con el código que describe. |

## La unidad de `product/` es la épica

Una **épica** es lo que alguien viene a hacer: Reseñar, Replicar, Moderar. Son catorce, y cada una contiene **todo lo suyo**, cortado en vertical:

```
product/
├── personas.md            para quién es el producto
├── language.md            el glosario
├── phrases.md             las frases que se ofrecen para marcar
├── design-system.md       el lenguaje visual
└── write-a-review/                          una carpeta por épica
    ├── README.md                            qué es, para quién, el índice de sus stories
    ├── flow.md                              el recorrido, en mermaid
    ├── stories/
    │   ├── US-153-review-in-under-five-minutes.md
    │   └── ...                              una story por archivo, con su criterio
    └── screens/SC-015-write-review/
        ├── README.md                        la ficha de la pantalla
        └── sketch.html                      el boceto
```

Arriba, lo que es del producto entero y no se puede cortar sin duplicarlo (Lucía aparece en cinco épicas, el glosario en las catorce). Abajo, cada épica con lo que solo le pertenece a ella.

**La flecha va en una sola dirección**: `plan/` cita a `product/` por ID y nunca copia el texto. La story no sabe en qué sprint va.

## Cuándo va cada cosa

- **Una story nueva** → `product/<épica>/stories/US-NNN-slug.md`, con su "listo cuando", más su fila en el índice del README de esa épica. El formato y las reglas del ID están en [`plan/story-template.md`](plan/story-template.md).
- **Un requisito no funcional** (accesibilidad, legales, rendimiento) → las Restricciones de [`product/README.md`](product/README.md). No son stories: se verifican en el DoD, en todas.
- **Planificar trabajo** → la sección del sprint en [`plan/status.md`](plan/status.md), citando el ID de la story y agregando lo de ejecución: contrato técnico, tareas, estado.
- **Trabajo técnico sin producto atrás** (migrar EF, arreglar el CI) → una tarea en [`plan/status.md`](plan/status.md), sin ID de producto.
- **Decisión con alternativas reales** → `decisions/NNNN-titulo.md`.
- **Término del negocio** → [`product/language.md`](product/language.md).
- **Flujo de una épica** → `product/<épica>/flow.md`, en mermaid. La ficha y el boceto de una pantalla, en `product/<épica>/screens/<screen>/` de la épica que la hace existir.
- **Diagrama o descripción técnica** → [`engineering/`](engineering).
- **Lo que describía la versión anterior** → [`history/`](history), sin editar.
- **Idioma**: la prosa va en español rioplatense con su ortografía (ñ, tildes); los nombres de carpeta y archivo, los slugs y los títulos de una línea (ADR, commit, branch) van en inglés en kebab-case, como todo identificador del repo ([`decisions/README.md`](decisions/README.md), [`git-workflow.md`](engineering/git-workflow.md)). Un nombre visible va en español en el texto y en inglés en el path: Ficha de cátedra vive en `product/choose-where-to-study/screens/SC-002-chair/`, Reseñar en `product/write-a-review/`. Castellano sin ñ ni tildes como identificador no es ninguno de los dos idiomas.

## Qué NO va acá

- Hechos derivables del código (shape de entidades, imports, dependencias) → el código mismo.
- Preferencias personales del desarrollador o del tooling → fuera del repo.
- Cambios operativos (migraciones aplicadas, versiones instaladas) → `CHANGELOG.md`.
- Índices que duplican lo que la estructura de carpetas ya dice: se generan o no existen.

## Documentos externos referenciados

- **Documento de presentación del proyecto** entregado al docente. Contiene el planteo inicial del problema, la solución propuesta y el MVP. Algunas decisiones se refinaron al bajar a diseño; los cambios relevantes quedan registrados en los ADRs correspondientes. No se incluye en este repositorio por no formar parte del código fuente.
