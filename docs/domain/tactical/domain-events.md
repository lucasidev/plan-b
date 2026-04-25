# Domain Events — planb

Catálogo de events del modelo, agrupados por Bounded Context.

**Domain event vs Integration event**:

- **Domain event** (`IDomainEvent`) — algo que pasó dentro de un BC. Lo emite un aggregate. Lo consumen handlers del mismo BC.
- **Integration event** (`IIntegrationEvent`) — algo que cruza BCs. Se publica vía Wolverine outbox para asegurar at-least-once delivery. Lo consumen handlers de otros BCs.

Algunos events del modelo son **ambos**: el aggregate los emite como domain events, y un handler local los traduce a integration events para publicación cross-BC. Lo flageamos cuando aplica.

Toda la infraestructura está en [`shared-kernel`](../../../backend/libs/shared-kernel/src/Planb.SharedKernel/) (`IDomainEvent`, `IDomainEventPublisher`, `DomainEventDispatcher`).

---

## Convenciones

- **Past tense.** Un event es algo que YA pasó: `UserRegistered`, no `RegisterUser`.
- **Carga inmutable.** Los events son `record` con propiedades `init`. Una vez creados, no se modifican.
- **`OccurredAt` como timestamp canónico** del momento en que el event sucedió en dominio. Distinto de `committedAt` (cuándo se persistió) y `dispatchedAt` (cuándo se publicó al bus).
- **IDs como tipos strongly-typed** (`UserId`, `ReviewId`, etc.) para evitar mixing.

---

## Identity

### Domain events emitidos por `User`

| Event | Cuándo se emite | Carga |
|---|---|---|
| `UserRegistered` | Después de `User.Register(email, hash)` | `UserId`, `EmailAddress`, `OccurredAt` |
| `StaffUserCreated` | Después de `User.CreateStaff(email, hash, role)` | `UserId`, `EmailAddress`, `UserRole`, `OccurredAt` |
| `UserEmailVerified` | Después de `User.MarkEmailVerifiedFor(rawToken)` exitoso | `UserId`, `OccurredAt` |
| `UserDisabled` | Después de `User.Disable(byId, reason)` | `UserId`, `DisabledById`, `Reason`, `OccurredAt` |
| `UserRestored` | Después de `User.Restore()` | `UserId`, `OccurredAt` |
| `UnverifiedRegistrationExpired` | Después de `User.ExpireUnverifiedRegistration()` (terminal) | `UserId`, `OccurredAt` |
| `VerificationTokenIssued` | Cuando se agrega un token al collection del User | `UserId`, `VerificationTokenId`, `Purpose`, `ExpiresAt`, `OccurredAt` |
| `VerificationTokenConsumed` | Cuando un token se consume exitosamente | `UserId`, `VerificationTokenId`, `Purpose`, `OccurredAt` |
| `VerificationTokenInvalidated` | Cuando un token se invalida (resend, force expire) | `UserId`, `VerificationTokenId`, `Purpose`, `Reason`, `OccurredAt` |

### Integration events de Identity

| Event | Origen | Consumers |
|---|---|---|
| `UserDisabledIntegrationEvent` | Translated from `UserDisabled` | Reviews, Moderation |
| `TeacherProfileVerifiedIntegrationEvent` | Translated from `TeacherProfileVerifiedByInstitutionalEmail` o `TeacherProfileVerifiedManually` | Reviews (capability `review:respond`) |

### Domain events de StudentProfile / TeacherProfile

| Event | Aggregate | Notas |
|---|---|---|
| `StudentProfileCreated` | StudentProfile | `UserId`, `CareerPlanId`, `EnrollmentYear`, `OccurredAt` |
| `StudentProfileMarkedGraduated` | StudentProfile | `StudentProfileId`, `GraduatedAt`, `OccurredAt` |
| `StudentProfileMarkedAbandoned` | StudentProfile | `StudentProfileId`, `OccurredAt` |
| `TeacherProfileClaimInitiated` | TeacherProfile | `TeacherProfileId`, `UserId`, `TeacherId`, `OccurredAt` |
| `TeacherProfileInstitutionalEmailSubmitted` | TeacherProfile | `TeacherProfileId`, `EmailAddress`, `OccurredAt` |
| `TeacherProfileVerifiedByInstitutionalEmail` | TeacherProfile | `TeacherProfileId`, `OccurredAt` |
| `TeacherProfileEvidenceSubmitted` | TeacherProfile | `TeacherProfileId`, `EvidenceFileIds[]`, `OccurredAt` |
| `TeacherProfileVerifiedManually` | TeacherProfile | `TeacherProfileId`, `ApprovedByAdminId`, `OccurredAt` |
| `TeacherProfileVerificationRejected` | TeacherProfile | `TeacherProfileId`, `Reason`, `RejectedByAdminId`, `OccurredAt` |

