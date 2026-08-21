# El canvas del mapa de producto (ático desde el 2026-08-19)

> **Absorbido.** Todo lo que este canvas definía vive versionado como texto: las stories en su épica ([`docs/product/`](../../product/README.md)), los flujos en mermaid, las 34 pantallas con ficha y boceto ([inventario](README.md)), las reglas en los ADRs y en el [catálogo de frases](../../product/phrases.md). Queda acá como registro de dónde salió; no se edita ni se vuelve a citar como fuente.

`canvas.html` es el canvas del producto nuevo, vendorizado desde Claude Design el 2026-08-16. Es
autocontenido (solo carga fuentes de Google): se abre en el browser directo, sin servidor. **La copia del repo
es la referencia desde el 2026-08-18**: se renombraron sus etiquetas de pantalla para que coincidan con los
nombres del producto (`contar` → Reseñar; `donde` → Dónde estudiarla; `abandono` → Mi situación; y el resto
con su ortografía: Mi carrera, Método, Ficha de cátedra). Si el canvas se vuelve a exportar desde Claude
Design, se renombra igual antes de reemplazar este archivo. La prosa del canvas todavía dice "contar" donde el
producto dice "reseñar": es texto del dibujo, no vocabulario del producto; el glosario manda.

**Es orientativo, no un contrato de diseño.** Sus wireframes mid-fi sirven para entender qué vistas y
pantallas podría necesitar el producto y qué carril camina cada persona; no fijan el diseño final ni
la UX/UI final. Lo vinculante para construir son las **user stories** con su "listo cuando", las
**personas** y los requisitos que salgan de ellas; la UX/UI se decide cuando toque construir cada
pantalla, y puede apartarse del mapa sin pedir permiso. Si en algún momento hace falta auditar o
revisar la UX/UI que el mapa propone, se hace como trabajo explícito.

Lo que sí es fuente, portado del mapa a docs versionados:

- [`docs/product/README.md`](../../product/README.md): las 93 stories con su "listo cuando" (esto es lo que se construye).
- [`docs/domain/user-personas.md`](../../product/personas.md): las 13 personas.
- [`docs/product/`](../../product/README.md): los flujos del mapa, uno por uno, como diagramas en mermaid dentro de la épica que los contiene, con sus ramas, salidas y errores.
- [`docs/design/screens/README.md`](README.md): el inventario de pantallas con su carpeta, su slug y las épicas que las componen; las fichas por pantalla son lo que se construye.
- [`docs/design/product-map.md`](../../product/map.md): el índice (los tres planos, cada flujo del mapa con el link a su épica, el estado contra el código; la auditoría del mapa está en [`docs/reviews/`](../reviews/2026-08-16-product-map.md)).

El canvas se queda como referencia mid-fi de cómo se veían las pantallas hasta que cada una tenga su ficha y su boceto; después va al ático.

Si el canvas cambia en Claude Design, se vuelve a vendorizar acá y se re-portan los docs.

El diseño de la versión anterior (canvas `plan-b-*.html`, mocks y las 77 capturas) queda congelado
en [`docs/history/design-v1/reference/`](../../history/design-v1/reference/README.md) como historia: las US Done lo citan y no se reescriben.
