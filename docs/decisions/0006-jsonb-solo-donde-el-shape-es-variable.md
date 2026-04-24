# ADR-0006: JSONB solo donde el shape es genuinamente variable

- **Estado**: aceptado
- **Fecha**: 2026-04-22

## Contexto

La carpeta inicial del proyecto mencionó JSONB como mecanismo para "metadata variable" de reseñas. Al bajar a esquema, hay que decidir concretamente qué va en JSONB y qué va en columnas tipadas.

La tentación común: poner metadata de reseñas en JSONB "por las dudas" para evitar migraciones futuras. En este dominio, esta elección tiene costos altos y beneficios bajos.

## Decisión

**Todas las entidades core van con columnas tipadas**: Review, EnrollmentRecord, User, Career, Subject, etc. Los campos "metadata" que puedan surgir (ej. `would_recommend`, `weekly_hours`, `exam_type`) se agregan como columnas nullable con enums cuando aplique.

**JSONB se usa solo en dos lugares donde el shape es genuinamente variable:**

1. **`HistorialImport.raw_payload`** — staging del output del parser de PDF/texto antes de normalizar a `EnrollmentRecord`. El formato del historial académico varía por universidad y por versión del sistema de gestión. Guardar el crudo permite reprocesar si el parser cambia o falla.

2. **`ReviewAuditLog.changes`** — diff de cambios sobre una reseña. La estructura varía según la acción (edit, report, remove, restore): un edit tiene `before/after` de campos; un report tiene `reason` y `reporter_id`; un remove tiene `reason_code` y `moderator_id`. El log se consume como timeline, rara vez se consulta por dentro.

## Alternativas consideradas

### A. JSONB para metadata de Review
Permite agregar campos sin ALTER TABLE. Descartada por:

- **Queries del dashboard** viven de aggregations (`AVG(difficulty_rating)`, `COUNT(WHERE would_recommend)`). Expression indexes sobre JSONB son más caros y frágiles que indexes sobre columnas.
- **Sin enforcement de schema:** el día que el frontend manda `"yes"` en vez de `true`, Postgres lo acepta silenciosamente y los promedios se rompen.
- **Sin tipado en .NET:** JSONB → `Dictionary<string,object>` o mapper custom. Se pierde el soporte de EF Core nativo.
- **Sin descubribilidad:** el schema deja de ser documentación. Quién quiera saber qué campos existen tiene que leer el código de app.
- **ALTER TABLE ADD COLUMN nullable** en Postgres ≥11 es metadata-only: O(1), no reescribe filas. El costo de "evitar migración" es efectivamente cero.

### B. Sin JSONB en absoluto
Forzar columnas tipadas incluso en HistorialImport y ReviewAuditLog. Descartada porque en esos dos casos el shape genuinamente varía y columnas serían o demasiadas (todas nullable) o insuficientes para capturar formatos desconocidos.

## Consecuencias

**Positivas:**
- El schema es la documentación del dominio. Un desarrollador nuevo que hace `\d review` sabe qué datos existen.
- Queries de aggregation son baratas y usan indexes normales.
- Invariantes DB-level disponibles (NOT NULL, CHECK, FK, UNIQUE) sobre cada campo.
- Tipado fuerte en entidades EF Core.

**Negativas:**
- Agregar un campo a Review requiere una migración. Con Postgres ≥11 el costo es trivial, pero sigue siendo una operación con revisión y deploy.

**Cuándo reconsiderar JSONB en otra entidad:**
- Si aparecen alumnos definiendo tags propios sobre una reseña (no está planeado).
- Si distintas carreras/universidades requieren cuestionarios de reseña con preguntas distintas (no está planeado).
- Si se integra una fuente externa cuyo shape no controlamos (webhooks, third-party APIs).

En cualquiera de estos casos, evaluar caso por caso. La regla por defecto sigue siendo: columnas tipadas, salvo shape genuinamente variable.
