# CareerPlan (Academic)

**Tipo**: lean
**BC**: Academic
**Root ID**: `CareerPlanId`
**Child entities**: ninguna

## Walkthrough Brandolini Software Design Level

### 1. Commands aceptados

| Command | Disparado por | Efecto |
|---|---|---|
| `Create(careerId, year, isOfficial, label?)` | Admin desde backoffice (US-061) o import crowdsourced (US-088) | Crea el plan en estado `Active`. Valida `year` positivo y no futuro; `(CareerId, Year)` único. `label` es una etiqueta editorial opcional (ej. "plan-2023"; el alumno ve "Plan 2023"). |
| `Deprecate(clock)` | Admin desde backoffice (US-061) | Pasa de `Active` a `Deprecated`: deja de ser vigente para nuevos ingresos, pero los alumnos asociados quedan en él. Sella `UpdatedAt`. Idempotente. |
| `Reactivate(clock)` | Admin desde backoffice (US-061) | Pasa de `Deprecated` a `Active`. Sella `UpdatedAt`. Idempotente. |
| `MarkOfficial(clock)` | Backoffice al validar un plan crowdsourced (post-MVP) | Promueve `IsOfficial` de false a true. Idempotente. |

### 2. Events emitidos

Ninguno. El aggregate no emite domain events cross-BC hoy (ADR-0049: el modelo `year + status` no requiere el auto-retiro cross-aggregate que el modelo de rangos de vigencia asumía).

### 3. Invariantes que protege

- `(CareerId, Year)` UNIQUE.
- `Year` positivo y no futuro al crear.
- `Status` en { `Active`, `Deprecated` }.

### 4. Cómo se carga / identifica

- Root ID: `CareerPlanId`.
- Lookup primario: por ID.
- Lookup secundario: por `CareerId` (listar planes de la carrera), por `(CareerId, Year)`. "Plan vigente" = `Status = Active`.
- Persistencia: EF Core schema `academic`. Tabla `career_plans`.

### 5. Boundary

- Subjects pertenecen a un CareerPlan (referencia por valor `CareerPlanId`); el aggregate del Subject ya valida sus invariantes propias.
- StudentProfile referencia un CareerPlan (Identity BC, valida via `IAcademicQueryService`).

## Value Objects propios

Ninguno específico.

## Refs

- BC: [Academic](../../strategic/bounded-contexts.md#academic)
- ADRs: [ADR-0002](../../../decisions/0002-versionado-de-planes-de-estudio.md) (superado), [ADR-0049](../../../decisions/0049-careerplan-year-status-en-vez-de-rango-de-vigencia.md)
- User Stories: [US-001](../../user-stories/US-001.md), [US-008](../../user-stories/US-008.md), [US-061](../../user-stories/US-061.md)
