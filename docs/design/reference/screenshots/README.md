# Screenshots del canvas

Capturas automáticas de cada artboard del canvas de design. Cada captura es la fuente visual de verdad para la US correspondiente: cuando el código difiera de la imagen, el código está mal (a menos que haya una decisión documentada en ADR o lessons-learned que lo justifique).

## Estructura del canvas

El canvas se splitea en 4 HTMLs por área:

| HTML | Artboards | Foco |
|---|---|---|
| `plan-b-design-system.html` | 1 | Sistema visual (DS canónico) |
| `plan-b-landing.html` | 1 | Landing pública |
| `plan-b-app.html` | 46 | App del alumno (auth, onb, inicio, mi-carrera, planificar, reseñas, rankings, búsqueda, notif, cuenta, soporte; modales y errores adentro de cada sección) |
| `plan-b-admin.html` | 21 | Panel interno del equipo plan-b (shell + afiliar uni + datos académicos + moderación + ops) |

Total: **69 artboards** en 14 secciones del app + 5 del admin.

## Cómo se generan

```bash
cd frontend
PLAYWRIGHT_INCLUDE_CAPTURE=1 bunx playwright test e2e/_capture/canvas-screenshots.spec.ts
```

El spec levanta un `node:http` static server sobre `docs/design/reference/`, navega a cada uno de los 4 HTMLs, espera el render de React+Babel, y captura cada `.dc-card` por su `[data-dc-section][data-dc-slot]`. Output a `docs/design/reference/screenshots/` con naming:

- `<section>-<id>.png` para los canvases `app`, `landing`, `ds`.
- `admin-<section>-<id>.png` (reservado) para el canvas `admin/backoffice` cuando aterrice en PR siguiente. El prefix evita colisión con secciones del app que se llaman igual (ej. `onb`).

`manifest.json` se regenera con todos los artboards juntos.

Re-correr cuando:
- Cualquier `canvas-mocks/*.jsx` cambia.
- Se agrega un artboard nuevo a algún HTML: actualizar también la lista `CANVASES` en `frontend/e2e/_capture/canvas-screenshots.spec.ts`.

## Mapping artboard → US

### Design System

| Artboard | Imagen | US |
|---|---|---|
| `ds-main` | `ds-ds-main.png` | [`docs/design/design-system.md`](../../design-system.md) (doc canónico transversal) |

### Landing

| Artboard | Imagen | US |
|---|---|---|
| `lp` | `landing-lp.png` | [US-054-f](../../../domain/user-stories/US-054-f.md) (landing real reemplaza el redirect a `/home`) |

### App del alumno (46 artboards)

