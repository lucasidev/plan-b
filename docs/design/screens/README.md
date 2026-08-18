# Pantallas

Una ficha por pantalla del producto, con su boceto al lado. La ficha (`<pantalla>.md`) dice quién la usa (personas), qué stories resuelve (IDs del [catálogo](../../domain/user-stories.md)), qué muestra con las decisiones de la tesis ya aplicadas ([ADR-0064](../../decisions/0064-phrases-with-voices-not-scores.md) a [0068](../../decisions/0068-comment-publishes-as-testimony-below-the-phrases.md)), sus estados vacíos, sus acciones, de dónde se llega y adónde va, y el slug propuesto en inglés. El boceto (`<pantalla>.html`) arranca mid-fi con los tokens de [`design-system.md`](../design-system.md) y, en las pantallas que definen el producto, se lleva a hi-fi en el mismo archivo (git guarda el mid-fi). Se abre en el navegador; usa Geist y IBM Plex Mono desde Google Fonts, con fallback a la fuente del sistema.

Los nombres de pantalla son los del [mapa](../product-map.md), en español y en backticks (`catedra`, `donde`, `reseñar`): son nombres de UX, no rutas; la URL es código, en inglés, y se fija al entrar a sprint. Cada ficha pasa por revisión adversarial (registro en [`docs/reviews/`](../../reviews/README.md)) antes de que se dibuje hi-fi. Cuando una story entra a sprint, su ficha `US-NNN` linkea la ficha de pantalla.

| Pantalla | Ficha | Boceto | Estado |
|---|---|---|---|
| (pedazo de `catedra` y de `reseñar`) el testimonio | en su ficha, cuando exista | [`testimonio.html`](testimonio.html) | boceto aprobado con [ADR-0068](../../decisions/0068-comment-publishes-as-testimony-below-the-phrases.md); se absorbe en las fichas de `catedra` y `reseñar` |
