# SimulationDraft (Planning)

**Tipo**: rich
**BC**: Planning
**Root ID**: `SimulationDraftId`
**Child entities**: ninguna (rich por lifecycle de visibilidad y al menos 5 commands con reglas propias)

## Walkthrough Brandolini Software Design Level

### 1. Commands aceptados

| Command | Disparado por | Efecto |
|---|---|---|
| `Save(profileId, subjects, termId, clock)` | Member con StudentProfile activo (premium feature, ver [ADR-0028](../../../decisions/0028-resenas-opcionales-y-premium-features-como-reward.md)) | Factory; crea draft privado. Valida subjects pertenecen al CareerPlan del profile y termId es futuro/vigente. Emite `SimulationDraftSaved`. |
| `Update(subjects)` | Owner del draft | Reemplaza la lista de subjects (validación equivalente a Save). Emite `SimulationDraftEdited`. |
| `Share()` | Owner del draft | Cambia visibility a `Shared` (entra al corpus público anónimo). Emite `SimulationDraftShared`. |
| `Unshare()` | Owner del draft | Vuelve a `Private`. Emite `SimulationDraftUnshared`. |
| `Delete()` | Owner del draft | Hard delete (no audit en simulations privadas). Emite `SimulationDraftDeleted`. |

### 2. Events emitidos

| Event | Cuándo | Consumido por |
|---|---|---|
| `SimulationDraftSaved` | Tras `Save` | Planning (audit), telemetría de uso |
| `SimulationDraftEdited` | Tras `Update` | Planning (audit) |
| `SimulationDraftShared` | Tras `Share` | Planning (corpus público), telemetría |
| `SimulationDraftUnshared` | Tras `Unshare` | Planning (corpus público) |
| `SimulationDraftDeleted` | Tras `Delete` | Planning (audit, telemetría) |

Sin integration events cross-BC en MVP. Recomendación de simulaciones (post-MVP) consumirá events de Reviews vía read model.

### 3. Invariantes que protege

- `OwnerProfileId` referencia un StudentProfile activo (validado en app service, no FK).
- `Materias` (collection de `SubjectId`) son del `CareerPlan` del owner (validado en app service).
- `TermId` corresponde a un AcademicTerm futuro o vigente.
- State machine de visibility: `Private → Shared → Private` (toggle).
- Solo el owner edita / shara / borra (validado en app service contra `OwnerProfileId`).

### 4. Cómo se carga / identifica

- Root ID: `SimulationDraftId`.
- Lookup primario: por ID.
- Lookup secundario: por `OwnerProfileId` (lista del owner), por `(TermId, Visibility=Shared)` (corpus público).
- Carga eager: aggregate flat, la collection `Materias` es lista de `SubjectId`.
- Persistencia: EF Core schema `planning`. Tabla `simulation_drafts` (con `subject_ids` como columna array de Postgres o JSONB según [ADR-0006](../../../decisions/0006-jsonb-solo-donde-el-shape-es-variable.md)).

### 5. Boundary

- Quedan afuera: las Subjects en sí (Academic), el StudentProfile (Identity).
- Cross-aggregate validations (subjects ∈ plan, profile activo, term válido) viven en application service vía `IAcademicQueryService` y `IIdentityQueryService`.
- "Materias disponibles para simular" (subjects no aprobadas + correlativas cumplidas) NO es responsabilidad del aggregate; es read model construido por Planning sobre lecturas de Academic + Enrollments.

## Value Objects propios

- `SimulationVisibility`: enum `Private | Shared`. Controlado por `Share()` / `Unshare()`.

## Refs

- BC: [Planning](../../strategic/bounded-contexts.md#planning)
- ADRs: [ADR-0028](../../../decisions/0028-resenas-opcionales-y-premium-features-como-reward.md), [ADR-0029](../../../decisions/0029-planning-bc-separado.md)
- User Stories: [US-040](../../user-stories/US-040.md), [US-041](../../user-stories/US-041.md), [US-060](../../user-stories/US-060.md), [US-061](../../user-stories/US-061.md), [US-062](../../user-stories/US-062.md), [US-063](../../user-stories/US-063.md), [US-064](../../user-stories/US-064.md), [US-065](../../user-stories/US-065.md), [US-066](../../user-stories/US-066.md)
