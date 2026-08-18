# El mapa de producto (canvas mid-fi, orientativo)

`plan-b-mapa.html` es el canvas del producto nuevo, vendorizado desde Claude Design el 2026-08-16. Es
autocontenido (solo carga fuentes de Google): se abre en el browser directo, sin servidor.

**Es orientativo, no un contrato de diseño.** Sus wireframes mid-fi sirven para entender qué vistas y
pantallas podría necesitar el producto y qué carril camina cada persona; no fijan el diseño final ni
la UX/UI final. Lo vinculante para construir son las **user stories** con su "listo cuando", las
**personas** y los requisitos que salgan de ellas; la UX/UI se decide cuando toque construir cada
pantalla, y puede apartarse del mapa sin pedir permiso. Si en algún momento hace falta auditar o
revisar la UX/UI que el mapa propone, se hace como trabajo explícito.

Lo que sí es fuente, portado del mapa a docs versionados:

- [`docs/domain/user-stories.md`](../../domain/user-stories.md): las 76 stories con su "listo cuando" (esto es lo que se construye).
- [`docs/domain/user-personas.md`](../../domain/user-personas.md): las 12 personas.
- [`docs/domain/product-map.md`](../../domain/product-map.md): rutas, flujos y planos tal como el mapa los propone, con la auditoría del mapa. Es la mejor foto de la estructura pensada, con el mismo carácter orientativo.

Si el canvas cambia en Claude Design, se vuelve a vendorizar acá y se re-portan los docs.

El diseño de la versión anterior (canvas `plan-b-*.html`, mocks y las 77 capturas) queda congelado
en [`../reference/`](../reference) como historia: las US Done lo citan y no se reescriben.
