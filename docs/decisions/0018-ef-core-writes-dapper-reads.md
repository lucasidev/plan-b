# ADR-0018: EF Core para writes, Dapper para reads complejos

- **Estado**: aceptado
- **Fecha**: 2026-04-23

## Contexto

Dentro de cada módulo, la capa Infrastructure tiene que resolver dos patrones de acceso a datos con propiedades distintas:

**Writes (commands):**
- Operan sobre aggregates con invariantes.
- Necesitan change tracking y unit of work para commitear atómicamente cambios en múltiples rows relacionadas dentro del mismo aggregate.
- Ejemplo: publicar una Review también crea una row en `ReviewAuditLog`.
- Volumen bajo-medio por request.

**Reads (queries):**
- Consultan proyecciones planas, agregaciones, listas paginadas.
- No necesitan change tracking ni hidratar aggregates (el overhead de construir un `Review` completo con todas sus propiedades para mostrar "dificultad promedio" es desperdicio).
- Frecuentemente requieren JOINs, agregaciones SQL, full-text search, window functions.
- Volumen alto.

Un solo mecanismo de acceso no es óptimo para los dos patrones.

## Decisión

Cada módulo usa ambos dentro de su capa Infrastructure, con separación clara de responsabilidades:

- **EF Core 10 para writes.** Implementa `I<Module>Repository` interfaces. Maneja change tracking, unit of work (via Wolverine transactional middleware), configuraciones de mapping, y migraciones.
- **Dapper para reads complejos.** Implementa `I<Module>QueryService` interfaces. Ejecuta SQL directo con conexión del mismo pool que EF Core. Devuelve DTOs de lectura (no aggregates).

Ambos comparten la connection string del módulo. Coexisten sin conflicto: EF Core administra la conexión cuando el repositorio la necesita; Dapper abre una nueva conexión (o la toma del pool) cuando el query service la necesita. Postgres maneja el resto.

## Alternativas consideradas

### A. EF Core para todo

Simplicidad: un solo ORM, un mental model. Descartada porque:

- Queries complejas en EF Core (CTEs recursivos para correlativas, agregaciones del dashboard) son verbosas y a veces generan SQL subóptimo.
- Hidratar aggregates completos para pantallas que solo necesitan 3 campos es desperdicio de compute y memoria.
- La sintaxis LINQ limita el acceso a features de Postgres (full-text search nativo, `jsonb_path_query`, etc.).

### B. Dapper para todo

Mínima abstracción, perf pura. Descartada porque:

- Los writes de aggregates con invariantes y múltiples rows relacionadas pierden el beneficio del change tracking. Tendrías que escribir manualmente INSERT/UPDATE/DELETE para cada row.
- Sin unit of work out-of-the-box, hay que implementar transacciones y ordering a mano.
- Validación de invariantes cross-row (ej. `Review + ReviewAuditLog` en una sola operación) queda propensa a bugs.

### C. Marten (document DB sobre Postgres)

Alternativa JSONB-first. Buena integración con Wolverine. Descartada porque:

- Planb tiene un schema altamente relacional (correlativas, agregaciones, joins cross-entity). Document DB no encaja bien.
- Ya elegimos JSONB selectivamente para los casos correctos (`HistorialImport.raw_payload`, `ReviewAuditLog.changes`).

## Consecuencias

**Positivas:**

- EF Core hace writes limpios con unit of work automático (Wolverine `[Transactional]`).
- Dapper hace reads optimizados. Dashboard con JOINs complejos en una sola query. Simulator con CTEs recursivos performantes.
- Cada módulo tiene su propia estructura Infrastructure, conteniendo EF Core y Dapper side-by-side:

```
Planb.<Module>.Infrastructure/
├── Database/<Module>DbContext.cs
├── Configurations/         (EF Core fluent API)
├── Migrations/             (EF Core)
├── Repositories/           (EF Core: writes)
└── QueryServices/          (Dapper: reads)
```

**Negativas:**

- Dos mentales models en el Infrastructure del módulo. Devs tienen que elegir entre repo y query service al agregar funcionalidad.
- Dapper queries escritas a mano requieren testing más cuidadoso (SQL injection, mapping de tipos Postgres → C#).
- Cambios de schema tienen que propagarse a ambos: migrations de EF Core + actualizar queries Dapper afectadas.

**Regla de decisión para devs:**

> Si estás escribiendo una operación que modifica estado: usá el repositorio (EF Core).
> Si estás escribiendo una consulta de lectura que devuelve DTOs planos: usá el query service (Dapper).
> Si estás escribiendo un JOIN cross-schema para analítica: Dapper en QueryService, explícito sobre qué schemas referencia.

**Cuándo revisitar:**

- Si aparece un módulo cuya naturaleza es predominantemente document-based (improbable dado el dominio académico).
- Si el overhead de mantener dos mecanismos se vuelve mayor que el beneficio de performance (improbable en MVP).
