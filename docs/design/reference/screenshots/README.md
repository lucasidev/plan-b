# Screenshots del canvas

Capturas automáticas de cada artboard del canvas de design (`docs/design/reference/plan-b-direcciones.html`). Cada captura es la fuente visual de verdad para la US correspondiente: cuando el código difiera de la imagen, el código está mal (a menos que haya una decisión documentada en ADR o lessons-learned que lo justifique).

## Cómo se generan

```bash
cd frontend
PLAYWRIGHT_INCLUDE_CAPTURE=1 bunx playwright test e2e/_capture/canvas-screenshots.spec.ts
```

El spec levanta un `node:http` static server sobre `docs/design/reference/`, navega con chromium al canvas, espera el render de React+Babel, y captura cada `.dc-card` por su `[data-dc-section][data-dc-slot]`. Output a `docs/design/reference/screenshots/<sección>-<id>.png` + `manifest.json`.

Re-correr cuando:
- El canvas (cualquier `canvas-mocks/*.jsx`) cambia.
- Se agrega un artboard nuevo al canvas: actualizar también la lista `ARTBOARDS` en `frontend/e2e/_capture/canvas-screenshots.spec.ts`.

## Mapping artboard → US

| Sección canvas | Artboard | Imagen | US relacionadas |
|---|---|---|---|
| ⓪ Design System | `ds-main` | `ds-ds-main.png` | (referencia transversal, ADR-0041) |
| ① Landing | `lp` | `landing-lp.png` | (Landing pública, US futura) |
| ② Auth | `signup` | `auth-signup.png` | [US-010-f](../../../domain/user-stories/US-010-f.md), [US-036](../../../domain/user-stories/US-036.md) |
| ② Auth | `login` | `auth-login.png` | [US-028-f](../../../domain/user-stories/US-028-f.md), [US-036](../../../domain/user-stories/US-036.md) |
| ② Auth | `forgot` | `auth-forgot.png` | [US-033-i](../../../domain/user-stories/US-033-i.md) |
| ② Auth | `forgot-ok` | `auth-forgot-ok.png` | [US-033-i](../../../domain/user-stories/US-033-i.md) |
| ③ Onboarding | `welcome` | `onb-welcome.png` | [US-037](../../../domain/user-stories/US-037.md), [US-037-f](../../../domain/user-stories/US-037-f.md) |
| ③ Onboarding | `career` | `onb-career.png` | [US-037](../../../domain/user-stories/US-037.md), [US-037-f](../../../domain/user-stories/US-037-f.md) |
| ③ Onboarding | `history` | `onb-history.png` | [US-037](../../../domain/user-stories/US-037.md), [US-037-f](../../../domain/user-stories/US-037-f.md) |
| ③ Onboarding | `done` | `onb-done.png` | [US-037](../../../domain/user-stories/US-037.md), [US-037-f](../../../domain/user-stories/US-037-f.md) |
| ④ Inicio | `v2-inicio` | `home-v2-inicio.png` | [US-044](../../../domain/user-stories/US-044.md), [US-044-a](../../../domain/user-stories/US-044-a.md), [US-044-b](../../../domain/user-stories/US-044-b.md), [US-044-c](../../../domain/user-stories/US-044-c.md) |
| ⑤ Mi carrera | `v2-carrera-p` | `plan-v2-carrera-p.png` | [US-045](../../../domain/user-stories/US-045.md), [US-045-b](../../../domain/user-stories/US-045-b.md) |
| ⑤ Mi carrera | `v2-carrera-g` | `plan-v2-carrera-g.png` | [US-045](../../../domain/user-stories/US-045.md), [US-045-c](../../../domain/user-stories/US-045-c.md) |
| ⑤ Mi carrera | `v2-carrera-c` | `plan-v2-carrera-c.png` | [US-045](../../../domain/user-stories/US-045.md), [US-045-d](../../../domain/user-stories/US-045-d.md) |
| ⑤ Mi carrera | `v2-mat-detail` | `plan-v2-mat-detail.png` | [US-045-d](../../../domain/user-stories/US-045-d.md) |
| ⑤ Mi carrera | `v2-carrera-d` | `plan-v2-carrera-d.png` | [US-045](../../../domain/user-stories/US-045.md), [US-045-d](../../../domain/user-stories/US-045-d.md) |
| ⑤ Mi carrera | `v2-doc-detail` | `plan-v2-doc-detail.png` | [US-045-d](../../../domain/user-stories/US-045-d.md) |
| ⑤ Mi carrera | `v2-carrera-h` | `plan-v2-carrera-h.png` | [US-045](../../../domain/user-stories/US-045.md), [US-045-e](../../../domain/user-stories/US-045-e.md) |
| ⑥ Planificar | `v2-plan-curso` | `sim-v2-plan-curso.png` | [US-046](../../../domain/user-stories/US-046.md) |
| ⑥ Planificar | `v2-plan-borr` | `sim-v2-plan-borr.png` | [US-046](../../../domain/user-stories/US-046.md) |
| ⑦ Reseñas | `v2-resenas-l` | `resenas-v2-resenas-l.png` | [US-048](../../../domain/user-stories/US-048.md) |
| ⑦ Reseñas | `v2-resenas-e` | `resenas-v2-resenas-e.png` | [US-048](../../../domain/user-stories/US-048.md) |
| ⑦ Reseñas | `v2-resenas-m` | `resenas-v2-resenas-m.png` | [US-048](../../../domain/user-stories/US-048.md) |
| ⑦ Reseñas | `v2-resenas-edit` | `resenas-v2-resenas-edit.png` | [US-017](../../../domain/user-stories/US-017.md), [US-048](../../../domain/user-stories/US-048.md) |
| ⑧ Rankings | `v2-rankings` | `rankings-v2-rankings.png` | (US futura) |
| ⑨ Búsqueda | `v2-buscar` | `busqueda-v2-buscar.png` | (US futura) |
| ⑩ Cuenta | `v2-perfil` | `cuenta-v2-perfil.png` | [US-047](../../../domain/user-stories/US-047.md) |
| ⑩ Cuenta | `v2-ajustes` | `cuenta-v2-ajustes.png` | [US-047](../../../domain/user-stories/US-047.md) |
| ⑪ Soporte | `v2-ayuda` | `soporte-v2-ayuda.png` | (US futura) |
| ⑪ Soporte | `v2-sobre` | `soporte-v2-sobre.png` | (US futura) |

## Convención

- **Cada US frontend cita su(s) imagen(es) en la sección `## Refs > Mockup`** del `.md`. Path relativo: `../design/reference/screenshots/<file>.png`.
- **Si hay drift entre código e imagen → fixear código, no la imagen.** Las imágenes son la fuente.
- **Si la decisión de UX cambió y la imagen quedó obsoleta**: actualizar el canvas mock + regenerar screenshot + actualizar la US, en el mismo PR. Documentar en `lessons-learned.md`.

## Manifest

`manifest.json` lista cada artboard con su `section`, `id`, `label`, dimensiones declaradas, `file`, y status `ok`. Auto-generado por el spec; no editar a mano.
