# FailedHistorialImportLine (Enrollments)

**Tipo**: projection / read model
**BC**: Enrollments
**Source**: resultado del worker que procesa `HistorialImport`

## Estructura

Por cada línea del payload del import que **no resolvió** contra el plan (Subject no encontrada, datos malformados, etc.) se registra una row para que el alumno pueda corregirla manualmente.

| Field | Tipo | Notas |
|---|---|---|
| `id` | UUID | PK de la row de la projection |
| `historial_import_id` | UUID | FK al import que la generó |
| `line_number` | int | Posición original en el payload |
| `raw_line` | JSONB | Snapshot de los datos originales |
| `reason` | string | Motivo del fallo: `subject_not_found`, `invalid_grade`, `missing_term`, `other` |
| `details` | string? | Detalle adicional textual |

## Cómo se construye

El worker que procesa el `HistorialImport`, durante el resolve del payload, va escribiendo una row en esta projection por cada línea que no logra mappear a un EnrollmentRecord válido. Cuando `HistorialImport.Complete(results)` ejecuta, el `Results` JSONB ya incluye los counts (`resolved_rows`, `unresolved_rows`) y la projection queda lista para consulta.

## Quién la consume

- UI del alumno post-import: lista de líneas que requieren corrección manual.
- Endpoints de "reintentar línea" o "ignorar línea".

## Refs

- BC: [Enrollments](../../strategic/bounded-contexts.md#enrollments)
- ADRs: [ADR-0004](../../../decisions/0004-enrollment-guarda-hechos.md), [ADR-0006](../../../decisions/0006-jsonb-solo-donde-el-shape-es-variable.md)
