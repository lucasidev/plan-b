# HistorialImport (Enrollments)

**Tipo**: lean
**BC**: Enrollments
**Root ID**: `HistorialImportId`
**Child entities**: ninguna (las líneas que no resolvieron contra el plan se modelan como projection `FailedHistorialImportLine`, no como child entity)

## Walkthrough Brandolini Software Design Level

### 1. Commands aceptados

| Command | Disparado por | Efecto |
|---|---|---|
| `Request(studentProfileId, sourceType, rawPayload, clock)` | Member desde UI con archivo | Factory; crea import en `Status='pending'`. Emite `HistorialImportRequested`. |
| `MarkProcessing(clock)` | Worker que procesa el import | Pasa a `Status='processing'`. |
| `Complete(results, clock)` | Worker tras procesar exitosamente | Pasa a `Status='completed'`, setea `Results`. Emite `HistorialImportCompleted` (con resolved/unresolved counts). |
| `Fail(error, clock)` | Worker tras error | Pasa a `Status='failed'`, setea `Error`. Emite `HistorialImportFailed`. |

### 2. Events emitidos

| Event | Cuándo | Consumido por |
|---|---|---|
| `HistorialImportRequested` | Tras `Request` | Worker que dispara el procesamiento |
| `HistorialImportCompleted` | Tras `Complete` | Enrollments (audit), notificación al user. Cada `EnrollmentRecord` creado dentro del flow emite su propio `EnrollmentRecordCreated` |
| `HistorialImportFailed` | Tras `Fail` | Enrollments (audit), notificación al user |

Sin integration events cross-BC.

### 3. Invariantes que protege

- State machine `Status`: `pending → processing → completed | failed`. No vuelve atrás.
- `Status='completed'` requiere `Results NOT NULL` con al menos un row procesado.
- `Status='failed'` requiere `Error NOT NULL`.
- `RawPayload` no vacío al crear.
- `SourceType` ∈ `{pdf, text}`.

### 4. Cómo se carga / identifica

- Root ID: `HistorialImportId`.
- Lookup primario: por ID.
- Lookup secundario: por `StudentProfileId` (listar imports del profile), por `Status='pending'` (cola del worker).
- Persistencia: EF Core schema `enrollments`. Tabla `historial_imports`. `RawPayload` y `Results` son JSONB ([ADR-0006](../../../decisions/0006-jsonb-solo-donde-el-shape-es-variable.md)).

### 5. Boundary

- El procesamiento del payload + matching contra el plan está afuera del aggregate (es responsibility del worker que consume `HistorialImportRequested`).
- Las líneas que no resolvieron contra el plan se exponen como projection `FailedHistorialImportLine` (no son child entities del aggregate).

## Value Objects propios

Ninguno específico (los enums `Status` y `SourceType` se modelan como columnas).

## Refs

- BC: [Enrollments](../../strategic/bounded-contexts.md#enrollments)
- ADRs: [ADR-0004](../../../decisions/0004-enrollment-guarda-hechos.md), [ADR-0006](../../../decisions/0006-jsonb-solo-donde-el-shape-es-variable.md)
- User Stories: [US-024](../../user-stories/US-024.md), [US-025](../../user-stories/US-025.md), [US-026](../../user-stories/US-026.md), [US-027](../../user-stories/US-027.md), [US-028](../../user-stories/US-028.md)
