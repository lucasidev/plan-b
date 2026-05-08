# ADR-0041: Rediseño UX post-claude-design: delta y plan de migración

- **Estado**: aceptado
- **Fecha**: 2026-05-02

## Contexto

Después de cerrar el slice de auth + cleanup + StudentProfile en S1, hicimos una sesión completa de rediseño con claude-design (claude.ai/design). El bundle exportado vive en `docs/design/reference/` (versión vieja del mockup) y la nueva iteración produjo el design canvas `plan-b direcciones.html` con 12 secciones consolidadas:

⓪ Design System · ① Landing · ② Auth · ③ Onboarding · ④ Inicio · ⑤ Mi carrera · ⑥ Planificar · ⑦ Reseñas · ⑧ Rankings · ⑨ Búsqueda global · ⑩ Cuenta · ⑪ Soporte

Este ADR documenta **qué cambia respecto del estado actual del código** y **qué decisiones se tomaron** durante la sesión. La intención es congelar las decisiones para que el backlog futuro las refleje sin redebatir.

## Decisiones consolidadas

### Auth (sección ②)

**Antes**: una sola ruta `/auth` con `AuthView` que tiene tabs para Sign-up y Sign-in. Estado: shipped en S1.

**Después**: rutas top-level dentro del route group `(auth)`, sin double-namespacing. El route group no aparece en la URL (convención de Next.js App Router):
- `/sign-up`
- `/sign-in`
- `/forgot-password` (ya existe desde US-033-i)
- `/forgot-password/check-inbox` (ya existe desde US-033-i)
- `/reset-password` (ya existe desde US-033-i)
- `/verify-email` (ya existe desde US-011-f)

Razón: signup y signin son flujos distintos (no vistas equivalentes del mismo recurso). El AuthView de S1 mezcló dos verbos (registro vs autenticación) por economía visual; el rediseño lo separa para reducir fricción cognitiva. Las páginas viven todas bajo `app/(auth)/<page>/page.tsx` agrupadas por route group; repetir `auth/` adentro sería redundante (`/auth/sign-in` con el "auth" doble).

### Onboarding (sección ③)

**Antes**: no existe.

**Después**: 4 pasos secuenciales:
1. Bienvenida.
2. Carrera (universidad → carrera → plan).
3. Historial (PDF / manual / "después").
4. Listo.

Después del paso 4 el alumno aterriza en Inicio. Si elige "después" en el paso 3, el Inicio debe invitarlo a completar el historial (ver "Estados vacíos" abajo).

### Inicio (sección ④)

**Antes**: home con DecisionCards + CoursingNow (mock data hardcoded) implementada en S1.

**Después**: rediseñada con jerarquía clara: una "pregunta dominante" arriba (ej. "¿qué te anotás este cuatri?") y todo lo demás subordinado. El bloque de DecisionCards del actual queda como deuda visual hasta que aterrice el rediseño.

### Mi carrera (sección ⑤)

**Antes**: rutas separadas en `(member)/{plan,subjects,professors,history,...}/page.tsx` (stubs ComingSoon).

**Después**: una sola ruta `/mi-carrera` con **5 tabs**:
1. Plan
2. Correlativas (grafo)
3. Catálogo (de materias)
4. Docentes
5. Historial académico

Plus drawers / detalles para cada materia (`/mi-carrera/materia/[code]`) y cada docente (`/mi-carrera/docente/[id]`).

Razón: las 4 vistas v1 (Plan, Materias, Docentes, Historial) eran del mismo dominio académico personal del alumno y dispersarlas en el sidebar era inflar nav sin payoff. Consolidación en tabs reduce 4-5 entradas del sidebar a 1.

### Planificar (sección ⑥, rename del Simulador)

**Antes**: `(member)/simulator/page.tsx` (stub ComingSoon).

**Después**: ruta `/planificar` con **2 tabs**:
1. En curso (período activo, editable: agregar materias, sumar comisiones).
2. Borrador (períodos futuros).

Promoción de borrador a en-curso: **manual con nudge** ("tu período 2026 empezó hace X días, ¿lo activás?"). Decisión consolidada en la sesión de claude-design.

Periodo = año lectivo (no cuatrimestre). Las materias dentro del período tienen modalidad propia (cuatrimestral 1c, anual, bimestral, etc.) que viene del plan de estudios, no se elige.

### Reseñas (sección ⑦)

**Antes**: stub `(member)/reviews/page.tsx` + `(member)/reviews/new/page.tsx`.

**Después**: ruta `/reseñas` con **3 tabs**:
1. Explorar (reseñas públicas).
2. Pendientes (materias cursadas que el alumno aún no reseñó).
3. Mías (las propias).

