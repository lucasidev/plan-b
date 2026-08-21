# Plan

**¿Cuándo, y cuándo está listo?** Es el tracker del proyecto desde que Notion se soltó (2026-08-18), y no describe el producto: para eso está [`docs/product/`](../product/README.md), que esto cita por ID.

| Archivo | Qué es |
|---|---|
| [`status.md`](status.md) | Los sprints: cadencia, foco, qué entró y qué quedó, y el trabajo de cada story planificada. El estado del proyecto se lee acá. |
| [`story-template.md`](story-template.md) | Cómo se escribe una story y cómo se planifica: el formato de las dos cosas y las reglas del ID. |
| [`definition-of-done.md`](definition-of-done.md) | Cuándo una story está terminada. Vale para todas, incluidas las restricciones que se sostienen siempre. |

## La separación, en una línea

**La story dice qué quiere el usuario; el plan dice cuándo se hace y cómo va.**

La story vive en su épica, en `product/<épica>/stories/US-NNN-slug.md`, y no tiene estado ni sprint ni estimación. Acá se la cita por ID y se le agrega todo lo de ejecución: en qué sprint entra, en qué tareas se parte, su contrato técnico, su estado.

**La referencia va en una sola dirección**: el plan cita al producto, nunca al revés. Si al planificar aparece un comportamiento que la story no tenía, la story está incompleta y se arregla allá, no acá.

## Las dos reglas que evitan el calvario anterior

1. **El ID no cambia nunca**, y no lleva semántica adentro (ni el grupo, ni la capa, ni la partición). En la versión anterior, `-b` significaba "backend" en unas stories y "segunda parte" en otras, y 4 fichas quedaron huecas apuntando a sus subdivisiones.
2. **La story no se parte por razones de ejecución.** Se parte el trabajo, que es barato y no lo cita nadie desde afuera. 39 de 126 stories de la v1 se renumeraron al planificarlas; eso no vuelve a pasar.

## Lo que no tiene story

El trabajo técnico sin producto atrás (migrar EF, arreglar el CI, la poda del planificador en retiro) es una tarea de sprint: se anota en [`status.md`](status.md), no cita ningún ID de producto, y su commit se identifica con el scope de Conventional Commits.

## Lo que no vive acá

- **Un backlog con el estado copiado de cada story.** Sería una segunda copia que hay que sincronizar a mano. El estado vive en un solo lugar: la sección del sprint donde esa story se está construyendo. Si algún día hace falta la vista completa, se genera.
- **La letra del producto.** Ni el "Como X, quiero Y", ni el criterio de aceptación, ni las pantallas. Todo eso está en la épica.

## Refs

- Las épicas y sus stories: [`docs/product/`](../product/README.md).
- Cómo se decidió esta separación: [ADR-0072](../decisions/0072-the-story-lives-in-its-epic-and-the-plan-only-references-it.md).
- Lecciones operativas del flujo de trabajo: [`docs/engineering/lessons-learned.md`](../engineering/lessons-learned.md).
