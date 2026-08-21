# El diseño de la versión anterior

Los canvases de Claude Design de la versión anterior (`plan-b-design-system.html`, `plan-b-landing.html`, `plan-b-app.html`, `plan-b-admin.html`), sus tokens (`canvas-tokens.css`), sus mocks JSX y las capturas que el pipeline de e2e (`frontend/e2e/_capture/canvas-screenshots.spec.ts`, con `PLAYWRIGHT_INCLUDE_CAPTURE=1`) sacaba de ellos. Describen el planificador con reseñas de texto, retirado por [ADR-0063](../../decisions/0063-the-product-is-a-pressure-instrument.md); las fichas `US-NNN` hechas los referencian como su mockup.

No se editan. Los tokens siguen vigentes en `frontend/src/app/globals.css` y en [`design-system.md`](../../product/design-system.md); las pantallas nuevas se diseñan en [`docs/design/screens/`](README.md). El pipeline de capturas se rehace cuando existan pantallas nuevas que capturar.
