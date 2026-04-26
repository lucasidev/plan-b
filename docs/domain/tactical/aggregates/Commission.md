# Commission (Academic)

**Tipo**: lean
**BC**: Academic
**Root ID**: `CommissionId`
**Child entities**: `CommissionTeacher` (collection)

> Tiene child entities pero las invariantes son CRUD admin con un par de chequeos (un titular, no duplicar teacher). Lean.

## Walkthrough Brandolini Software Design Level

### 1. Commands aceptados

| Command | Disparado por | Efecto |
|---|---|---|
| `Create(subjectId, academicTermId, name, capacity?)` | Admin desde backoffice | Crea la commission. Valida `Subject.University == AcademicTerm.University` (cross-aggregate, en app service). Emite `CommissionCreated`. |
| `Update(...)` | Admin desde backoffice | Modifica name / capacity. Emite `CommissionUpdated`. |
| `AssignTeacher(teacherId, role)` | Admin desde backoffice | Agrega un CommissionTeacher. Valida invariantes internos (un titular, no duplicar). Emite `CommissionTeacherAssigned`. |
| `UnassignTeacher(teacherId)` | Admin desde backoffice | Remueve un CommissionTeacher. Emite `CommissionTeacherUnassigned`. |

### 2. Events emitidos

| Event | Cuándo | Consumido por |
|---|---|---|
| `CommissionCreated` | Tras `Create` | Academic (audit) |
| `CommissionUpdated` | Tras `Update` | Academic (audit) |
| `CommissionTeacherAssigned` | Tras `AssignTeacher` | Academic (audit) |
| `CommissionTeacherUnassigned` | Tras `UnassignTeacher` | Academic (audit) |

Sin integration events cross-BC.

### 3. Invariantes que protege

- `(SubjectId, AcademicTermId, Name)` UNIQUE.
- `Subject.University == AcademicTerm.University` (cross-aggregate, validado en app service).
- `Capacity > 0` cuando aplica.
- Como mucho **un** teacher con `role='titular'` por commission (invariante interno).
- No se asigna el mismo teacher dos veces a la misma commission (invariante interno).
- `CommissionTeacher.Role` ∈ `{titular, adjunto, jtp, ayudante, invitado}`.

### 4. Cómo se carga / identifica

- Root ID: `CommissionId`.
- Lookup primario: por ID.
- Lookup secundario: por `(SubjectId, AcademicTermId)` (listar comisiones de la materia para ese term).
- Carga eager de children: la collection de `CommissionTeacher` se carga junto con el aggregate.
- Persistencia: EF Core schema `academic`. Tablas `commissions` y `commission_teachers`.

### 5. Boundary

- La validación cross-aggregate (`Subject.University == AcademicTerm.University`) la hace el app service.
- Reviews consume `CommissionTeachers` vía `IAcademicQueryService.GetCommissionTeachers(commissionId)` para validar que `docente_reseñado_id` está asignado a la commission.

## Value Objects propios

Ninguno específico (los roles del CommissionTeacher son enum simple).

## Refs

- BC: [Academic](../../strategic/bounded-contexts.md#academic)
- ADRs: [ADR-0001](../../../decisions/0001-multi-universidad-desde-dia-1.md)
- User Stories: [US-080](../../user-stories/US-080.md)
