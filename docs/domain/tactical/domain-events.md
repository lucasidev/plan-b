# Domain Events — planb

Catálogo cross-cutting de events del modelo. Cada event vive descrito en el archivo del aggregate que lo emite (ver [aggregates/](aggregates/)). Este doc es índice + reglas globales.

## Distinción: domain event vs integration event

- **Domain event** (`IDomainEvent`): algo que pasó dentro de un BC. Lo emite un aggregate. Lo consumen handlers del mismo BC.
- **Integration event** (`IIntegrationEvent`): algo que cruza BCs. Se publica vía Wolverine outbox para asegurar at-least-once delivery. Lo consumen handlers de otros BCs.

Algunos events del modelo son **ambos**: el aggregate los emite como domain events, y un handler local los traduce a integration events para publicación cross-BC. Lo flageamos cuando aplica en el archivo del aggregate.

Toda la infraestructura está en `Planb.SharedKernel` (`IDomainEvent`, `IDomainEventPublisher`, `DomainEventDispatcher`).

## Convenciones

- **Past tense**: un event es algo que YA pasó (`UserRegistered`, no `RegisterUser`).
- **Carga inmutable**: los events son `record` con propiedades `init`. Una vez creados, no se modifican.
- **`OccurredAt`** como timestamp canónico del momento en que el event sucedió en dominio. Distinto de `committedAt` (cuándo se persistió) y `dispatchedAt` (cuándo se publicó al bus).
- **IDs como tipos strongly-typed** (`UserId`, `ReviewId`, etc.) para evitar mixing.

## Catálogo por BC

### Identity

- `UserRegistered` → emitido por [User](aggregates/User.md)
- `StaffUserCreated` → [User](aggregates/User.md)
- `UserEmailVerified` → [User](aggregates/User.md)
- `UserDisabled` → [User](aggregates/User.md) (también integration event vía `UserDisabledIntegrationEvent`, consumido por Reviews y Moderation)
- `UserRestored` → [User](aggregates/User.md)
- `UnverifiedRegistrationExpired` → [User](aggregates/User.md)
- `VerificationTokenIssued` → [User](aggregates/User.md)
- `VerificationTokenConsumed` → [User](aggregates/User.md)
- `VerificationTokenInvalidated` → [User](aggregates/User.md)
- `StudentProfileCreated` → [StudentProfile](aggregates/StudentProfile.md)
- `StudentProfileMarkedGraduated` → [StudentProfile](aggregates/StudentProfile.md)
- `StudentProfileMarkedAbandoned` → [StudentProfile](aggregates/StudentProfile.md)
- `TeacherProfileClaimInitiated` → [TeacherProfile](aggregates/TeacherProfile.md)
- `TeacherProfileInstitutionalEmailSubmitted` → [TeacherProfile](aggregates/TeacherProfile.md)
- `TeacherProfileVerifiedByInstitutionalEmail` → [TeacherProfile](aggregates/TeacherProfile.md) (también integration event vía `TeacherProfileVerifiedIntegrationEvent`)
- `TeacherProfileEvidenceSubmitted` → [TeacherProfile](aggregates/TeacherProfile.md)
- `TeacherProfileVerifiedManually` → [TeacherProfile](aggregates/TeacherProfile.md) (también integration event vía `TeacherProfileVerifiedIntegrationEvent`)
- `TeacherProfileVerificationRejected` → [TeacherProfile](aggregates/TeacherProfile.md)

### Academic

Catálogo CRUD-flavored. Sin integration events cross-BC en MVP: el catálogo es estable y otros BCs no reaccionan activamente.

- `UniversityCreated`, `UniversityUpdated` → [University](aggregates/University.md)
- `CareerCreated`, `CareerUpdated` → [Career](aggregates/Career.md)
- `CareerPlanCreated`, `CareerPlanRetired` → [CareerPlan](aggregates/CareerPlan.md)
- `SubjectCreated`, `SubjectUpdated`, `SubjectArchived` → [Subject](aggregates/Subject.md)
- `PrerequisiteAdded`, `PrerequisiteRemoved` → [Subject](aggregates/Subject.md) (operación sobre child Prerequisite, emitido por root)
- `TeacherCreated`, `TeacherUpdated`, `TeacherDeactivated` → [Teacher](aggregates/Teacher.md)
- `AcademicTermCreated`, `AcademicTermUpdated` → [AcademicTerm](aggregates/AcademicTerm.md)
- `CommissionCreated`, `CommissionUpdated` → [Commission](aggregates/Commission.md)
- `CommissionTeacherAssigned`, `CommissionTeacherUnassigned` → [Commission](aggregates/Commission.md) (operación sobre child CommissionTeacher)

### Enrollments

