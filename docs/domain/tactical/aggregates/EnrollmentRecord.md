# EnrollmentRecord (Enrollments)

**Tipo**: rich
**BC**: Enrollments
**Root ID**: `EnrollmentRecordId`
**Child entities**: ninguna (rich por complejidad de invariantes y emisión de events cross-BC, no por tener children)

## Walkthrough Brandolini Software Design Level

### 1. Commands aceptados

| Command | Disparado por | Efecto |
|---|---|---|
| `Create(profileId, subjectId, termId, status, grade?, approvalMethod?, clock)` | Member desde UI manual o desde HistorialImport resolución | Crea registro con la combinación dada. Valida invariantes intra (status / grade / approvalMethod consistentes). Emite `EnrollmentRecordCreated`. |
| `Edit(changes, clock)` | Member desde UI | Aplica cambios sobre status / grade / approvalMethod. Si el cambio es destructive (volver a `cursando` desde un terminal y había Review existente), emite `EnrollmentRecordEdited` con el diff completo. |

### 2. Events emitidos

| Event | Cuándo | Consumido por |
|---|---|---|
| `EnrollmentRecordCreated` | Después de `Create` (manual o desde import) | Enrollments (audit), Planning (read model de "materias cursadas") |
| `EnrollmentRecordEdited` | Después de `Edit` con changes no triviales | Enrollments local; **traducido a `EnrollmentRecordEditedIntegrationEvent`** que Reviews consume con la policy `InvalidateReviewIfEnrollmentNoLongerValid` (ver [ADR-0032](../../../decisions/0032-edit-destructive-enrollment-invalida-review.md)) |

### 3. Invariantes que protege

- `(StudentProfileId, SubjectId, AcademicTermId)` UNIQUE: un alumno no puede tener dos registros para la misma materia en el mismo cuatrimestre.
- `Status` ∈ {`cursando`, `aprobada`, `desaprobada`, `abandonada`, `equivalencia`}.
- `Status='aprobada'` ⇒ `Grade NOT NULL`, `ApprovalMethod NOT NULL`.
- `Status='cursando'` ⇒ `Grade IS NULL`, `ApprovalMethod IS NULL`.
- `Grade ∈ [0, 10]` cuando aplica.
- `ApprovalMethod` ∈ {`parcial`, `final`, `promocion`, `equivalencia`}.

### 4. Cómo se carga / identifica

- Root ID: `EnrollmentRecordId`.
- Lookup primario: por ID.
- Lookup secundario: por `(StudentProfileId, SubjectId, AcademicTermId)`; por `StudentProfileId` para listar historial.
- Carga eager: el aggregate es flat (sin children).
- Persistencia: EF Core schema `enrollments`. Tabla `enrollment_records`.

### 5. Boundary

- Cross-aggregate invariante: `SubjectId` debe estar en el `CareerPlan` del `StudentProfile`. Validado en application service vía `IAcademicQueryService.IsSubjectInPlan`, no por el aggregate.
- `StudentProfileId` referencia un StudentProfile activo (validado en app service, no FK cross-BC).
- `AcademicTermId` referencia un AcademicTerm existente (validado en app service).
- La invalidación de Reviews al edit destructive **no la hace EnrollmentRecord**: emite el integration event y Reviews decide.

## Value Objects propios

- `EnrollmentStatus`: enum `Cursando | Aprobada | Desaprobada | Abandonada | Equivalencia`. State machine sin transitions formales modeladas (la validación es "los campos asociados al status nuevo cuajan").
- `ApprovalMethod`: enum `Parcial | Final | Promocion | Equivalencia`. Cómo se aprobó la cursada.
- `Grade`: hoy es `decimal?` columna directa con validación `[0, 10]`. Candidato a VO si la lógica de "aprobado vs desaprobado según escala de cada universidad" crece.

## Refs

- BC: [Enrollments](../../strategic/bounded-contexts.md#enrollments)
- ADRs: [ADR-0004](../../../decisions/0004-enrollment-guarda-hechos.md), [ADR-0032](../../../decisions/0032-edit-destructive-enrollment-invalida-review.md)
- User Stories: [US-030](../../user-stories/US-030.md), [US-031](../../user-stories/US-031.md), [US-032](../../user-stories/US-032.md)