Plus editor de reseña en `/reseñas/escribir/[cursada-id]` con **6 campos numerados**:
1. Rating general (1-5 ★).
2. Dificultad (1-5).
3. Horas de estudio/semana (slider, opcional).
4. Texto libre (opcional, sin mínimo).
5. Tags rápidos preseleccionables (claro, exige, responde tarde, TPs buenos, aprueba justo, etc.): múltiples.
6. Recomendaciones sí/no:
   - Recomendarías esta cursada.
   - Volverías a tomar a este docente.

**Una reseña por cursada** = (materia + docente + comisión + cuatri en una sola reseña). Decisión consolidada en la sesión.

Sidebar del editor con **preview vivo** de cómo va a verse la reseña.

### Rankings (sección ⑧, NUEVO)

**Antes**: no existe.

**Después**: ruta `/rankings` que muestra:
- Top docentes mejor reseñados.
- Top materias más temidas.
- Top comisiones más recomendadas.
- Otros (a definir según métricas que aparezcan útiles).

**Display**: top 10 visibles + paginado para ver el resto. Decisión consolidada en la sesión.

### Búsqueda global (sección ⑨, NUEVO)

**Antes**: no existe.

**Después**: dropdown desde el topbar (no página dedicada). Resultados agrupados:
- Recientes (búsquedas previas del alumno).
- Docentes.
- Materias.
- Comisiones.

Highlight del query en cada resultado. Atajos de teclado (⌘K para abrir, flechas para navegar).

**Backend**: Meilisearch como motor (ADR-0039).

### Cuenta (sección ⑩)

**Antes**: stub `(member)/profile/page.tsx` + `(member)/settings/page.tsx`.

**Después**: split clarificado:
- **Mi perfil**: identidad del usuario (nombre, mail, datos académicos: universidad, carrera, plan, año, legajo, estado regular, foto). Acceso desde **menú del avatar** en footer del sidebar.
- **Ajustes**: config de la app (notificaciones, privacidad, idioma, tema). Acceso desde **item propio** en sección "Otros" del sidebar.

Razón: ajustes de la app no tienen nada que ver con identidad. Mezclarlos era vagancia mental.

### Soporte (sección ⑪, NUEVO)

**Antes**: no existe.

**Después**: 2 páginas planas en sección "Otros" del sidebar:
- **Ayuda**.
- **Sobre plan-b**.

### Sidebar v2

**Antes**: 3 secciones (Mi cuatrimestre, Comunidad, Cuenta) implementada en US-042-f.

**Después**:
- **Producto** (sin label, top): Inicio · Planificar · Reseñas · Mi carrera · Rankings.
- **Otros** (con label, footer): Ajustes · Ayuda · Sobre plan-b.
- **Avatar** (footer): menú con Mi perfil + Cerrar sesión.

### Topbar v2

- **Logo + período** (ej. "2026") en lugar de breadcrumbs.
- **Búsqueda global** central (dropdown).
- **Campanita de notificaciones** con badge de unread.
- **CTA accent** "Escribir reseña" (cuando aplique).
- **Avatar** a la derecha.

Sin "v0.2" en el logo (era artefacto del canvas, no del producto).

## Decisiones cross-cutting

1. **Web first, mobile later**. Lucas confirmó: el MVP va a web; mobile entra como deuda diferida explícita. No se escribe CSS responsive ahora (más allá de lo que ya hicimos en S1).
2. **Patrón "tabs"** como herramienta principal de organización en vistas con sub-secciones (Mi carrera, Planificar, Reseñas).
3. **Meilisearch** como motor de búsqueda global ([ADR-0039](0039-meilisearch-como-motor-de-búsqueda-global.md)).
4. **Notifications** como bounded context nuevo ([ADR-0040](0040-notifications-como-bounded-context.md)).
5. **Estados vacíos invitan a completar el estado académico**: cuando un alumno entra a Inicio sin historial cargado, sin reseñas pendientes, sin nada: la pantalla lo invita a cargar el historial (link al onboarding del paso 3) o a planificar el próximo cuatri. Empty state empuja al user al next step.
6. **Truncar últimos 3** (TBD): patrón a aplicar a alguna lista (probable: reseñas en detalle de materia o historial). Aterriza cuando una US específica lo necesite.

## Cambios pendientes que NO se zanjaron en la sesión

