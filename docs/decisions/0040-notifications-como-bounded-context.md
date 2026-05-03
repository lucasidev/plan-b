# ADR-0040: Notifications como bounded context nuevo

- **Estado**: aceptado
- **Fecha**: 2026-05-02

## Contexto

El rediseño UX (claude-design) suma una **campanita de notificaciones** en el topbar con badge de unread + panel dropdown que muestra qué eventos llegaron. La idea es que el alumno vea actividad relevante sin tener que pollear las pantallas.

Eventos disparadores definidos (4 triggers iniciales):

1. **Reseña publicada en una materia que el alumno cursa actualmente** — "Hay una reseña nueva de ISW302 (que estás cursando)".
2. **Reseña publicada sobre un docente con el que el alumno cursó** — "Hay una reseña nueva sobre Brandt (cursaste con él en 2024·1c)".
3. **Una reseña propia del alumno fue reportada** — "Tu reseña de MAT201 fue reportada y está en moderación".
4. **Una reseña propia del alumno recibió una valoración (helpful)** — "Tu reseña de QUI301 marcó 5 personas como útil".

Esos 4 son el primer set. Más triggers van a aparecer (respuesta de docente verificado a una reseña tuya, claim de docente aprobado, etc.) — la arquitectura tiene que soportar agregar tipos sin re-trabajo.

Hoy el backend tiene 5 módulos (identity, academic, enrollments, reviews, moderation). Notifications cruza varios:

- **Reviews** sabe cuándo se publica una reseña (triggers 1, 2).
- **Moderation** sabe cuándo una reseña se reporta o recibe acción (trigger 3).
- **Reviews** sabe cuándo se valora (trigger 4).
- **Identity** sabe quién es el destinatario (StudentProfile resuelve "alumno que cursa X" o "alumno que cursó con Y").

Si Notifications vive dentro de Reviews, contamina la responsabilidad del módulo: Reviews pasa a saber cómo se entrega una notificación, cómo se persiste el estado read/unread, etc. Si vive dentro de Identity, Identity termina con responsabilidad de moderación. Cualquier "casa adoptiva" rompe boundaries.

## Decisión

**Notifications como bounded context nuevo, sexto módulo del monolito**: `Planb.Notifications`.

### Estructura

```
backend/modules/notifications/
├── src/
│   ├── Planb.Notifications.Domain/
│   │   ├── Notifications/
│   │   │   ├── Notification.cs (aggregate root)
│   │   │   ├── NotificationId.cs (IValueObject)
│   │   │   ├── NotificationKind.cs (enum: review_in_current_subject, review_about_past_teacher, ...)
│   │   │   ├── NotificationStatus.cs (Unread, Read)
│   │   │   ├── NotificationPayload.cs (JSONB-friendly DTO con datos del evento)
│   │   │   └── NotificationErrors.cs
│   │   └── Events/
│   │       └── NotificationCreatedDomainEvent.cs
│   ├── Planb.Notifications.Application/
│   │   ├── Contracts/  ← reads cross-BC para el dropdown del frontend
│   │   │   └── INotificationsQueryService.cs
│   │   ├── Features/
│   │   │   ├── MarkNotificationAsRead/
│   │   │   ├── MarkAllAsRead/
│   │   │   └── ...
│   │   └── Subscribers/  ← handlers de integration events de OTROS BCs
│   │       ├── ReviewPublishedSubscriber.cs (Reviews → Notifications)
│   │       ├── ReviewReportedSubscriber.cs (Moderation → Notifications)
│   │       └── ReviewVotedHelpfulSubscriber.cs (Reviews → Notifications)
│   └── Planb.Notifications.Infrastructure/
│       ├── Persistence/NotificationsDbContext.cs (schema "notifications")
│       └── Reading/DapperNotificationsQueryService.cs
└── tests/Planb.Notifications.Tests/
```

### Modelo del aggregate

Una `Notification` por par (recipient_user, evento). Fields mínimos:

- `Id` (NotificationId).
- `RecipientUserId` (UserId; cross-BC reference).
- `Kind` (enum).
- `Status` (Unread | Read).
- `Payload` (JSONB con shape específico per kind: subject_id, teacher_id, review_id, etc.).
- `Link` (deeplink al destino: `/reviews/<id>`, `/subject/<code>`, etc.).
- `CreatedAt`, `ReadAt?`.

Schema Postgres: tabla `notifications.notifications` con índices en `(recipient_user_id, created_at desc)` para el dropdown ordenado por fecha + filtro por unread.

### Cross-BC: integration events

Reviews y Moderation publican integration events via Wolverine outbox (ADR-0030):

- `Reviews.IntegrationEvents.ReviewPublished { ReviewId, AuthorUserId, SubjectId, TeacherId, CommissionId, Term, OccurredAt }`.
- `Reviews.IntegrationEvents.ReviewVotedHelpful { ReviewId, ReviewAuthorUserId, VoterUserId, OccurredAt }`.
- `Moderation.IntegrationEvents.ReviewReported { ReviewId, ReviewAuthorUserId, ReporterUserId, Reason, OccurredAt }`.

Notifications subscribers en `Application/Subscribers/`:

