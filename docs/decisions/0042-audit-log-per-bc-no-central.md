# ADR-0042: Audit log per-BC (no módulo central)

- **Estado**: aceptado
- **Fecha**: 2026-05-09

## Contexto

[ADR-0031](0031-review-audit-log-como-projection.md) estableció `ReviewAuditLog` como projection local del módulo Moderation que escucha events de Reviews + TeacherResponse + Identity (limitado a UserDisabled). En ese momento el alcance del audit log era **per-review**: el moderator abre el detalle de UNA reseña y ve su timeline.

El canvas v2 (2026-05-09, post-zip-admin) introduce dos vistas nuevas que extienden el alcance:

1. **Tab "Audit log" en el detalle de usuario** (`AdmUsuarioDetalle`): timeline de eventos del usuario específico cross-BC (signup, login, reviews escritas, reports recibidos, strikes emitidos, bans, password changes, etc.).
2. **Feed de actividad reciente del dashboard ops** ([US-081](../domain/user-stories/US-081.md)): mix global de eventos del sistema en orden cronológico (último admin que decidió un report, última uni afiliada, último merge de duplicados, último user baneado, etc.).

Sumado a lo anterior, las US-055, US-068, US-072, US-082, US-083, US-084, US-085 introducen entre 15 y 20 nuevas acciones que necesitan audit log (`review.deleted_by_self`, `plan.imported`, `subject.merged`, `plan.migration.applied`, `strike.issued`, `strike.decayed`, `strike.cancelled`, `review.edit_requested`, `review.edit_completed`, `review.edit_deadline_expired`, `review.upheld_with_ban`, `user.banned_from_moderation`, `user.password_changed`, `user.self_disabled`, `university.created`, `university.archived`, `careerplan.created`, `subject.edited`, `teacher.created`, `commission.created`, etc.).

La pregunta arquitectónica: ¿se mantiene el patrón per-BC de ADR-0031 (cada módulo tiene su propia projection local) o se crea un módulo central `Audit` que consuma events de todos los BCs y persista todo en una sola tabla `audit_log`?

## Decisión

**Mantenemos audit log per-BC**. Cada módulo activo o futuro mantiene su propia projection local con su propia tabla, alimentada por suscriptores Wolverine de los events del propio BC + integration events relevantes de otros BCs.

Las vistas cross-BC del canvas (audit log per-user en `AdmUsuarioDetalle`, feed global del dashboard ops) se construyen como **read models con Dapper cross-schema**. ADR-0017 lo permite explícito para lecturas de presentación.

### Patrón concreto

Cada BC con eventos auditables tiene su propio audit log:

| Módulo | Projection | Tabla |
|---|---|---|
| Moderation | `ReviewAuditLog` (ADR-0031, existente) | `moderation.review_audit_log` |
| Identity | `UserAuditLog` (nueva) | `identity.user_audit_log` |
| Moderation | `ModerationActionLog` (nueva) | `moderation.action_log` (decisiones de moderators sobre reports, edits, bans) |
| Academic | `CatalogAuditLog` (nueva) | `academic.catalog_audit_log` (afilia uni, importa plan, merge subjects, migración) |
| Planning | (futuro, si hace falta) | `planning.audit_log` |

Cada projection tiene el mismo shape mínimo:

```
id            UUID PK
at            TIMESTAMPTZ NOT NULL
actor_id      UUID NULL          -- quien generó el event
target_id     UUID NULL          -- aggregate al que afecta (review_id, user_id, plan_id, etc.)
action        TEXT NOT NULL      -- enum de acciones de ese BC
context       JSONB NULL         -- payload variable
```

Naming consistente entre BCs (`actor_id`, `target_id`, `at`, `action`, `context`) para que el read model cross-schema joinee con UNION ALL sin sorpresas.

### Read models cross-schema

Las dos vistas nuevas del canvas se sirven con Dapper queries que cruzan schemas:

- **Tab "Audit log" del usuario** ([US-086](../domain/user-stories/US-086.md)): `SELECT * FROM ... UNION ALL ...` sobre los audit logs de cada BC filtrados por `actor_id = X OR target_id = X` + ORDER BY `at DESC` + paginación.
- **Feed global del dashboard admin** ([US-087](../domain/user-stories/US-087.md)): UNION ALL sin filter de user + ORDER BY `at DESC` + LIMIT N + paginación.

Las queries cross-schema son legítimas por [ADR-0017](0017-persistence-ignorance.md) cuando son **read-only de presentación**. No FK cross-schema, no navegación EF cross-module, no escritura cross-schema.

### Política de retención

Cada BC define su propia retención según necesidad regulatoria. Default propuesto:

- Reviews / Moderation: 5 años (alineado a posible regulación de moderación de contenido).
- Identity / User: 2 años activo + 5 años inactivo (GDPR alineado).
- Academic / Catalog: 10 años (cambios de plan tienen valor histórico).

Implementado con scheduled jobs Wolverine per-BC. Cada BC corre su propio `PurgeOldAuditEntriesJob` con su threshold.

## Alternativas consideradas

### Módulo Audit central

Un módulo nuevo `Audit` con su propio schema `audit` y una tabla única `audit.audit_log`. Suscribe a integration events de todos los BCs vía Wolverine outbox y persiste cada uno como row con `payload JSON` opaco + metadata uniforme.

Pros:
- 1 tabla → 1 query para el feed global (sin UNION ALL cross-schema).
- 1 política de retención uniforme.
- GDPR delete por user: 1 DELETE con filter (`WHERE actor_id = X OR target_user_id = X`).
- Búsqueda full-text trivial (1 GIN index sobre `context::jsonb`).

