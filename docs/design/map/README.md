# El mapa de producto (referencia de diseño vigente)

`plan-b-mapa.html` es el canvas del producto nuevo, vendorizado desde Claude Design el 2026-08-16. Es
autocontenido (solo carga fuentes de Google): se abre en el browser directo, sin servidor.

**Es la única referencia de diseño vigente, y es mid-fi a propósito.** Sus wireframes dicen qué
vistas y pantallas necesita el producto, qué carril camina cada persona y dónde se cruza de carril.
No dicen cómo se ven en detalle: el hi-fi puede cambiar por gusto, y no se toma como contrato hasta
que exista una decisión que lo fije. Cuando una story entra a sprint, su "mockup" es el wireframe del
flujo del mapa que la dibuja, referenciado por número de flujo (01-15, BO-1..BO-7), no una captura.

Lo que el mapa define está portado a docs versionados, que son los que se leen para trabajar:

- [`docs/domain/product-map.md`](../../domain/product-map.md): rutas, flujos, planos, reglas del corpus, y la auditoría del mapa.
- [`docs/domain/user-stories.md`](../../domain/user-stories.md): las 76 stories con su "listo cuando".
- [`docs/domain/user-personas.md`](../../domain/user-personas.md): las 12 personas.

Si el canvas cambia en Claude Design, se vuelve a vendorizar acá **y se re-portan los docs**: el
HTML solo no alcanza como referencia, porque nadie lo lee entero.

El diseño de la versión anterior (canvas `plan-b-*.html`, mocks y las 77 capturas) queda congelado
en [`../reference/`](../reference/) como historia: las US Done lo citan y no se reescriben.
