# ADR-0070: Product docs group by epic, with stories as the single source, screens as the shared inventory, and design artifacts as text

- **Estado**: aceptado
- **Fecha**: 2026-08-18

## Contexto

El código de planb está cortado en vertical: un slice por caso de uso (`Features/` en el backend, `features/` en el frontend) y las páginas que los componen (`app/`). La documentación del producto, en cambio, quedó agrupada por tipo: las stories en un archivo, las personas en otro, las pantallas en `design/`, los flujos como filas de una tabla en el mapa, las decisiones en `decisions/`. Un cambio chico ("el reporte confirma el mail") toca seis archivos, y cada uno hay que encontrarlo a mano; y lo que viene de UX (bocetos, flujos) no tenía dónde vivir con trazabilidad: las capturas de la versión anterior eran imágenes que nadie podía diffear ni corregir, y drifteaban.

Antes de decidir se miró qué hace la industria. Tres cosas:

- **La jerarquía de trabajo** cambia de nombre según el marco, y "feature" choca tres veces. En SAFe, Epic (portfolio, varios PIs) > Capability > **Feature (lo que entra en un PI: un conjunto de stories)** > Story (una iteración) ([SAFe hierarchy](https://www.enov8.com/blog/the-hierarchy-of-safe-scaled-agile-framework-explained/), [feature vs capability vs epic](https://agileseekers.com/blog/popm-guide-to-feature-capability-epic)). En Scrum y Jira, Epic > Story, y "feature" no es formal ([monday.com](https://monday.com/blog/rnd/agile-epic-vs-feature/)). En el story mapping de Jeff Patton, el backbone son **actividades** del usuario con tareas y stories debajo, y Mike Cohn llama épicas a esas actividades ([Easy Agile](https://www.easyagile.com/blog/the-ultimate-guide-to-user-story-maps)). En nuestro código, "feature" es el slice de un caso de uso. La única palabra que no choca es **épica**.
- **La documentación de producto** se organiza por área funcional cuando las capacidades son diferenciadas, o por elementos de la interfaz cuando la interfaz es compleja, o por tarea o rol; **y se linkea generosamente entre cortes**, porque cada uno deja algo afuera ([Archbee](https://www.archbee.com/blog/product-documentation-structuring)). Los entregables estándar de UX son el sitemap (la estructura de pantallas) y los user flows (los recorridos), complementarios ([Toptal](https://www.toptal.com/designers/ux/10-common-ux-deliverables), [Slickplan](https://slickplan.com/blog/user-flow-vs-sitemap)).
- **Docs-as-code**: texto plano versionado, plantillas comunes, y lo visual generado desde texto ([GitBook](https://www.gitbook.com/blog/what-is-docs-as-code), [Kong](https://konghq.com/blog/learning-center/what-is-docs-as-code)).

## Decisión

1. **La unidad vertical de la documentación de producto es la épica**: lo que una persona viene a hacer, en el sentido de la actividad de un story map (no la épica de portfolio de SAFe). Coinciden con los grupos del mapa de producto (O1 a O8, T1 a T4, BO1 a BO6). Cada épica es una carpeta en `docs/epics/<epica>/` con `README.md` (qué es, para quién, las stories que la componen por ID, las decisiones que aplica, las pantallas que compone, su estado y sus sprints), `flow.md` (el o los flujos en mermaid: persona, disparador, pasos, salidas y errores, con las stories que cubre) y `sketches/` (los pasos que solo existen para esa épica). `docs/epics/README.md` es el índice.
2. **La story sigue siendo la fuente única**, en el catálogo `docs/domain/user-stories.md` y en su ficha `US-NNN` al entrar a sprint. Las épicas la citan por ID; nunca la copian. Story, épica y feature de código son tres unidades: la épica agrupa stories; una story se implementa en uno o más slices de código cuando entra a sprint.
3. **La pantalla compartida es el inventario** (el sitemap): `docs/design/screens/<screen>/` con `README.md` (la ficha: quién la usa, qué stories resuelve, qué muestra, estados, acciones, adónde va, slug) y `sketch.html`. Una pantalla la componen varias épicas, como una page compone features; la ficha lista cuáles.
4. **Todo artefacto de diseño es texto en el repo**: los bocetos son HTML autocontenido con los tokens del design system (mid-fi, y hi-fi en el mismo archivo para las pantallas que definen el producto: git guarda el mid-fi); los flujos son mermaid en markdown. **Ninguna imagen es fuente**: si hace falta una captura, se genera desde el HTML con el pipeline de Playwright a una carpeta de derivados que se regenera y no se edita.
5. **Lo transversal sigue transversal y único**: la tesis, el glosario, las personas, el catálogo de frases, el catálogo de stories, los ADRs, las revisiones. Ahí no hay slice posible sin duplicar.
6. **La regla de dónde va cada cosa**: si existe solo para una épica (un paso, su flujo, su boceto), va en su carpeta; si lo comparten varias (una ficha pública, una story, un término), va en su lugar transversal y la épica lo cita. **Trazabilidad en las dos direcciones**: la ficha de pantalla lista sus épicas y stories; la épica lista sus pantallas; el estado de una ficha (borrador, revisada, hi-fi, construida con su `US-NNN`) está en su README; y las revisiones dejan registro en `docs/reviews/`.
7. **Los nombres de carpeta y archivo van en inglés, en kebab-case**, como todo identificador del repo (el corte de [`decisions/README.md`](README.md) y de [`git-workflow.md`](../operations/git-workflow.md): título, path y slug son identificadores; la prosa es español rioplatense con su ortografía). El nombre visible de la épica o la pantalla va en español en el texto (Reseñar, Ficha de cátedra) y en inglés en el path (`epics/write-a-review/`, `screens/chair/`). Nunca castellano sin ñ ni tildes como identificador: no es ninguno de los dos idiomas.

## Alternativas consideradas

**A. Seguir agrupando por tipo** (stories, pantallas, flujos, cada uno en su lugar), que es lo que había. Es lo que hace que un cambio de capacidad toque seis archivos y que la UX no tenga casa. Descartada; se conserva solo para lo transversal, donde es lo correcto.

**B. Agrupar por feature de código** (una carpeta de docs por slice de caso de uso). Demasiado fino: un flujo atraviesa varios casos de uso, y el nombre "feature" ya significa eso en el código y otra cosa en SAFe. Descartada.

**C. Un documento por pantalla y nada más** (la propuesta anterior a esta). Deja los flujos sin dueño y confunde la página con la capacidad: la Ficha de cátedra la usan cinco épicas. Descartada; la pantalla queda como inventario compartido.

**D. Imágenes o herramientas externas como fuente** (capturas, Claude Design, Figma). Es lo que drifteó en la versión anterior y lo que no se puede diffear ni corregir en un PR. Descartada; sirven para explorar, no como fuente.

## Consecuencias

- **Las épicas quedan resueltas por construcción**: son las carpetas; `docs/domain/epics.md` deja de existir y `docs/epics/README.md` es el índice. La primera épica escrita completa es Reseñar (`docs/epics/write-a-review/`).
- **Las fichas de pantalla existentes se mueven a su carpeta** (Ficha de cátedra); el boceto del testimonio va con Reseñar (era el paso del comentario y la lectura del testimonio; la lectura ya vive en la Ficha de cátedra).
- **`product-map.md` queda como índice** de pantallas y flujos, con la tabla pantalla → slug; el canvas se va al ático cuando todo esté absorbido.
- **El template de US** apunta la épica a su carpeta y la pantalla a su ficha.
- **Un cambio transversal sigue tocando todo**: eso lo hace barato el chequeo de links y el script de incidencias, no la estructura.

## Refs

- [THESIS.md](../THESIS.md); [ADR-0063](0063-the-product-is-a-pressure-instrument.md) (el viraje); [ADR-0041](0041-rediseño-ux-post-claude-design.md) (el rediseño anterior, cuyas capturas son el antecedente de la alternativa D).
- Fuentes citadas arriba: SAFe (Enov8, AgileSeekers), Scrum/Jira (monday.com), story mapping (Easy Agile), estructura de documentación (Archbee), entregables de UX (Toptal, Slickplan), docs-as-code (GitBook, Kong).
