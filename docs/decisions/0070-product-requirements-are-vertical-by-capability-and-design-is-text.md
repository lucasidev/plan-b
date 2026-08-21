# ADR-0070: Product requirements are cut vertically by capability, every screen has an owner, and design artifacts are text

- **Estado**: aceptado
- **Fecha**: 2026-08-18 (revisado el 2026-08-19: el corte de pantallas; y el 2026-08-20: el techo de cinco carpetas. Todo antes de pushear)

## Contexto

El código de planb está cortado en vertical: un slice por caso de uso (`Features/` en el backend, `features/` en el frontend) y las páginas que los componen (`app/`). La documentación del producto, en cambio, estaba agrupada por tipo: los requisitos en un archivo, las personas en otro, las pantallas en `design/`, los flujos como filas de una tabla en el mapa, las decisiones en `decisions/`. Un cambio chico ("el reporte confirma el mail") tocaba seis archivos, y lo que venía de UX (bocetos, flujos) no tenía dónde vivir con trazabilidad: las capturas de la versión anterior eran imágenes que nadie podía diffear ni corregir, y drifteaban.

Antes de decidir se miró qué hace la industria. La **jerarquía de trabajo** cambia de nombre según el marco y "feature" choca tres veces: en SAFe es un conjunto de stories dentro de un PI ([SAFe hierarchy](https://www.enov8.com/blog/the-hierarchy-of-safe-scaled-agile-framework-explained/)), en Scrum y Jira no es formal ([monday.com](https://monday.com/blog/rnd/agile-epic-vs-feature/)), y en este repo es el slice de un caso de uso. En el story mapping de Jeff Patton el backbone son **actividades** del usuario ([Easy Agile](https://www.easyagile.com/blog/the-ultimate-guide-to-user-story-maps)). La **documentación de producto** se organiza por área funcional o por tarea, y se linkea generosamente entre cortes ([Archbee](https://www.archbee.com/blog/product-documentation-structuring)); los entregables de UX estándar son el sitemap y los user flows ([Toptal](https://www.toptal.com/designers/ux/10-common-ux-deliverables)). Y **docs-as-code**: texto plano versionado, plantillas comunes, lo visual generado desde texto ([GitBook](https://www.gitbook.com/blog/what-is-docs-as-code), [Kong](https://konghq.com/blog/learning-center/what-is-docs-as-code)).

Un primer corte (2026-08-18) agrupó por "épica" y partió las pantallas en dos: las que una épica usaba sola, adentro; las que usaban varias, en un `docs/design/screens/` compartido. Al día siguiente quedó claro que eso no es verticalidad sino reutilización anticipada: extraer a `shared/` antes de que la duplicación pruebe su forma. Una pantalla que cinco épicas tocan **no es un recurso sin dueño: es una composición**, y cada épica aporta su parte. Como la rama no estaba pusheada, el corte se cerró acá en vez de acumular un ADR que supersede al del día anterior.

## Decisión

**`docs/` se corta en cinco carpetas, cada una responde una pregunta, y adentro de `product/` el corte es vertical por épica.**

1. **Cinco carpetas y la tesis, ni una más.** Si no se puede decir qué pregunta responde una carpeta, no existe: [`product/`](../product/README.md) (¿qué hace y para quién?), [`engineering/`](../engineering) (¿cómo está construido?), [`decisions/`](README.md) (¿por qué?), [`plan/`](../plan/README.md) (¿cuándo?), [`history/`](../history) (¿qué fue?), y [`THESIS.md`](../THESIS.md) arriba de todo. Una carpeta de dos archivos que contesta lo mismo que otra es granularidad sin criterio, y se absorbe.
2. **`docs/product/<epic>/`** es la unidad vertical: **la épica**. Adentro: `README.md` (qué es, para quién, **sus requisitos** con su criterio de aceptación, las decisiones que aplica, sus pantallas, lo que no resuelve), `flow.md` (el proceso en mermaid: persona, disparador, pasos, ramas, salidas y errores) y `screens/<screen>/` (ficha y boceto de cada pantalla que le pertenece).
3. **Lo transversal al producto vive con el producto, no en otra carpeta.** Las personas, el glosario, el catálogo de frases y el design system son de todas las épicas y de ninguna: van sueltos en `product/`, al lado de las catorce carpetas. "Transversal" significa que no se corta por épica; **no** significa que se muda a otra carpeta con otro criterio. Que las personas vivieran en `domain/` y sus stories en otro lado partía una misma oración ("**Como quien está cursando**, quiero...") en dos cajones.
4. **Vocabulario: épica y story, que es como se llaman.** La carpeta es una **épica** (lo que alguien viene a hacer: reseñar, replicar, moderar) y adentro tiene sus **stories**, una por archivo. Se probó renombrarlas a "capacidad" y "requisito" para sacarle a la épica el bagaje de gestión, y el costo fue peor que el problema: nadie llama así a esto, y el dueño del proyecto dejó de reconocer su propia estructura. La carpeta no tiene sprint ni estado con el nombre que tenga. No se dice "slice" (es la palabra del código) ni "requerimiento" (era un tercer sinónimo para lo mismo).
5. **La pantalla la hace existir el flujo, y se identifica como una story.** Vive en `screens/SC-NNN-slug/` con su ficha y su boceto, y su ID sigue las mismas reglas que el de una story ([ADR-0072](0072-the-story-lives-in-its-epic-and-the-plan-only-references-it.md)): estable para siempre, sin semántica adentro, slug congelado al crear. **No vive adentro de una story**: resuelve 6,3 en promedio y 65 de las 93 aparecen en más de una, así que meterla en una sería elegir arbitrariamente una de veinte. El contrato de la ficha está en [`plan/screen-template.md`](../plan/screen-template.md).
6. **La trazabilidad story ↔ pantalla se declara en las dos direcciones y se valida.** La story dice dónde se resuelve; la ficha lista qué stories resuelve. Son dos listas, así que `scripts/check-docs.ts` verifica que coincidan: si una miente, lo canta. Sin el validador esto sería la duplicación que el resto de estas decisiones viene evitando.
7. **Toda pantalla tiene una épica dueña: la que la hace existir.** No hay pantallas sin dueño ni carpeta de pantallas compartidas. Cuando otra épica aporta una acción a una pantalla ajena (votar en la Ficha de cátedra, reportar, replicar), lo dice en su README y linkea la ficha; la ficha lista quién le aporta. Trazabilidad por link en las dos direcciones, no por un lugar neutral.
8. **Todo artefacto de diseño es texto**: los bocetos son HTML autocontenido con los tokens del design system (mid-fi, y hi-fi en el mismo archivo para las pantallas que definen el producto: git guarda el mid-fi); los flujos son mermaid. **Ninguna imagen es fuente**: si hace falta una captura, se genera desde el HTML a una carpeta de derivados que se regenera y no se edita.
9. **Un índice que duplica lo que la estructura ya dice, se genera o no existe.** El sitemap de las 34 pantallas es una tabla de `product/README.md` con lo único no derivable (el slug de hoy); el mapa que lo precedía se congeló en `history/`.
10. **Los nombres de carpeta y archivo van en inglés, en kebab-case**, como todo identificador del repo ([`decisions/README.md`](README.md), [`git-workflow.md`](../engineering/git-workflow.md)): título, path y slug son identificadores; la prosa es español rioplatense. El nombre visible de una épica o una pantalla va en español en el texto (Reseñar, Ficha de cátedra) y en inglés en el path (`product/write-a-review/`, `screens/SC-002-chair/`).

## Alternativas consideradas

**A. Seguir agrupando por tipo** (requisitos, pantallas, flujos, cada uno en su lugar), que es lo que había. Es lo que hace que un cambio de una épica toque seis archivos y que la UX no tenga casa. Descartada; se conserva solo para lo transversal, donde es lo correcto.

**B. Agrupar por feature de código** (una carpeta de docs por slice de caso de uso). Demasiado fino: un flujo atraviesa varios casos de uso, y "feature" ya significa eso en el código y otra cosa en SAFe. Descartada.

**C. Un documento por pantalla y nada más.** Deja los flujos sin dueño y confunde la página con la épica: la Ficha de cátedra la componen cinco. Descartada; la pantalla vive adentro de su épica dueña.

**D. Pantallas propias y compartidas** (el corte del 18: las que usa una sola adentro, las demás en una carpeta compartida). Dos lugares para lo mismo, con un inventario como intermediario obligatorio, y pantallas que no le responden a nadie. Descartada al día siguiente, antes de pushear.

**E. Partir el boceto por épica** (cada una dibuja su parte de la pantalla). El vertical llevado al absurdo: un boceto de "la parte de votar" no es un boceto y la pantalla real no la ve nadie. Descartada.

**F. Imágenes o herramientas externas como fuente** (capturas, Claude Design, Figma). Es lo que drifteó en la versión anterior y lo que no se puede diffear ni corregir en un PR. Descartada; sirven para explorar, no como fuente.

**G. Meter el producto adentro de `docs/domain/`.** `domain` significaba acá lo mismo que en el backend (`modules/*/Domain`): el lenguaje y las reglas del negocio. El producto trae `screens/` con bocetos HTML y personas: eso no es dominio. Descartada, y el corolario se cobró después: `domain/` había quedado como cajón de sastre (glosario, personas, frases, el Definition of Done y la documentación de un flujo de la v1, cinco archivos sin criterio común), así que **se disolvió**: el glosario y las frases son producto, el DoD es proceso y el flujo v1 es historia.

**H. Conservar las diez carpetas y solo mover archivos sueltos entre ellas.** Es lo que se venía haciendo, y produjo el estado que motivó este pase: `architecture/`, `design/` y `testing/` con dos archivos cada una, `operations/` con cuatro, y ninguna capaz de decir qué pregunta contestaba que otra no contestara. Descartada: parchar la ubicación de un archivo por vez no arregla una taxonomía sin criterio.

## Consecuencias

- **Las épicas quedan resueltas por construcción**: son las catorce carpetas de `docs/product/`, incluida **Entrar** (Ingresar, Registro, Recuperar, Error), que existe porque el umbral tiene pantallas y ninguna otra épica lo hace existir sola.
- **Las 34 pantallas viven en su épica dueña**, con ficha y boceto. No hay carpeta de pantallas compartidas ni inventario aparte: el índice por slug es una tabla de `product/README.md`.
- **Seis carpetas dejan de existir**: `domain/`, `design/`, `architecture/`, `testing/`, `operations/` y `reviews/`. Sus contenidos van a `product/`, `engineering/`, `plan/` o `history/` según qué pregunta contestan.
- **La gestión no se mezcla**: una épica no tiene sprint ni prioridad; eso vive en [`plan/`](../plan/README.md), citando IDs ([ADR-0072](0072-the-story-lives-in-its-epic-and-the-plan-only-references-it.md)).
- **Un cambio transversal sigue tocando todo**: eso lo hace barato `scripts/check-docs.ts` (links, em-dashes, períodos, una story en una sola épica, el conteo del índice), no la estructura.

## Refs

- [THESIS.md](../THESIS.md); [ADR-0063](0063-the-product-is-a-pressure-instrument.md) (el viraje); [ADR-0072](0072-the-story-lives-in-its-epic-and-the-plan-only-references-it.md) (la fuente única y el retiro de las fichas); [ADR-0071](0071-the-visual-language-is-a-bulletin.md) (el lenguaje visual, que vive en `product/`); [ADR-0041](0041-rediseño-ux-post-claude-design.md) (el rediseño anterior, antecedente de la alternativa F); [ADR-0020](0020-features-alineadas-con-modulos-backend.md) (el paralelo con el código).
- Fuentes citadas arriba: SAFe (Enov8), Scrum/Jira (monday.com), story mapping (Easy Agile), estructura de documentación (Archbee), entregables de UX (Toptal), docs-as-code (GitBook, Kong).