- **Estados de error** (404, 500, network down, expired session): pendiente diseño en próxima ronda.
- **Modales de confirmación** (borrar reseña, cerrar sesión, etc.): pendiente diseño.
- **Real-time** vs polling para notificaciones: arrancar con polling, evaluar push después.
- **Pattern "truncar últimos 3"**: a qué lista aplica exactamente.
- **Set de tags** del editor de reseña (claro / exige / responde tarde / TPs buenos / aprueba justo / etc.): el set propuesto es ejemplo, no aprobado. Decidir taxonomy concreta cuando aterrice la US del editor.

## Plan de migración

### Lo que invalida el rediseño respecto del código actual

- `AuthView` con tabs (S1) → reemplazar por 4 rutas separadas. **Deuda explícita**, no urgente: el AuthView funciona end-to-end, la migración a 4 rutas es UX polish.
- Stub pages `(member)/{plan, simulator, subjects, professors, history, settings}/page.tsx` → reemplazar por `/mi-carrera` consolidada + `/planificar` + `/ajustes`. La consolidación libera entradas del sidebar.
- Sidebar actual (3 secciones) → reemplazar por v2 (Producto / Otros + avatar menu).
- Home actual (`(member)/home/page.tsx` con DecisionCards mock) → rediseñar con la "pregunta dominante" del v2.

### Roadmap confirmado (decisión 2026-05-03)

El alcance por sprint está cerrado; el orden interno de cada sprint se afina al planificar.

**S2: Auth + Onboarding + Inicio + Mi carrera shell**
- [US-036](../domain/user-stories/US-036.md): Auth rebuild (4 rutas separadas).
- [US-037](../domain/user-stories/US-037.md): Onboarding 4 pasos.
- [US-044](../domain/user-stories/US-044.md): Inicio v2 con pregunta dominante.
- [US-045](../domain/user-stories/US-045.md): Mi carrera shell + 5 tabs con stub data. **Backend de Academic CRUD queda como deuda diferida**: se hace después del shell. Lucas decide en planning si entra en S2 o se difiere a S3 según cómo venga el sprint.

**S3: Planificar + Mi perfil + self-disable**
- [US-046](../domain/user-stories/US-046.md): Planificar shell + 2 tabs + nudge de promoción manual.
- [US-047](../domain/user-stories/US-047.md): Mi perfil (view + edit + foto, acceso desde menú del avatar).
- [US-075](../domain/user-stories/US-075.md): Member self-disable (zona peligrosa de Mi perfil).

**S4: Reseñas + Rankings**
- [US-017](../domain/user-stories/US-017.md), [US-018](../domain/user-stories/US-018.md), [US-019](../domain/user-stories/US-019.md), [US-020](../domain/user-stories/US-020.md): Backend completo de reseñas (publicar / editar / reportar / ver mis reports).
- [US-048](../domain/user-stories/US-048.md): Reseñas shell + 3 tabs.
- [US-049](../domain/user-stories/US-049.md): Editor de reseña 6 campos numerados con preview vivo.
- [US-070](../domain/user-stories/US-070.md): Rankings top 10 paginado.

**S5: Búsqueda global + Ajustes + Soporte**
- [US-071](../domain/user-stories/US-071.md): Búsqueda global topbar dropdown (Meilisearch).
- [US-072](../domain/user-stories/US-072.md): Ajustes (notificaciones / privacidad / idioma / tema).
- [US-073](../domain/user-stories/US-073.md): Ayuda (FAQ + contacto soporte).
- [US-074](../domain/user-stories/US-074.md): Sobre plan-b (página informacional + créditos).

**Backlog open (sin sprint asignado)**:
- US-001 a US-004 (catálogo público), US-013/14/15 (historial backend), US-016 + US-023..027 (simulación + planning storage backend), US-030 a US-032 + US-040/041 + US-066 (claim docente), US-050..053 (moderación), US-060..065 (backoffice catálogo), US-067 (cuentas staff), US-068 (admin/mod disable), US-080 (dashboard institucional).
- Estados de error (404 / 500 / network down / expired session), modales de confirmación, mobile completo: pendientes de diseño en próxima ronda.

### Lo que NO migra (deuda explícita aceptada)

- Mobile completo: post-MVP.
- AuthView con tabs (S1): aceptamos divergencia con el mockup hasta que la US de "Auth rebuild" aterrice.
- DecisionCards / CoursingNow del home actual: stub visual hasta que aterrice el "Inicio v2 con pregunta dominante".

## Refs

- Bundle de claude-design: `docs/design/reference/` (vieja iteración) + el bundle exportado el 2026-05-02 con el canvas `plan-b direcciones.html` (no commiteado al repo, vive en el filesystem local de Lucas).
- ADR-0039 (Meilisearch).
- ADR-0040 (Notifications BC).
- US futuras: ver sección "Plan de migración" arriba; `user-stories.md` se actualiza en este mismo PR con las entries en backlog.