- `HistorialImportRequested` → [HistorialImport](aggregates/HistorialImport.md)
- `HistorialImportCompleted` → [HistorialImport](aggregates/HistorialImport.md)
- `HistorialImportFailed` → [HistorialImport](aggregates/HistorialImport.md)
- `EnrollmentRecordCreated` → [EnrollmentRecord](aggregates/EnrollmentRecord.md)
- `EnrollmentRecordEdited` → [EnrollmentRecord](aggregates/EnrollmentRecord.md) (también integration event vía `EnrollmentRecordEditedIntegrationEvent`, consumido por Reviews con policy `InvalidateReviewIfEnrollmentNoLongerValid`)

### Reviews

Casi todos también integration events publicados al outbox para Moderation (audit log).

- `ReviewPublished` → [Review](aggregates/Review.md) (integration)
- `ReviewQuarantined` → [Review](aggregates/Review.md) (integration)
- `ReviewEdited` → [Review](aggregates/Review.md) (integration)
- `ReviewInvalidated` → [Review](aggregates/Review.md)
- `ReviewRemoved` → [Review](aggregates/Review.md) (integration)
- `ReviewRestored` → [Review](aggregates/Review.md) (integration)
- `TeacherResponsePublished` → [Review](aggregates/Review.md) (integration, operación sobre child)
- `TeacherResponseEdited` → [Review](aggregates/Review.md) (integration)

### Moderation

- `ReviewReported` → [ReviewReport](aggregates/ReviewReport.md)
- `ReportUpheld` → [ReviewReport](aggregates/ReviewReport.md) (también integration event vía `ReportUpheldIntegrationEvent`, consumido por Reviews con policy `RemoveReviewOnReportUpheld`)
- `ReportDismissed` → [ReviewReport](aggregates/ReviewReport.md) (integration)

### Planning

Sin integration events cross-BC en MVP. Recomendación de simulaciones (post-MVP) consumirá events de Reviews vía read model.

- `SimulationDraftSaved` → [SimulationDraft](aggregates/SimulationDraft.md)
- `SimulationDraftEdited` → [SimulationDraft](aggregates/SimulationDraft.md)
- `SimulationDraftShared` → [SimulationDraft](aggregates/SimulationDraft.md)
- `SimulationDraftUnshared` → [SimulationDraft](aggregates/SimulationDraft.md)
- `SimulationDraftDeleted` → [SimulationDraft](aggregates/SimulationDraft.md)

## Integration events: matriz cross-BC

| Integration event | Origen | Consumers |
|---|---|---|
| `UserDisabledIntegrationEvent` | Identity (`UserDisabled`) | Reviews (`SoftFlagReviewsForPresentationOnUserDisabled`), Moderation (audit log) |
| `TeacherProfileVerifiedIntegrationEvent` | Identity (`TeacherProfileVerifiedByInstitutionalEmail` o `TeacherProfileVerifiedManually`) | Reviews (capability `review:respond`) |
| `EnrollmentRecordEditedIntegrationEvent` | Enrollments (`EnrollmentRecordEdited`) | Reviews (`InvalidateReviewIfEnrollmentNoLongerValid`) |
| `ReportUpheldIntegrationEvent` | Moderation (`ReportUpheld`) | Reviews (`RemoveReviewOnReportUpheld`) |

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

Este flow está implementado y funcional desde S0. Ver `RegisterUserCommandHandler.Handle` como ejemplo.

### Versioning de events

En MVP no versionamos events explícitamente. Cuando aparezca el primer cambio breaking en un event ya publicado en producción, agregamos sufijo `V2` y mantenemos el handler de `V1` para deserialization de mensajes antiguos del outbox. Mientras tanto, asumimos que los events están en su versión `V1` implícita.

## Outbox y eventual consistency

Ver [ADR-0030](../../decisions/0030-cross-bc-consistency-via-wolverine-outbox.md) para la decisión de usar Wolverine outbox como mecanismo de consistencia cross-BC.

## Cómo agregar un event nuevo

1. Crear el record en `<Module>.Domain/<Aggregate>/Events/`.
2. Implementar `IDomainEvent` (con `OccurredAt`).
3. Hacer que el aggregate lo emita vía `Raise(...)` en el método que lo produce.
4. Si cruza BCs:
   - Crear su contraparte integration event en `<SourceModule>.Application/IntegrationEvents/`.
   - Agregar handler que traduce domain → integration.
   - Documentar consumers en este doc + en el archivo del aggregate.
5. Tests unitarios del aggregate verificando el event en `DomainEvents`.
6. Test integration de la policy si hay handler.

## Refs

- Aggregates: [aggregates/](aggregates/)
- ADRs: [ADR-0030](../../decisions/0030-cross-bc-consistency-via-wolverine-outbox.md)