| Sección | Artboard | Imagen | US |
|---|---|---|---|
| ① Auth | `signup` | `auth-signup.png` | [US-010-f](../../../domain/user-stories/US-010-f.md) + [US-059-f](../../../domain/user-stories/US-059-f.md) |
| ① Auth | `signup-err` | `auth-signup-err.png` | [US-010-f](../../../domain/user-stories/US-010-f.md) + [US-059-f](../../../domain/user-stories/US-059-f.md) (AC banner inline) |
| ① Auth | `login` | `auth-login.png` | [US-028-f](../../../domain/user-stories/US-028-f.md) + [US-059-f](../../../domain/user-stories/US-059-f.md) |
| ① Auth | `login-err` | `auth-login-err.png` | [US-028-f](../../../domain/user-stories/US-028-f.md) + [US-059-f](../../../domain/user-stories/US-059-f.md) (AC banner inline) |
| ① Auth | `forgot` | `auth-forgot.png` | [US-033-i](../../../domain/user-stories/US-033-i.md) + [US-059-f](../../../domain/user-stories/US-059-f.md) |
| ① Auth | `forgot-ok` | `auth-forgot-ok.png` | [US-033-i](../../../domain/user-stories/US-033-i.md) + [US-059-f](../../../domain/user-stories/US-059-f.md) |
| ② Onboarding | `welcome` | `onb-welcome.png` | [US-037-f](../../../domain/user-stories/US-037-f.md) + [US-059-f](../../../domain/user-stories/US-059-f.md) |
| ② Onboarding | `career` | `onb-career.png` | [US-037-f](../../../domain/user-stories/US-037-f.md) + [US-059-f](../../../domain/user-stories/US-059-f.md) |
| ② Onboarding | `history` | `onb-history.png` | [US-037-f](../../../domain/user-stories/US-037-f.md) + [US-059-f](../../../domain/user-stories/US-059-f.md) |
| ② Onboarding | `done` | `onb-done.png` | [US-037-f](../../../domain/user-stories/US-037-f.md) + [US-059-f](../../../domain/user-stories/US-059-f.md) |
| ③ Inicio | `v2-inicio` | `home-v2-inicio.png` | [US-044](../../../domain/user-stories/US-044.md) (Done en S2) |
| ③ Inicio | `v2-inicio-empty` | `home-v2-inicio-empty.png` | [US-044](../../../domain/user-stories/US-044.md) (AC empty state) |
| ③ Inicio | `v2-inicio-offline` | `home-v2-inicio-offline.png` | [US-076-f](../../../domain/user-stories/US-076-f.md) (banner offline transversal) |
| ③ Inicio | `v2-err-404` | `home-v2-err-404.png` | [US-078-f](../../../domain/user-stories/US-078-f.md) |
| ③ Inicio | `v2-err-5xx` | `home-v2-err-5xx.png` | [US-078-f](../../../domain/user-stories/US-078-f.md) |
| ④ Mi carrera | `v2-carrera-p` | `plan-v2-carrera-p.png` | [US-045](../../../domain/user-stories/US-045.md), [US-045-b](../../../domain/user-stories/US-045-b.md) |
| ④ Mi carrera | `v2-carrera-g` | `plan-v2-carrera-g.png` | [US-045](../../../domain/user-stories/US-045.md), [US-045-c](../../../domain/user-stories/US-045-c.md) |
| ④ Mi carrera | `v2-carrera-c` | `plan-v2-carrera-c.png` | [US-045](../../../domain/user-stories/US-045.md), [US-045-d](../../../domain/user-stories/US-045-d.md) |
| ④ Mi carrera | `v2-mat-detail` | `plan-v2-mat-detail.png` | [US-045-d](../../../domain/user-stories/US-045-d.md) |
| ④ Mi carrera | `v2-carrera-d` | `plan-v2-carrera-d.png` | [US-045](../../../domain/user-stories/US-045.md), [US-045-d](../../../domain/user-stories/US-045-d.md) |
| ④ Mi carrera | `v2-doc-detail` | `plan-v2-doc-detail.png` | [US-045-d](../../../domain/user-stories/US-045-d.md) |
| ④ Mi carrera | `v2-carrera-h` | `plan-v2-carrera-h.png` | [US-045](../../../domain/user-stories/US-045.md), [US-045-e](../../../domain/user-stories/US-045-e.md) |
| ⑤ Planificar | `v2-plan-curso` | `sim-v2-plan-curso.png` | [US-046](../../../domain/user-stories/US-046.md) |
| ⑤ Planificar | `v2-plan-borr` | `sim-v2-plan-borr.png` | [US-046](../../../domain/user-stories/US-046.md) |
| ⑤ Planificar | `v2-plan-empty` | `sim-v2-plan-empty.png` | [US-046](../../../domain/user-stories/US-046.md) (AC empty global) |
| ⑤ Planificar | `v2-modal-publicar` | `sim-v2-modal-publicar.png` | [US-046](../../../domain/user-stories/US-046.md) (AC modal publicar plan) |
| ⑤ Planificar | `v2-modal-descartar` | `sim-v2-modal-descartar.png` | [US-026](../../../domain/user-stories/US-026.md) (AC visual modal) |
| ⑥ Reseñas | `v2-resenas-l` | `resenas-v2-resenas-l.png` | [US-048](../../../domain/user-stories/US-048.md) |
| ⑥ Reseñas | `v2-resenas-e` | `resenas-v2-resenas-e.png` | [US-048](../../../domain/user-stories/US-048.md) |
| ⑥ Reseñas | `v2-resenas-e-empty` | `resenas-v2-resenas-e-empty.png` | [US-048](../../../domain/user-stories/US-048.md) (AC empty pendientes) |
| ⑥ Reseñas | `v2-resenas-m` | `resenas-v2-resenas-m.png` | [US-048](../../../domain/user-stories/US-048.md) |
| ⑥ Reseñas | `v2-resenas-m-empty` | `resenas-v2-resenas-m-empty.png` | [US-048](../../../domain/user-stories/US-048.md) (AC empty mías) |
| ⑥ Reseñas | `v2-resenas-edit` | `resenas-v2-resenas-edit.png` | [US-049](../../../domain/user-stories/US-049.md) + [US-017](../../../domain/user-stories/US-017.md) (backend) |
| ⑥ Reseñas | `v2-modal-borrar` | `resenas-v2-modal-borrar.png` | [US-055](../../../domain/user-stories/US-055.md) |
| ⑥ Reseñas | `v2-modal-reportar` | `resenas-v2-modal-reportar.png` | [US-019](../../../domain/user-stories/US-019.md) |
| ⑦ Rankings | `v2-rankings` | `rankings-v2-rankings.png` | [US-070](../../../domain/user-stories/US-070.md) |
| ⑧ Búsqueda | `v2-buscar` | `busqueda-v2-buscar.png` | [US-071](../../../domain/user-stories/US-071.md) |
| ⑧ Búsqueda | `v2-buscar-empty` | `busqueda-v2-buscar-empty.png` | [US-071](../../../domain/user-stories/US-071.md) (AC sin resultados) |
| ⑨ Notificaciones | `v2-notif` | `notificaciones-v2-notif.png` | [US-077-f](../../../domain/user-stories/US-077-f.md) (panel frontend) + [US-077-b](../../../domain/user-stories/US-077-b.md) backend (splitada en [b-1](../../../domain/user-stories/US-077-b-1.md) / [b-2](../../../domain/user-stories/US-077-b-2.md) / [b-3](../../../domain/user-stories/US-077-b-3.md)) |
| ⑨ Notificaciones | `v2-notif-empty` | `notificaciones-v2-notif-empty.png` | [US-077-f](../../../domain/user-stories/US-077-f.md) (AC empty state) |
| ⑩ Cuenta | `v2-perfil` | `cuenta-v2-perfil.png` | [US-047](../../../domain/user-stories/US-047.md) |
| ⑩ Cuenta | `v2-ajustes` | `cuenta-v2-ajustes.png` | [US-072](../../../domain/user-stories/US-072.md) |
| ⑩ Cuenta | `v2-modal-pass` | `cuenta-v2-modal-pass.png` | [US-079-i](../../../domain/user-stories/US-079-i.md) (cambio password integrated; US-072 monta el row trigger en Ajustes) |
| ⑩ Cuenta | `v2-modal-logout` | `cuenta-v2-modal-logout.png` | [US-029-i](../../../domain/user-stories/US-029-i.md) (AC modal confirmación) |
| ⑪ Soporte | `v2-ayuda` | `soporte-v2-ayuda.png` | [US-073](../../../domain/user-stories/US-073.md) |
| ⑪ Soporte | `v2-sobre` | `soporte-v2-sobre.png` | [US-074](../../../domain/user-stories/US-074.md) |

