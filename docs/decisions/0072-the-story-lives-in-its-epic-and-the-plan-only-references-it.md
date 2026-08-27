# ADR-0072: The story lives in its epic, the plan only references it, and the ID never changes

- **Estado**: aceptado
- **Fecha**: 2026-08-19 (reescrito el 2026-08-20, antes de pushear)

## Contexto

Al cortar la documentación en vertical ([ADR-0070](0070-product-requirements-are-vertical-by-capability-and-design-is-text.md)) quedó una pregunta sin cerrar: dónde vive la user story, y qué relación tiene con el aparato de planificación heredado (`US-NNN`, sprints, Status).

El primer intento partió la story en dos artefactos: la letra en la carpeta de producto (llamándola "requisito") y una ficha `US-NNN` en la carpeta de planificación que la citaría por ID. Se justificó con la literatura ágil, que dice que las user stories **no son requisitos** sino tarjetas para conversar (las 3C de Ron Jeffries, 2001; [Cohn](https://www.mountaingoatsoftware.com/agile/user-stories): "just placeholders for a future conversation"), y que usarlas como documentación permanente entierra los requisitos en años de tickets ([Scrum.org](https://www.scrum.org/resources/blog/are-user-stories-requirements)).

El error fue la conclusión, no la premisa: **una fila que dice "Como quien está cursando, quiero reseñarla en menos de cinco minutos, porque si me lleva más no lo hago nunca" con su criterio de aceptación ya es una user story**. Llamarla "requisito" y crear al lado una segunda ficha con el mismo ID no elimina duplicación: la inventa, con dos nombres para la misma cosa en dos carpetas distintas. Lo que sí hay que separar no es la story del requisito: es **la story del estado de gestión**.

Y había una segunda deuda, medida sobre las 126 fichas de la versión anterior:

- **39 de 126 (31%) se renumeraron al planificarse.** El parent se reemplazaba por sus subdivisiones (`US-045` pasaba a `US-045-a` … `-e`) y quedaban fichas huecas: *"Subdividida. No se trackea acá: el estado real vive en …"*. Cuatro terminaron así.
- **Los sufijos significaban dos cosas a la vez.** `US-037-b` era backend; `US-044-b` era la segunda parte. Ocho sufijos distintos en circulación (`-b`, `-f`, `-i`, `-a`…`-e`, `-bis`), y `-i` documentado como "integrated" pero usado también como "infra".
- **El ID heredado del mapa tampoco servía**: el prefijo de grupo (`O4-1`, `T2-1`) decía a qué grupo del canvas pertenecía la story, y **en el 24% de los casos ya no coincidía con la épica donde vivía**: siete de las diecinueve de Reseñar tenían prefijo `T2`, `T3` o `T4`.

## Decisión

**La story es una sola, vive en su épica, y el plan solo la referencia.**

1. **La story vive en `docs/product/<epic>/stories/US-NNN-slug.md`**, un archivo por story. Dice quién la pide, qué quiere, por qué, y su criterio de aceptación ("listo cuando"). Nada más.
2. **La story no tiene estado de gestión.** Ni Status, ni Sprint, ni Effort, ni tareas, ni contrato técnico. Todo eso describe el trabajo, no el producto, y vive en [`docs/plan/status.md`](../plan/status.md), citando el ID.
3. **La referencia va en una sola dirección**: el plan cita al producto, nunca al revés. Si al planificar aparece un comportamiento que la story no tenía, la story está incompleta y se arregla en la story.
4. **El ID es `US-NNN` y no cambia nunca**: ni al moverse de épica, ni al reescribirse, ni al repriorizarse. Es lo que citan el commit, la branch, el test y el PR.
5. **El ID no lleva semántica adentro.** Ni el grupo, ni la capa, ni la partición, ni la prioridad: todo lo que se codifica en un ID se vuelve mentira cuando cambia, y acá ya se volvió mentira dos veces. El nombre del archivo suma un **slug descriptivo** (`US-127-review-in-under-five-minutes`), igual que los ADRs de este repo: el número identifica, el slug dice de qué trata, y la épica la dice la carpeta. El slug se congela al crear.
6. **La story no se parte por razones de ejecución.** Si es grande, se planifica en varias tareas y el ID no se toca. Se parte solo si describía dos cosas distintas, o sea si estaba mal escrita, y entonces son dos stories nuevas y la vieja se marca superada. La capa (backend, frontend, infra) es un atributo de la tarea, no del identificador.
7. **El criterio de aceptación es la fuente del test.** Cada "listo cuando" se traduce al test que lo verifica ([ADR-0036](0036-testing-pyramid-cross-stack.md)) y el test cita el ID. Un criterio que no se puede traducir a test está mal escrito ([living documentation](https://gojko.net/books/specification-by-example/)).
8. **Lo que no es una story no se disfraza de story.** Los requisitos no funcionales (accesibilidad, Ley 25.326, moderación pública, rendimiento) son las Restricciones de [`product/README.md`](../product/README.md) y se verifican en el Definition of Done, en cada story. El trabajo técnico sin producto atrás (migrar EF, arreglar el CI, la poda) es una tarea de sprint sin ID de producto.

## Alternativas consideradas

**A. La letra en producto y una ficha `US-NNN` aparte en el plan** (el primer intento). Dos artefactos para la misma story, con dos nombres, en dos carpetas. Se presentó como eliminación de duplicación y era su creación. Descartada.

**B. Toda la story en el plan, con su estado adentro** (el modelo de la v1). Es lo que enterró los requisitos: para saber qué tiene que hacer el producto había que leer 126 fichas de trabajo con su historial de sprints encima, y el 31% renumeradas. Descartada.

**C. Conservar el ID del mapa (`O4-1`) como identificador.** Ya mentía en el 24% de las stories, porque el prefijo de grupo dejó de coincidir con la épica. Se conserva **adentro** del archivo (`Del mapa: O4-1`) para no perder la trazabilidad con el canvas, pero no como identidad. Descartada como ID.

**D. Reiniciar la numeración en `US-001`.** Colisiona con las 126 de la versión anterior, que el código cita 889 veces en 559 archivos: dos `US-018` distintas harían ambiguo leer el código y el historial. La numeración nueva arranca en `US-127`. Descartada.

**E. Mantener los sufijos de capa (`-b`, `-f`, `-i`).** Es lo que produjo el sufijo con dos significados. La capa es un dato de la tarea y va en la tarea. Descartada.

## Consecuencias

- **Las 93 stories pasan a ser 93 archivos** en `product/<epic>/stories/`, renumeradas `US-127` a `US-219`, cada una con su ID del mapa adentro. El README de cada épica queda como índice: link y de qué trata, sin repetir el texto.
- **`backlog.md` desaparece.** Era una tabla con el Status de cada story copiado: una segunda copia que hay que sincronizar a mano, o sea el drift que este ADR viene a evitar. Si hace falta la vista completa, se genera.
- **El template se rehace** como [`plan/story-template.md`](../plan/story-template.md), con las dos formas separadas: la de la story y la de su planificación.
- **Las 126 fichas de la versión anterior van al ático**, con sus 48 use cases y sus 12 épicas, que ya estaban ahí.
- **El Definition of Done pasa a `plan/`** (es proceso, no dominio) y obliga a corregir la story cuando el trabajo cambió lo que el producto hace.
- **`check-docs.ts` valida lo nuevo**: que cada story tenga su archivo, que su ID no esté duplicado, y que el índice de su épica la liste.

## Refs

- Ron Jeffries, las 3C (2001); [Mike Cohn](https://www.mountaingoatsoftware.com/agile/user-stories) sobre la story como marcador de una conversación; [Scrum.org](https://www.scrum.org/resources/blog/are-user-stories-requirements) sobre el backlog como documentación permanente; [Gojko Adzic, *Specification by Example*](https://gojko.net/books/specification-by-example/) sobre el criterio como test; Cyrille Martraire, *Living Documentation*, sobre una sola fuente con referencias y nunca copias.
- [ADR-0070](0070-product-requirements-are-vertical-by-capability-and-design-is-text.md) (el corte vertical y las cinco carpetas), [ADR-0036](0036-testing-pyramid-cross-stack.md) (qué test para qué cosa), [ADR-0026](0026-git-workflow-github-flow-with-rebase.md) (la rama y el PR que citan el ID), [ADR-0074](0074-the-changelog-is-generated-on-demand-not-appended-on-every-push.md) (el changelog que sale de los commits).
