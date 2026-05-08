# ADR-0015: Wolverine como mediator, message bus y outbox durable

- **Estado**: aceptado
- **Fecha**: 2026-04-23

## Contexto

El modular monolith de planb (ADR-0014) requiere tres capacidades:

1. **Mediator in-process** para dispatch de commands y queries dentro de un módulo.
2. **Pipeline behaviors** (logging, validación, unit of work) cross-cutting aplicables a los handlers.
3. **Integration events cross-module con outbox durable**: cuando un módulo emite un evento, la entrega a otros módulos tiene que ser transaccional (commit conjunto con el cambio local) y resistente a reinicios.

(3) es el corazón del modular monolith. Sin outbox confiable, los eventos cross-module pueden perderse o dispararse antes de que el commit de la DB sea durable, causando inconsistencia.

MediatR fue históricamente la opción default para (1) y (2) en .NET, pero pasó a licencia comercial en 2025 (Lucky Penny Software, free tier limitado a orgs <$1M revenue).

## Decisión

**Wolverine** (JasperFx, Jeremy Miller) como reemplazo unificado para (1), (2) y (3).

Wolverine incluye nativamente:
- Dispatch in-process de commands/queries con handlers descubiertos por convención (métodos estáticos, sin interfaces obligatorias).
- Pipeline middlewares por convención (`Before`, `After`, `Finally`).
- **Outbox transactional durable** con persistencia en Postgres.
- Integration events con fanout local y opcionalmente externo (brokers).
- Saga stateful nativa.
- Auto Unit-of-Work con `[Transactional]` o `AutoApplyTransactions()`.
- Source generation del glue code al startup (sin reflection en runtime).

Se usa como dispatcher exclusivo del sistema. La librería `SharedKernel` define abstracciones propias (`IMessageBus`, command/query base) que en el MVP se alinean con las de Wolverine; si en el futuro migrásemos, hay una capa de indirección.

## Alternativas consideradas

### A. MediatR (Lucky Penny Software)

Familiar, estable, pequeño. Descartada porque:

- Licencia comercial. Legalmente alcanza el free tier para planb pero es incómodo dado el contexto del proyecto (sin presupuesto, co-titularidad con la universidad).
- No incluye outbox: implementarlo a mano es ~200 líneas de tabla + dispatcher + deduplication + retry + dead-letter.
- No incluye sagas ni brokers.

### B. Mediator (Martin Othamar)

Reemplazo libre (MIT) de MediatR con source generators. Buena opción para solo-dispatch. Descartada porque es solo dispatcher: necesitaríamos implementar outbox a mano igual. Para un modular monolith, ese trabajo se evita con Wolverine.

### C. Shiny.Mediator

Lightweight, libre, source generators. Similar a Mediator (Othamar) pero menos comunidad. Descartada por la misma razón: no cubre outbox.

### D. MassTransit solo

Message bus maduro. Descartada: su sweet spot son brokers externos (RabbitMQ, Kafka). Para in-process dispatch dentro de un modular monolith es overkill; la documentación está mayormente orientada a sistemas distribuidos.

## Consecuencias

**Positivas:**

- Outbox durable de fábrica. Cero trabajo de mantenimiento de infraestructura de eventos.
- Integration events cross-module con garantía transaccional: el cambio local y el evento emitido viven en el mismo commit de Postgres.
- `[Transactional]` middleware elimina boilerplate de UoW en cada handler.
- Source generation al startup = cero reflection runtime, buena perf, compatible con AOT si lo queremos.
- Saga pattern disponible cuando aparezca un caso (actualmente no en el MVP).

**Negativas:**

- Curva de aprendizaje más alta que MediatR para quien viene de ese patrón. La diferencia entre `Invoke`/`Send`/`Publish` es explícita y requiere pensarlo.
- Surface de configuración más rica: hay más opciones para setear al bootstrap (outbox schema, transactional middleware policy, etc.).
- Dependencia relativamente joven en términos de ecosistema vs MediatR.

**Cuándo revisitar:**

- Si Wolverine introduce cambios incompatibles que complican la migración o si la comunidad se reduce significativamente.
- Si planb evoluciona a usar brokers externos: Wolverine ya los soporta, no habría migración.
