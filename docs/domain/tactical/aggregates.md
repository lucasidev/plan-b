# Aggregates: planb

Inventario tactical DDD del modelo. Cada aggregate vive en su propio archivo dentro de [aggregates/](aggregates/).

Convención **Vernon/Khorikov**: si una entidad se loadea independientemente, es un aggregate. NO existen "standalone entities". Distinguimos rich vs lean según complejidad interna, no según si tiene `IAggregateRoot` (todos lo tienen).

## Rich aggregates (4)

Tienen invariantes complejas, child entities relevantes o lifecycle no trivial.

| Aggregate | BC | Root ID | Child entities |
|---|---|---|---|
| [User](aggregates/User.md) | Identity | `UserId` | `VerificationToken` |
| [EnrollmentRecord](aggregates/EnrollmentRecord.md) | Enrollments | `EnrollmentRecordId` | ninguna |
| [Review](aggregates/Review.md) | Reviews | `ReviewId` | `TeacherResponse` |
| [SimulationDraft](aggregates/SimulationDraft.md) | Planning | `SimulationDraftId` | ninguna |

## Lean aggregates (11)

Sin child entities relevantes o con CRUD admin con un par de chequeos. Mayormente lifecycle CRUD básico.

| Aggregate | BC | Root ID | Child entities |
|---|---|---|---|
| [University](aggregates/University.md) | Academic | `UniversityId` | ninguna |
| [Career](aggregates/Career.md) | Academic | `CareerId` | ninguna |
| [CareerPlan](aggregates/CareerPlan.md) | Academic | `CareerPlanId` | ninguna |
| [Subject](aggregates/Subject.md) | Academic | `SubjectId` | `Prerequisite` |
| [Teacher](aggregates/Teacher.md) | Academic | `TeacherId` | ninguna |
| [AcademicTerm](aggregates/AcademicTerm.md) | Academic | `AcademicTermId` | ninguna |
| [Commission](aggregates/Commission.md) | Academic | `CommissionId` | `CommissionTeacher` |
| [StudentProfile](aggregates/StudentProfile.md) | Identity | `StudentProfileId` | ninguna |
| [TeacherProfile](aggregates/TeacherProfile.md) | Identity | `TeacherProfileId` | ninguna (gana `VerificationToken` post-MVP, pasa a rich) |
| [HistorialImport](aggregates/HistorialImport.md) | Enrollments | `HistorialImportId` | ninguna |
| [ReviewReport](aggregates/ReviewReport.md) | Moderation | `ReviewReportId` | ninguna |

## Projections (2)

Read models construidos por listeners de events. No son aggregates, no tienen lifecycle propio.

| Projection | BC | Source |
|---|---|---|
| [ReviewAuditLog](projections/ReviewAuditLog.md) | Moderation | events de Reviews + `UserDisabled` |
| [FailedHistorialImportLine](projections/FailedHistorialImportLine.md) | Enrollments | resultado del worker que procesa `HistorialImport` |

## Criterio rich vs lean

**Rich** cuando se cumple alguna de:

- Hay invariantes que abarcan múltiples objetos del aggregate (ej. "como mucho un VerificationToken activo por purpose" en User).
- El aggregate tiene state machine no trivial con varios commands que la mueven (ej. Review con publish / edit / quarantine / remove / restore / invalidate).
- El aggregate emite muchos events o coordina cross-BC (ej. EnrollmentRecord con edit destructive que invalida Reviews).

**Lean** cuando es CRUD admin con un par de chequeos puntuales: validaciones de campos, unicidad, alguna invariante simple. El aggregate sigue teniendo `IAggregateRoot` y repositorio propio: lo único que cambia es la complejidad del walkthrough.

## Cómo este doc se mantiene actualizado

Cuando un lean aggregate gana child entities relevantes o lifecycle complejo (ej. TeacherProfile cuando incorpore VerificationToken para institutional verification), se mueve la entry de la tabla "Lean" a "Rich" y se actualiza su archivo individual.

## Refs

- BCs: [strategic/bounded-contexts.md](../strategic/bounded-contexts.md)
- ERD: [architecture/data-model.md](../../architecture/data-model.md)
- VOs: [value-objects.md](value-objects.md), [shared-kernel.md](shared-kernel.md)
- Events: [domain-events.md](domain-events.md)
- Hot spots EventStorming: [eventstorming.md](../eventstorming.md)
