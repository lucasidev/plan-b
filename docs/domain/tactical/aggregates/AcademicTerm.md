# AcademicTerm (Academic)

**Tipo**: lean
**BC**: Academic
**Root ID**: `AcademicTermId`
**Child entities**: ninguna

## Walkthrough Brandolini Software Design Level

### 1. Commands aceptados

| Command | Disparado por | Efecto |
|---|---|---|
| `Create(universityId, year, kind, number, startDate, endDate, enrollmentOpensAt, enrollmentClosesAt)` | Admin desde backoffice | Crea el term. Computa `Label` automáticamente (`"<year><kind><number>"`). Emite `AcademicTermCreated`. |
| `Update(...)` | Admin desde backoffice | Modifica fechas. Emite `AcademicTermUpdated`. |

### 2. Events emitidos

| Event | Cuándo | Consumido por |
|---|---|---|
| `AcademicTermCreated` | Tras `Create` | Academic (audit) |
| `AcademicTermUpdated` | Tras `Update` | Academic (audit) |

Sin integration events cross-BC.

### 3. Invariantes que protege

- `(UniversityId, Year, Number, Kind)` UNIQUE.
- `Label` se computa al insertar (`"<year><kind><number>"`, ej. `2026C1`).
- `EnrollmentClosesAt > EnrollmentOpensAt`.
- `EndDate > StartDate`.

### 4. Cómo se carga / identifica

- Root ID: `AcademicTermId`.
- Lookup primario: por ID.
- Lookup secundario: por `UniversityId` (listar terms), por `(UniversityId, Year, Kind, Number)`, por "term vigente para University X" via fechas.
- Persistencia: EF Core schema `academic`. Tabla `academic_terms`.

### 5. Boundary

- Las Commissions referencian AcademicTerm vía `AcademicTermId`.
- Validar "subject.University == academicTerm.University" es invariante de Commission, no de AcademicTerm.

## Value Objects propios

- `TermKind`: enum `Cuatrimestre | Bimestre | Anual`. Cadencia del term.

## Refs

- BC: [Academic](../../strategic/bounded-contexts.md#academic)
- ADRs: [ADR-0001](../../../decisions/0001-multi-universidad-desde-dia-1.md)
- User Stories: [US-080](../../user-stories/US-080.md)
