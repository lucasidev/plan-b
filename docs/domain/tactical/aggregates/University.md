# University (Academic)

**Tipo**: lean
**BC**: Academic
**Root ID**: `UniversityId`
**Child entities**: ninguna

## Walkthrough Brandolini Software Design Level

### 1. Commands aceptados

| Command | Disparado por | Efecto |
|---|---|---|
| `Create(name, shortName, slug, country, city, institutionalEmailDomains)` | Admin desde backoffice | Crea la University. Valida `slug` único. Emite `UniversityCreated`. |
| `Update(...)` | Admin desde backoffice | Modifica campos editables (name, shortName, city, institutionalEmailDomains). Emite `UniversityUpdated`. |

### 2. Events emitidos

| Event | Cuándo | Consumido por |
|---|---|---|
| `UniversityCreated` | Tras `Create` | Academic (audit) |
| `UniversityUpdated` | Tras `Update` | Academic (audit) |

Sin integration events cross-BC. El catálogo es estable y no suele cambiar lo suficiente como para que otros BCs reaccionen activamente.

### 3. Invariantes que protege

- `slug` UNIQUE.
- `Name`, `ShortName`, `Country`, `City` NOT NULL.
- `InstitutionalEmailDomains` array de strings normalizados (lowercase, sin protocolo).

### 4. Cómo se carga / identifica

- Root ID: `UniversityId`.
- Lookup primario: por ID.
- Lookup secundario: por `slug` (URL-friendly), por `country` para listados.
- Persistencia: EF Core schema `academic`. Tabla `universities`.

### 5. Boundary

- Careers, Teachers, AcademicTerms son aggregates separados que referencian `UniversityId`.
- Verificación de docente por dominio institucional usa `InstitutionalEmailDomains` pero la lógica vive en TeacherProfile (Identity).

## Value Objects propios

- `Slug`: wrapper sobre string con validación lowercase, alphanum + hyphens, length ≤ 50.

## Refs

- BC: [Academic](../../strategic/bounded-contexts.md#academic)
- ADRs: [ADR-0001](../../../decisions/0001-multi-universidad-desde-dia-1.md)
- User Stories: [US-001](../../user-stories/US-001.md), [US-080](../../user-stories/US-080.md)
