# ADR-0019: A single Next.js app with route groups per actor

- **Estado**: aceptado, con dos de los cinco route groups retirados (ver [Revisión](#revisión-2026-08-30))
- **Fecha**: 2026-04-23

## Contexto

Planb tiene 5 tipos de actor: visitante anónimo, alumno (member), docente verificado (member con TeacherProfile verificado), moderador/admin (staff), y university staff. Cada uno consume distintas vistas y acciones.

Dos formas de organizar el frontend:

1. **Single app** con una sola codebase Next.js 15 que atiende todos los actores, con protección y composición de layouts por rol.
2. **Múltiples apps** separadas (ej. `frontend-public/`, `frontend-admin/`) que pueden deployarse independientemente.

## Decisión

**Single Next.js app** organizada con **route groups del App Router**, uno por actor:

```
src/app/
├── (public)/     rutas sin auth: landing, catálogo, reseñas, docentes
├── (auth)/       sign-in, sign-up, verify-email, forgot-password
├── (member)/     dashboard, historial, simulator, reviews, teacher-claim, profile
├── (teacher)/    responder reseñas sobre uno mismo
└── (staff)/      moderation queue, verifications, catalog admin, institutional dashboard
```

Cada route group tiene su propio `layout.tsx` con el auth guard apropiado:

- `(public)`: sin guard, accesible sin sesión.
- `(auth)`: redirige al dashboard si YA hay sesión (evita re-loguearse).
- `(member)`: requiere User con `role='member'` + StudentProfile activo. Redirige a `/sign-in` si falta sesión.
- `(teacher)`: requiere `(member)` guard + TeacherProfile con `verified_at NOT NULL`.
- `(staff)`: requiere User con `role IN ('moderator','admin','university_staff')`. `university_staff` solo accede al sub-árbol `(staff)/dashboard`; `moderator` y `admin` al resto.

Todo se deploya como una sola aplicación Next.js.

## Alternativas consideradas

### A. Separate frontend-admin app

Un Next.js dedicado para el backoffice de staff. Aisla la superficie pública del admin; cada uno tiene su build y su deploy.

Descartada porque:

- Duplica infraestructura: dos builds, dos deploys, dos conjuntos de dependencias a mantener.
- Componentes compartidos (shadcn/ui primitives, design tokens, api-client) tendrían que duplicarse o extraerse a una lib común.
- Solo dev, MVP: la separación no paga su costo de mantenimiento.
- La seguridad real del admin no depende de que esté en una app separada; depende de la validación del JWT y del role en el backend. El backend rechaza operaciones no autorizadas independientemente de desde qué frontend vengan.

### B. Microfrontends

Frontend modular con múltiples apps compuestas vía Module Federation o similar. Descartada por ser claramente desproporcionada para el scope.

## Consecuencias

**Positivas:**

- Un solo codebase, un solo deploy, un solo pipeline de CI.
- Componentes compartidos (ui primitives, layout, api-client) sin duplicar.
- Auth guard por route group es declarativo y testeable: el `layout.tsx` del group lo enforca.
- Navegación entre vistas de actor (ej. alumno que también es docente verificado moviendo entre `(member)` y `(teacher)`) es trivial.

**Negativas:**

- El bundle del cliente contiene código de todos los grupos potencialmente. Next.js 15 lo mitiga con code-splitting por ruta, pero el bundle de JS compartido sigue siendo único.
- Un bug en una ruta del staff puede afectar indirectamente el build/deploy de las rutas públicas (una build falla = nada se deploya).

**Regla de seguridad (importante):**

> La separación por route group es una conveniencia de UX y organización. **La autorización real se enforca en el backend.** Nunca confiar en el guard del frontend como única línea de defensa. Un actor malicioso puede bypassear el frontend; no puede bypassear las policies del backend.

El guard del frontend existe para:
- UX (no ver pantallas que no puedo usar).
- Evitar requests al backend que igual van a ser rechazados.
- Cargar los datos correctos para el contexto del usuario.

**Cuándo revisitar:**

- Si el backoffice crece hasta justificar su propio equipo con su propio ciclo de deploy independiente (improbable en el horizonte de este proyecto).

## Revisión (2026-08-30)

La decisión se mantiene: un solo Next.js con un route group por actor. Cambió el reparto, porque dos de los cinco actores del árbol de arriba no tienen hoy nada detrás.

**`(staff)` admite solo `admin`.** Un pase de QA encontró que de los cuatro roles solo `member` podía usar la aplicación: moderación se retiró en R2 y su rol quedó sin ninguna pantalla, cayendo en un 404, y `university_staff` nunca tuvo la suya. Los dos salieron del frontend, y el guard fino que cada sección repetía se borró por redundante. El enum del backend los conserva, que es donde está persistido el rol; vuelven al frontend cuando vuelva la feature, con su pantalla.

**`(teacher)` se retiró entero.** Tenía su `layout.tsx` con el guard y ninguna página, así que ni siquiera llegaba a ejecutarse: sin rutas debajo, un route group no existe. Su guard leía `session.teacherVerified`, un campo que el backend nunca emitió porque el aggregate `TeacherProfile` no está construido, y que por eso viajaba siempre `undefined` en el tipo de la sesión: el guard mandaba a `/teacher-claim` en el 100% de los casos posibles. La pantalla de reclamo sigue en pie, en `(member)`, que es donde se llega a ella. El grupo vuelve cuando exista qué poner adentro, que es responder reseñas (US-031 y la épica Responder).

