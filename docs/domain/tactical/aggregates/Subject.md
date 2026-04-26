# Subject (Academic)

**Tipo**: lean
**BC**: Academic
**Root ID**: `SubjectId`
**Child entities**: `Prerequisite` (collection)

> Vernon/Khorikov: aunque tiene child entities (Prerequisites), el aggregate es **lean** porque las invariantes son CRUD admin con un par de chequeos (no apuntar a sí misma); la aciclicidad global del grafo es cross-aggregate y vive en domain service. No tiene un lifecycle complejo.

## Walkthrough Brandolini Software Design Level

### 1. Commands aceptados

| Command | Disparado por | Efecto |
|---|---|---|
| `Create(careerPlanId, code, name, hours, year, termNumber)` | Admin desde backoffice | Crea la Subject. Emite `SubjectCreated`. |
| `Update(...)` | Admin desde backoffice | Modifica campos editables. Emite `SubjectUpdated`. |
| `Archive()` | Admin desde backoffice | Marca como archivada (no se borra). Emite `SubjectArchived`. |
| `AddPrerequisite(requiredSubjectId, type)` | Admin desde backoffice | Solo invariante intra (no apunta a sí misma). El cross-aggregate (ciclo en grafo del plan) lo chequea el app service vía `IPrerequisiteGraphValidator` antes de invocar este método. Emite `PrerequisiteAdded`. |
| `RemovePrerequisite(requiredSubjectId, type)` | Admin desde backoffice | Quita el prerequisite. Emite `PrerequisiteRemoved`. |

### 2. Events emitidos

| Event | Cuándo | Consumido por |
|---|---|---|
| `SubjectCreated` | Tras `Create` | Academic (audit) |
| `SubjectUpdated` | Tras `Update` | Academic (audit) |
| `SubjectArchived` | Tras `Archive` | Academic (audit) |
| `PrerequisiteAdded` | Tras `AddPrerequisite` (operación sobre child Prerequisite, emitido por root) | Academic (audit) |
| `PrerequisiteRemoved` | Tras `RemovePrerequisite` | Academic (audit) |

Sin integration events cross-BC.

### 3. Invariantes que protege

- `(CareerPlanId, Code)` UNIQUE.
- `Hours > 0`, `Year >= 1`, `TermNumber >= 1`.
- Sub-grafo de prerequisites no apunta a sí misma (invariante intra-aggregate).
- Aciclicidad **global** del grafo de prerequisites del CareerPlan: invariante cross-aggregate, validada por domain service `IPrerequisiteGraphValidator` antes de invocar `AddPrerequisite`.
- Prerequisite type ∈ `{para_cursar, para_rendir}` (ver [ADR-0003](../../../decisions/0003-correlativas-con-dos-tipos.md)).

### 4. Cómo se carga / identifica

- Root ID: `SubjectId`.
- Lookup primario: por ID.
- Lookup secundario: por `CareerPlanId` (listar materias del plan), por `(CareerPlanId, Code)`.
- Carga eager de children: la collection de `Prerequisite` se carga junto con el aggregate.
- Persistencia: EF Core schema `academic`. Tablas `subjects` y `prerequisites`.

### 5. Boundary

- Quedan afuera: Commissions de la Subject (aggregate separado), Teachers (aggregate separado).
- La aciclicidad global no la garantiza el aggregate solo, sino el app service + domain service.
- La Subject que es prerequisite es referenciada por `RequiredSubjectId`, no cargada eager (los Prerequisites son punteros).

## Value Objects propios

Ninguno específico (los prerequisites usan enums de tipo).

## Refs

- BC: [Academic](../../strategic/bounded-contexts.md#academic)
- ADRs: [ADR-0001](../../../decisions/0001-multi-universidad-desde-dia-1.md), [ADR-0002](../../../decisions/0002-versionado-de-planes-de-estudio.md), [ADR-0003](../../../decisions/0003-correlativas-con-dos-tipos.md)
- User Stories: [US-001](../../user-stories/US-001.md), [US-002](../../user-stories/US-002.md), [US-080](../../user-stories/US-080.md)