- `ReviewPublishedSubscriber`: recibe el event, consulta Identity para resolver "alumnos cursando subject_id" + "alumnos que cursaron con teacher_id", crea N notifications (una por destinatario).
- `ReviewReportedSubscriber`: una notification al author de la reseña.
- `ReviewVotedHelpfulSubscriber`: una notification al author si la valoración hace cruzar threshold (1, 5, 10) — diseño concreto cuando aterrice la US.

### Resolver "alumnos cursando X" cross-BC

El handler de `ReviewPublishedSubscriber` necesita preguntar a Identity "¿quiénes están cursando ISW302 en el período actual?" y "¿quiénes cursaron con Brandt alguna vez?". Eso es un `IIdentityQueryService` con métodos:

- `GetCurrentlyEnrolledInSubjectAsync(subjectId, termId)`.
- `GetPastStudentsOfTeacherAsync(teacherId)`.

Esos métodos viven en `Planb.Identity.Application.Contracts/` (cross-BC reads via Contracts, ADR-0017). Notifications.Application referencia Identity.Application a nivel csproj sólo para los Contracts (mismo patrón que Identity referencia Academic.Application en US-012).

### Frontend

Panel campanita en topbar muestra:

- Contador de unread como badge.
- Dropdown con últimas N notificaciones (TBD: cantidad).
- Click en una notif → marca como read + navega al link.
- "Marcar todas como leídas".

Real-time: para MVP, **polling cada 30-60 segundos** desde el frontend cuando la sesión está activa. WebSockets / SSE / push notifications quedan como deuda (ADR futuro si se justifica).

## Alternativas consideradas

### A. Notifications como sub-módulo de Reviews

Reviews "despacha" notificaciones cuando publica una reseña. Persistencia + read/unread vive dentro de Reviews.

Descartada porque:
- Triggers vienen de Moderation (reseña reportada) y eventualmente de Identity (claim aprobado, role change). Reviews no debería conocer esos eventos.
- El dropdown del frontend es transversal: muestra notifs de cualquier kind. Si Reviews "es dueño", el frontend tiene que componer queries de Reviews + Moderation + Identity, peor que un módulo dedicado.

### B. Notifications como cross-cutting concern (sin BC)

Servicio + tabla + handlers, todo en `host/Planb.Api/Infrastructure/Notifications/` sin módulo dedicado.

Descartada porque:
- Pierde el patrón modular monolith. Si Notifications crece (templates, channels: email/push/in-app, rate limiting), lo natural es que tenga su Domain + Application + Infrastructure como cualquier módulo.
- Difícil de testear: los handlers terminan acoplados al DbContext de Identity o de Reviews.

### C. Notifications como microservicio externo

Servicio separado del monolito.

Descartada por consistencia con la arquitectura modular monolith del proyecto (ADR-0014). Cuando se justifique extracción a microservicio, se hace después de que Notifications esté maduro como BC interno.

## Consecuencias

### Positivas

- **Boundaries limpios**: Notifications es responsable de su propio dominio (qué notif crear, cómo persiste, cómo se marca read). Los BCs publishers (Reviews, Moderation) sólo emiten eventos.
- **Extensibilidad**: agregar un nuevo kind (claim aprobado, respuesta de docente, etc.) es agregar un subscriber + un valor al enum + un payload shape. Sin tocar otros BCs.
- **Testeo**: el módulo tiene su unit + integration tests propios (mismo patrón que Identity / Academic).
- **Cross-BC reads disciplinados**: el resolver "quién cursa X" pasa por `IIdentityQueryService`, no por FK Postgres ni nav properties EF (ADR-0017).

### Negativas

- **Sexto módulo**: el monolito empieza a crecer. Aceptable en MVP de single-tenant; cuando se justifique multi-tenancy o split horizontal, los BCs son la unidad natural de extracción.
- **Latencia eventual**: hay un gap entre "se publica la reseña" y "el destinatario ve la notif" del orden de segundos (lo que tarde el outbox + el subscriber + el polling del frontend). Aceptable para notifs no-críticas.
- **Multi-row insert por evento**: una reseña puede generar 50-100 notifs (todos los alumnos cursando esa materia). El subscriber tiene que batch-insertar y tolerar fallos individuales (mismo pattern que `ExpireUnverifiedRegistrationsCommandHandler` de US-022).

### Riesgos a mitigar

- **Event storm**: si un docente hace una "responde-todo" y dispara 1000 notifs, el handler tiene que protegerse con rate limit. Diferido hasta caso real.
- **Notif spam para usuarios activos**: 100 reseñas por semana en una materia popular = 100 notifs. Mitigación futura: digest diario opcional (config en Ajustes). Por ahora, scope MVP.
- **Read/unread sync entre devices**: si el alumno marca read en mobile, también debería marcarse read en web. La fuente de verdad es Postgres así que automático.

## Refs

- ADR-0014 (modular monolith): Notifications es un BC más, sigue el mismo layout.
- ADR-0017 (persistence ignorance + cross-BC): reads via Contracts, no FK cross-schema.
- ADR-0030 (cross-BC consistency via Wolverine outbox): integration events son el pegamento.
- US futura (no asignada): "Notifications backend + 4 triggers" + "Notifications frontend (panel campanita)".
