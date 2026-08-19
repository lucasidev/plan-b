# El mapa de producto (canvas mid-fi, orientativo)

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

- [`docs/domain/user-stories.md`](../../domain/user-stories.md): las 76 stories con su "listo cuando" (esto es lo que se construye).
- [`docs/domain/user-personas.md`](../../domain/user-personas.md): las 12 personas.
- [`docs/design/product-map.md`](../product-map.md): pantallas, flujos y planos tal como el mapa los propone (la auditoría del mapa está en [`docs/reviews/`](../../reviews/2026-08-16-product-map.md)). Es la mejor foto de la estructura pensada, con el mismo carácter orientativo; las fichas por pantalla en [`screens/`](../screens/README.md) son lo que se construye.

Si el canvas cambia en Claude Design, se vuelve a vendorizar acá y se re-portan los docs.

El diseño de la versión anterior (canvas `plan-b-*.html`, mocks y las 77 capturas) queda congelado
en [`docs/history/design-v1/reference/`](../../history/design-v1/reference/README.md) como historia: las US Done lo citan y no se reescriben.