---

## Academic

Catálogo de eventos CRUD-flavored. La mayoría son emitidos para audit y para que otros BCs (raramente) puedan reaccionar.

| Event | Aggregate | Notas |
|---|---|---|
| `UniversityCreated`, `UniversityUpdated` | University | — |
| `CareerCreated`, `CareerUpdated` | Career | — |
| `CareerPlanCreated`, `CareerPlanRetired` | CareerPlan | `Retired` cuando se setea `EffectiveTo` |
| `SubjectCreated`, `SubjectUpdated`, `SubjectArchived` | Subject | — |
| `PrerequisiteAdded`, `PrerequisiteRemoved` | Subject | Operación sobre child entity Prerequisite, emitido por el aggregate root |
| `TeacherCreated`, `TeacherUpdated`, `TeacherDeactivated` | Teacher | — |
| `AcademicTermCreated`, `AcademicTermUpdated` | AcademicTerm | — |
| `CommissionCreated`, `CommissionUpdated` | Commission | — |
| `CommissionTeacherAssigned`, `CommissionTeacherUnassigned` | Commission | Operación sobre child entity CommissionTeacher |

Sin integration events cross-BC en MVP — el catálogo es estable y no suele cambiar lo suficiente como para que otros BCs reaccionen activamente.

---

## Enrollments

| Event | Aggregate | Notas |
|---|---|---|
| `HistorialImportRequested` | HistorialImport | `ImportId`, `StudentProfileId`, `SourceType`, `OccurredAt` |
| `HistorialImportCompleted` | HistorialImport | `ImportId`, `ResolvedRows`, `UnresolvedRows`, `OccurredAt` |
| `HistorialImportFailed` | HistorialImport | `ImportId`, `Error`, `OccurredAt` |
| `EnrollmentRecordCreated` | EnrollmentRecord | `RecordId`, `StudentProfileId`, `SubjectId`, `AcademicTermId`, `Status`, `OccurredAt`. Emitido en cada creación, sea manual o desde import (HOT 6) |
| `EnrollmentRecordEdited` | EnrollmentRecord | `RecordId`, `Changes` (diff de campos cambiados), `OccurredAt`. **También integration event** — Reviews lo consume (HOT 5, ADR-0032) |

### Integration events de Enrollments

| Event | Consumers |
|---|---|
| `EnrollmentRecordEditedIntegrationEvent` | Reviews — policy `InvalidateReviewIfEnrollmentNoLongerValid` |

---

## Reviews

| Event | Aggregate | Notas |
|---|---|---|
| `ReviewPublished` | Review | `ReviewId`, `EnrollmentRecordId`, `OccurredAt`. **También integration event** — Moderation lo consume para audit |
| `ReviewQuarantined` | Review | `ReviewId`, `Reason` ∈ {AutoFilter, ReportThreshold, Other}, `OccurredAt`. Integration event |
| `ReviewEdited` | Review | `ReviewId`, `Changes`, `OccurredAt`. Integration event |
| `ReviewInvalidated` | Review | `ReviewId`, `TriggeringEventId` (referencia al EnrollmentRecordEdited), `OccurredAt` |
| `ReviewRemoved` | Review | `ReviewId`, `RemovalReason`, `OccurredAt`. Integration event |
| `ReviewRestored` | Review | `ReviewId`, `RestoredBy`, `OccurredAt`. Integration event |
| `TeacherResponsePublished` | Review (operación sobre child) | `ReviewId`, `AuthorTeacherProfileId`, `OccurredAt`. Integration event |
| `TeacherResponseEdited` | Review | `ReviewId`, `OccurredAt`. Integration event |

### Integration events que Reviews consume

| Event | Source | Policy |
|---|---|---|
| `EnrollmentRecordEditedIntegrationEvent` | Enrollments | `InvalidateReviewIfEnrollmentNoLongerValid` |
| `UserDisabledIntegrationEvent` | Identity | `SoftFlagReviewsForPresentationOnUserDisabled` (visibilidad) |
| `TeacherProfileVerifiedIntegrationEvent` | Identity | (futuro) habilita capability `review:respond` |
| `ReportUpheldIntegrationEvent` | Moderation | `RemoveReviewOnReportUpheld` |

