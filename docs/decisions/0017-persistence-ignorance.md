# ADR-0017: Persistence Ignorance (infraestructura pluggable, sin FKs cross-schema)

- **Estado**: aceptado
- **Fecha**: 2026-04-23

## Contexto

DDD y Clean Architecture comparten un principio fundamental: **el dominio no depende de decisiones de infraestructura**. Los aggregates, value objects, y reglas de negocio deben poder vivir sin saber si los datos se persisten en Postgres, MongoDB, un archivo plano, o una tabla de Notion.

Ese principio, llamado "persistence ignorance", tiene implicaciones concretas que hay que explicitar para no violarlas silenciosamente:

- El dominio (Domain) no puede importar nada de EF Core, Dapper, Npgsql.
- La aplicación (Application) define interfaces (puertos) que la infraestructura implementa (adapters).
- La existencia de FKs en Postgres, de schemas separados, de índices, es detalle del adapter.
- Los invariantes del modelo se enforcan en el aggregate (factory methods, métodos de negocio) y en la application layer (handlers), **no** delegando a constraints del DB.

En un modular monolith con módulos aislados (ADR-0014), la tentación natural es enforcar referencias cross-module con FKs a nivel Postgres (cross-schema). Esa tentación viola persistence ignorance si el dominio asume que el DB va a validar.

## Decisión

Planb adopta persistence ignorance de forma estricta. Consecuencias operativas:

1. **No FKs cross-schema** a nivel Postgres. Las referencias cross-module son solo columnas UUID sin constraint.
2. **Validación de referencias en application layer**: antes de crear un aggregate que referencia otro, el handler consulta vía PublicContracts del otro módulo (`IEnrollmentQueryService.ExistsAndIsFinalizedAsync`).
3. **FKs intra-módulo sí** se mantienen (ej. `TeacherResponse.review_id → Review.id` dentro del schema `reviews`). Son detalle del adapter del módulo, coherentes con persistence ignorance porque no cruzan los boundaries.
4. **Los aggregates conocen IDs, no referencias objeto**. `Review.EnrollmentId` es un value object `EnrollmentId`, no un `Enrollment navigation`.
5. **EF Core y Dapper viven solo en Infrastructure**, detrás de interfaces definidas en Application (`IReviewRepository`, `IReviewQueryService`).
6. **El DbContext no cruza la frontera**: handlers consumen repositorios, no `DbContext` directamente.

## Alternativas consideradas

### A. FKs cross-schema en Postgres como red de seguridad

Postgres permite FKs entre schemas. El adapter Postgres de Reviews declara `enrollment_id REFERENCES enrollments.enrollment_record(id)`. Postgres rechaza inserts inválidos.

Descartada porque:

- La validación está duplicada: en el handler (correcto) y en el DB (redundante).
- Crea acoplamiento tácito: ciertas garantías del sistema dependen de que el adapter sea Postgres. Si se reemplaza por Notion o un archivo, esas garantías desaparecen silenciosamente.
- Las migraciones de módulos quedan acopladas: migrar Enrollments requiere coordinar con Reviews.

### B. Híbrido: FKs para "referencias fuertes", sin FKs para "referencias débiles"

Algunas referencias son semánticamente críticas (Review → Enrollment) y ameritan FK; otras son históricas (ReviewReport.reporter_id → User) y pueden ser solo lógicas.

Descartada tras discusión: introduce inconsistencia en la política. La semántica se enforca uniformemente en application layer, no caso por caso en el DB.

## Consecuencias

**Positivas:**

- Swappear persistence es trivial. Re-implementás los adapters de Infrastructure y listo. Dominio y aplicación no cambian.
- Los tests de dominio no necesitan DB. Mock del repositorio y listo.
- Las migraciones de cada módulo son independientes. No hay orden obligatorio entre módulos.
- El código es honesto respecto a dónde viven los invariantes: en el dominio y en la aplicación, no escondidos en SQL.

**Negativas:**

- Si un bug en el application layer falla en validar una referencia, Postgres no va a atraparlo: puede crearse una Review con `enrollment_id` inexistente (orphan row). Esto es un bug de código, trackeable y solucionable, no un defecto del sistema.
- Analítica cross-module que necesita JOIN (dashboard institucional) tiene dos caminos: read models denormalizados mantenidos por integration events, o Dapper cross-schema saltando el DbContext. Ambos son válidos y vivendo en Infrastructure.

**Reglas derivadas:**

- **No EF navigation properties cross-aggregate**. Un `Review` no tiene `.Subject` cargado con JOIN. Si necesita info de Subject, el handler la pide vía `IAcademicQueryService`.
- **Repositories devuelven aggregates**, query services devuelven DTOs planos. Distinción intencional y core a CQRS.
- **Validación en application, no en DB**: el handler siempre valida referencias antes de crear.
- **Migraciones son detalle del adapter**: viven en `Planb.<Module>.Infrastructure/Migrations/`.

**Cuándo revisitar:**

- Nunca, en principio. Si aparece presión para agregar FKs cross-schema por performance u otro motivo, rediscutir el scope del modular monolith: probablemente sea señal de que los módulos están mal divididos.