### Admin (21 artboards, en PR siguiente)

El canvas admin/backoffice (`plan-b-admin.html` + módulo `admin-shell.jsx` + `admin-screens-1/2/3.jsx`) aterriza en un PR separado junto con sus 21 capturas y las US-081, US-082, US-083, US-084, US-086, US-087 + ADR-0042 + actualizaciones a US-050, US-051, US-053, US-060..065, US-068.

## Resumen del estado por captura (audit 2026-05-09 v3, app/landing/design-system)

- **Implementadas y matchean** (2): `ds-main` (transversal), `home-v2-inicio` (US-044, port literal en S2).
- **Implementadas con drift visual** (10): los 6 auth + 4 onb. Comportamiento cubierto por US-010-f / US-028-f / US-033-i / US-037-f (Done). Rediseño visual cubierto por [US-059-f](../../../domain/user-stories/US-059-f.md) con AC de banners inline.
- **Pendientes con US doc creada** (32 capturas del lado app): cada una espera implementación.
- **US nuevas creadas para la app del alumno**: [US-054-f](../../../domain/user-stories/US-054-f.md), [US-055](../../../domain/user-stories/US-055.md), [US-059-f](../../../domain/user-stories/US-059-f.md), [US-076-f](../../../domain/user-stories/US-076-f.md), [US-077-f](../../../domain/user-stories/US-077-f.md), [US-077-b](../../../domain/user-stories/US-077-b.md) + sub-slices [b-1](../../../domain/user-stories/US-077-b-1.md) / [b-2](../../../domain/user-stories/US-077-b-2.md) / [b-3](../../../domain/user-stories/US-077-b-3.md), [US-078-f](../../../domain/user-stories/US-078-f.md), [US-079-i](../../../domain/user-stories/US-079-i.md), [US-085](../../../domain/user-stories/US-085.md).

