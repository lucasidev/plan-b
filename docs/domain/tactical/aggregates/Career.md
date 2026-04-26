# Career (Academic)

**Tipo**: lean
**BC**: Academic
**Root ID**: `CareerId`
**Child entities**: ninguna

## Walkthrough Brandolini Software Design Level

### 1. Commands aceptados

| Command | Disparado por | Efecto |
|---|---|---|
| `Create(universityId, name, code?)` | Admin desde backoffice | Crea la Career bajo una University. Valida `(UniversityId, Code)` único cuando code es non-null. Emite `CareerCreated`. |
| `Update(...)` | Admin desde backoffice | Modifica name / code. Emite `CareerUpdated`. |

### 2. Events emitidos

| Event | Cuándo | Consumido por |
|---|---|---|
| `CareerCreated` | Tras `Create` | Academic (audit) |
| `CareerUpdated` | Tras `Update` | Academic (audit) |

Sin integration events cross-BC.

### 3. Invariantes que protege

- `(UniversityId, Code)` UNIQUE cuando `Code` es non-null.
- `Name` no vacío.
- `UniversityId` referencia válida (validado en app service).

### 4. Cómo se carga / identifica

- Root ID: `CareerId`.
- Lookup primario: por ID.
- Lookup secundario: por `UniversityId` (listar carreras de una universidad), por `(UniversityId, Code)`.
- Persistencia: EF Core schema `academic`. Tabla `careers`.

### 5. Boundary

- Los CareerPlans de la carrera son aggregates separados que referencian `CareerId`.

## Value Objects propios

Ninguno específico (usa strongly-typed IDs y primitives).

## Refs

- BC: [Academic](../../strategic/bounded-contexts.md#academic)
- ADRs: [ADR-0001](../../../decisions/0001-multi-universidad-desde-dia-1.md)
- User Stories: [US-001](../../user-stories/US-001.md), [US-080](../../user-stories/US-080.md)