Contras (decisivos):

- **Single point of failure de auditoría**. Bug en el subscriber proyectando un BC = audit huérfano de TODOS los BCs hasta que se arregle.
- **Acopla el módulo Audit a contratos de N BCs**. Aunque el `payload` se persiste como JSON opaco, los subscribers tienen que conocer los shapes de cada event para mapearlos. Cada feature nueva en cualquier BC requiere un subscriber nuevo en Audit.
- **Refactor a microservicios pierde la cohesión local**. Si un día Reviews se separa, hay que migrar sus audits del módulo central, no llevárselos con él.
- **Política de retención uniforme es asumir que todos los BCs quieren lo mismo**. Si Academic necesita 10 años y Identity 2, hay que agregar un campo `retention_class` que en práctica reintroduce la fragmentación.
- **Volumen actual no justifica**. Plan-b MVP va a generar < 10k events/mes. El UNION ALL cross-schema con índices buenos es feasible hasta 10M+ rows.
- **GDPR delete con per-BC es resoluble** con un `UserDataDeletionRequested` integration event que cada BC consume y limpia su parte. Pattern estándar y testable.

Conclusión: las ventajas operacionales del central no justifican la pérdida de cohesión local + el riesgo de SPOF + el acoplamiento implícito. Para volumen masivo (>>1M events/mes) o GDPR como hard requirement con SLA legal, central sería razonable. Plan-b no es ninguno de los dos casos.

### Audit central con event-payload opaco (no entidades)

Variante del central donde el módulo Audit nunca importa entidades de otros BCs, solo persiste el `payload` del event como JSON opaco. Esto técnicamente no rompe persistence ignorance (el módulo Audit no sabe de Reviews, solo de `ReviewEdited.payload`).

Contras: sigue siendo SPOF, sigue acoplando a contratos públicos de events, sigue siendo política de retención uniforme. La "no violación" de persistence ignorance es legítima pero no resuelve los otros contras.

### Hardcoded en cada handler

Cada feature escribe su audit log directo a su tabla, sin projector centralizado por BC. Equivalente a "tener audit log pero sin patrón".

Contras: lógica esparcida, fácil olvidar agregar entry cuando se agrega event nuevo. Mismo contra que ADR-0031 ya descartó para Reviews.

## Consecuencias

**Positivas**:

- Cohesión de dominio preservada. Cada BC sabe de lo suyo. Bug en un projector afecta solo a su BC.
- Refactor a microservicios sigue feasible: cada BC se lleva su audit consigo.
- Tests por BC independientes.
- Diff `before/after` tipado en cada BC (Reviews sabe interpretar `ReviewEdited.changes`, Academic sabe interpretar `PlanImported.diff`, etc.). Central tendría que ser opaco o serializar/deserializar shapes.
- Política de retención configurable per-BC. Cada uno decide.
- Falla aislada de proyección: bug en `UserAuditLog` no rompe `ReviewAuditLog`.
- Replica el patrón ya establecido en ADR-0031. No introduce paradigma nuevo.

**Negativas**:

- Read model cross-schema con UNION ALL es más código que central. **Argumento de implementación, no de arquitectura**. Se acepta como costo.
- GDPR delete requiere coordinación cross-BC vía evento (`UserDataDeletionRequested`). Más trabajo que `DELETE WHERE user_id = X` único, pero pattern estándar y testable.
- Política de retención uniforme requiere coordinación entre BCs si se quiere alineada. Configuración compartida vía env vars lo resuelve.
- Búsqueda full-text de audits cross-BC es más cara (requiere consultar N tablas o crear un read model derivado). Out de MVP; si llega, se evalúa.

**No-decisión explícita**:

- No definimos cuándo Reviews / Moderation deben separar sus projections (ej. `ReviewLifecycleAuditLog` vs `ReviewModerationAuditLog`). ADR-0031 ya menciona el split cuando el projector se vuelve un blob. Aplica per-BC: cada uno decide su nivel de granularidad.
- No definimos si los audit logs son inmutables a nivel DB (sin UPDATE, sin DELETE). ADR-0031 lo deja como convención del projector. Aplica acá: cada BC respeta append-only en su projection.

## Cuándo revisitar

- Si el volumen de events crece >>1M/mes y el feed global del dashboard se vuelve lento con UNION ALL cross-schema: evaluar materialización del feed global como read model adicional con job que populate de los projectors per-BC. NO migrar a central; mantener fuente de verdad per-BC + cache pre-computado.
- Si GDPR pasa a ser hard requirement con SLA legal de delete < 24h: evaluar central como sub-proyecto de compliance. Para MVP el pattern de evento de deletion cross-BC alcanza.
- Si aparece un BC con eventos extremadamente heterogéneos cuya retención + búsqueda no se ajusta al patrón: split de ese BC en su propia projection vale, no abandono general del patrón.

## Refs

- [ADR-0017](0017-persistence-ignorance.md): persistence ignorance. Permite read models con Dapper cross-schema.
- [ADR-0030](0030-cross-bc-consistency-via-wolverine-outbox.md): integration events vía Wolverine outbox. Mecanismo por el cual cada BC publica sus events para que sus propios projectors (y otros BCs interesados) los consuman.
- [ADR-0031](0031-review-audit-log-como-projection.md): primer audit log per-BC. Este ADR formaliza y extiende el patrón a otros BCs.
- US relacionadas: [US-053](../domain/user-stories/US-053.md), [US-086](../domain/user-stories/US-086.md), [US-087](../domain/user-stories/US-087.md), [US-068](../domain/user-stories/US-068.md), [US-081](../domain/user-stories/US-081.md).
