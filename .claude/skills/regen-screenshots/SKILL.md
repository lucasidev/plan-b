---
name: regen-screenshots
description: Regenera los screenshots de referencia del design system desde el canvas HTML. Usalo cuando cambió el canvas de diseño (docs/design/reference/plan-b-*.html) y hay que actualizar los PNG que son la fuente visual del producto. Los screenshots son auto-generados, NO se editan a mano: si el diseño cambió, se regeneran corriendo el pipeline.
disable-model-invocation: true
---

Regenerás los screenshots de referencia del design system. El canvas HTML es la fuente visual; los PNG en `docs/design/reference/screenshots/` se derivan de él con un spec de Playwright, no se editan a mano.

## El pipeline

Desde `frontend/`:

```bash
PLAYWRIGHT_INCLUDE_CAPTURE=1 bunx playwright test e2e/_capture/canvas-screenshots.spec.ts
```

El env var `PLAYWRIGHT_INCLUDE_CAPTURE=1` gatea el spec (sin él no corre, para no capturar en cada CI run). El spec levanta un server HTTP local sobre `docs/design/reference/`, navega cada HTML fuente, scrollea los artboards, captura los PNG y regenera `manifest.json`.

## Fuentes (los 4 canvas)

```
docs/design/reference/plan-b-design-system.html
docs/design/reference/plan-b-landing.html
docs/design/reference/plan-b-app.html
docs/design/reference/plan-b-admin.html
```

Si el cambio de diseño toca uno de estos, se regenera todo el set (el spec captura los 4).

## Después

- Los PNG regenerados + `manifest.json` quedan como cambios en `docs/design/reference/screenshots/`. Son artefactos versionados: entran en el commit del cambio de diseño.
- El contrato visual (paleta, tipografía, mapping canvas a frontend) vive en `docs/design/design-system.md`. Si cambió la estructura del canvas, revisá que ese doc siga espejando.