## Decisiones de scope zanjadas en el rediseño app (2026-05-09)

1. ~~**US-051 scope ampliado**~~: splittear. US-051 mantiene scope original (uphold/dismiss + AC visual del detalle del canvas con 2 opciones live + 3 disabled placeholder). [US-085](../../../domain/user-stories/US-085.md) cubre strike system + pedir edición al autor (plazo 48h) + ocultar+banear con quarantine. US-085 splitteable a su vez en `-a` strikes / `-b` pending-author-edit / `-c` ocultar+banear cuando entre al sprint.
2. ~~**US-072 modal cambiar contraseña**~~: splitteamos. [US-079-i](../../../domain/user-stories/US-079-i.md) (integrated slice) cubre endpoint `PATCH /api/me/password` + modal con revocación de refresh tokens excepto el actual + notification al user. US-072 queda enfocada al UI de Ajustes y monta el row "Cambiar contraseña →" que dispara el modal de US-079-i. Patrón alineado a US-029-i / US-033-i.
3. ~~**US-077-b backend de notifications**~~: full Notifications BC siguiendo ADR-0040, splitado en 3 sub-slices desde el inicio. [US-077-b parent](../../../domain/user-stories/US-077-b.md) + [b-1 core](../../../domain/user-stories/US-077-b-1.md) (aggregate + read API + mutations) + [b-2 subscribers](../../../domain/user-stories/US-077-b-2.md) (handlers Wolverine cross-BC) + [b-3 email delivery](../../../domain/user-stories/US-077-b-3.md) (SMTP genérico + Mailpit en dev, vendor de prod queda como config de deploy sin tocar código).

Decisiones pendientes relacionadas al admin (US-050 cola-de-reports mismatch, US-053 audit log scope) se zanjan en el PR siguiente del módulo admin junto con ADR-0042 + US-086 + US-087.

## Convención

- **Cada US frontend cita su(s) imagen(es) en la sección `## Refs > Mockup`** del `.md`. Path relativo: `../../design/reference/screenshots/<file>.png` (dos niveles arriba desde `docs/domain/user-stories/`).
- **Si hay drift entre código e imagen → fixear código, no la imagen.** Las imágenes son la fuente.
- **Si la decisión de UX cambió y la imagen quedó obsoleta**: actualizar el canvas mock + regenerar screenshots + actualizar la US, en el mismo PR. Documentar en `lessons-learned.md`.

## Manifest

`manifest.json` lista cada artboard con su `canvas`, `section`, `id`, `label`, dimensiones declaradas, `file`, y status `ok`. Auto-generado por el spec; no editar a mano.
