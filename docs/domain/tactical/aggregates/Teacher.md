# Teacher (Academic)

**Tipo**: lean
**BC**: Academic
**Root ID**: `TeacherId`
**Child entities**: ninguna

## Walkthrough Brandolini Software Design Level

### 1. Commands aceptados

| Command | Disparado por | Efecto |
|---|---|---|
| `Create(universityId, fullName, title?)` | Admin desde backoffice | Crea el Teacher. Emite `TeacherCreated`. |
| `Update(...)` | Admin desde backoffice | Modifica campos editables. Emite `TeacherUpdated`. |
| `Deactivate()` | Admin desde backoffice | Toggle `IsActive=false` (no se borra). Emite `TeacherDeactivated`. |

### 2. Events emitidos

| Event | Cuándo | Consumido por |
|---|---|---|
| `TeacherCreated` | Tras `Create` | Academic (audit) |
| `TeacherUpdated` | Tras `Update` | Academic (audit) |
| `TeacherDeactivated` | Tras `Deactivate` | Academic (audit) |

Sin integration events cross-BC en MVP.

### 3. Invariantes que protege

- `Title` lowercase en DB (presentation layer aplica title case).
- `UniversityId` referencia válida.
- `IsActive` toggle (no se borra; se desactiva).

### 4. Cómo se carga / identifica

- Root ID: `TeacherId`.
- Lookup primario: por ID.
- Lookup secundario: por `UniversityId` (listar docentes de una universidad), por `FullName` (búsqueda).
- Persistencia: EF Core schema `academic`. Tabla `teachers`.

### 5. Boundary

- Un Teacher puede no tener TeacherProfile (Identity) hasta que el docente real cree cuenta y reclame.
- Las Commissions referencian Teachers vía `CommissionTeacher` (child entity de Commission).

## Value Objects propios

Ninguno específico (lifecycle CRUD básico).

## Refs

- BC: [Academic](../../strategic/bounded-contexts.md#academic)
- ADRs: [ADR-0001](../../../decisions/0001-multi-universidad-desde-dia-1.md)
- User Stories: [US-003](../../user-stories/US-003.md), [US-080](../../user-stories/US-080.md)
