# CareerPlan (Academic)

**Tipo**: lean
**BC**: Academic
**Root ID**: `CareerPlanId`
**Child entities**: ninguna

## Walkthrough Brandolini Software Design Level

### 1. Commands aceptados

| Command | Disparado por | Efecto |
|---|---|---|
| `Create(careerId, versionLabel, effectiveFrom, effectiveTo?)` | Admin desde backoffice | Crea el plan. Valida `(CareerId, VersionLabel)` único; valida rango de fechas. Si hay otro plan vigente para la misma Career, el app service lo retira automáticamente (cross-aggregate). Emite `CareerPlanCreated`. |
| `Retire(effectiveTo)` | Admin desde backoffice | Setea `EffectiveTo`. Emite `CareerPlanRetired`. |

### 2. Events emitidos

| Event | Cuándo | Consumido por |
|---|---|---|
| `CareerPlanCreated` | Tras `Create` | Academic (audit) |
| `CareerPlanRetired` | Cuando se setea `EffectiveTo` | Academic (audit) |

Sin integration events cross-BC.

### 3. Invariantes que protege

- `(CareerId, VersionLabel)` UNIQUE.
- `EffectiveTo IS NULL OR EffectiveTo >= EffectiveFrom`.
- "Solo un plan vigente por Career": invariante cross-aggregate enforced en application service (al crear nuevo plan vigente, retira al anterior).

### 4. Cómo se carga / identifica

- Root ID: `CareerPlanId`.
- Lookup primario: por ID.
- Lookup secundario: por `CareerId` (listar planes de la carrera), por `(CareerId, VersionLabel)`, "plan vigente para Career X" via `EffectiveTo IS NULL`.
- Persistencia: EF Core schema `academic`. Tabla `career_plans`.

### 5. Boundary

- Subjects pertenecen a un CareerPlan (referencia por valor `CareerPlanId`); el aggregate del Subject ya valida sus invariantes propias.
- StudentProfile referencia un CareerPlan (Identity BC, valida via `IAcademicQueryService`).

## Value Objects propios

Ninguno específico.

## Refs

- BC: [Academic](../../strategic/bounded-contexts.md#academic)
- ADRs: [ADR-0002](../../../decisions/0002-versionado-de-planes-de-estudio.md)
- User Stories: [US-001](../../user-stories/US-001.md), [US-080](../../user-stories/US-080.md)