---

## Moderation

| Event | Aggregate | Notas |
|---|---|---|
| `ReviewReported` | ReviewReport | `ReportId`, `ReviewId`, `ReporterId`, `Reason`, `OccurredAt` |
| `ReportUpheld` | ReviewReport | `ReportId`, `ReviewId`, `ModeratorId`, `ResolutionNote`, `OccurredAt`. Integration event |
| `ReportDismissed` | ReviewReport | `ReportId`, `ReviewId`, `ModeratorId`, `ResolutionNote`, `OccurredAt`. Integration event |

### Integration events que Moderation consume

| Event | Source | Policy / Consumer |
|---|---|---|
| `ReviewPublished` | Reviews | `AppendToAuditLog` |
| `ReviewQuarantined` | Reviews | `AppendToAuditLog` + `EnqueueModerationQueue` |
| `ReviewEdited` | Reviews | `AppendToAuditLog` |
| `ReviewRemoved` | Reviews | `AppendToAuditLog` |
| `ReviewRestored` | Reviews | `AppendToAuditLog` |
| `TeacherResponsePublished` | Reviews | `AppendToAuditLog` |
| `TeacherResponseEdited` | Reviews | `AppendToAuditLog` |
| `UserDisabledIntegrationEvent` | Identity | `AppendToAuditLog` |

ReviewAuditLog (projection) se construye exclusivamente a partir de estos events — append-only, sin escrituras directas.

---

## Planning

| Event | Aggregate | Notas |
|---|---|---|
| `SimulationDraftSaved` | SimulationDraft | `DraftId`, `OwnerProfileId`, `Subjects[]`, `TermId`, `OccurredAt` |
| `SimulationDraftEdited` | SimulationDraft | `DraftId`, `Changes`, `OccurredAt` |
| `SimulationDraftDeleted` | SimulationDraft | `DraftId`, `OccurredAt` |
| `SimulationDraftShared` | SimulationDraft | `DraftId`, `OccurredAt`. Pasa a corpus público |
| `SimulationDraftUnshared` | SimulationDraft | `DraftId`, `OccurredAt`. Vuelve a privado |

Sin integration events cross-BC en MVP. Recomendación de simulaciones (post-MVP) consumirá events de Reviews vía read model.

---

## Patrones

### Domain → Integration translation

Los aggregates emiten **domain events**. Un handler dentro del BC los traduce a integration events publicados al bus cuando otros BCs deben enterarse:

```csharp
// Reviews/Application/EventHandlers/UserDisabledHandler.cs (cross-BC consumer)
public static async Task HandleAsync(
    UserDisabledIntegrationEvent integrationEvent,
    IReviewRepository reviews,
    IDateTimeProvider clock,
    CancellationToken ct)
{
    // policy: soft-flag reviews del user disabled
    var userReviews = await reviews.FindByAuthorAsync(integrationEvent.UserId, ct);
    foreach (var review in userReviews)
    {
        review.MarkAuthorDisabled(clock); // emite ReviewAuthorMarkedAsDisabled domain event
    }
}
```

### Domain events dispatch

Aggregates emiten via `Raise(event)`. El application handler, después de mutar el aggregate, llama a `DomainEventDispatcher.DispatchAsync([aggregate], publisher, ct)` antes de SaveChanges. El publisher (`WolverineDomainEventPublisher`) los enrolla en el outbox de Wolverine en la misma transacción.

Este flow está implementado y funcional desde slice B. Ver `RegisterUserCommandHandler.Handle` como ejemplo.

### Versioning de events

En MVP no versionamos events explícitamente. Cuando aparezca el primer cambio breaking en un event ya publicado en producción, agregamos sufijo `V2` y mantenemos el handler de `V1` para deserialization de mensajes antiguos del outbox. Mientras tanto, asumimos que los events están en su versión `V1` implícita.

---

## Cómo agregar un event nuevo

1. Crear el record en `<Module>.Domain/<Aggregate>/Events/`.
2. Implementar `IDomainEvent` (con `OccurredAt`).
3. Hacer que el aggregate lo emita vía `Raise(...)` en el método que lo produce.
4. Si cruza BCs:
   - Crear su contraparte integration event en `<SourceModule>.Application/IntegrationEvents/`.
   - Agregar handler que traduce domain → integration.
   - Documentar consumers en este doc.
5. Tests unitarios del aggregate verificando el event en `DomainEvents`.
6. Test integration de la policy si hay handler.
