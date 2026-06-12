# ADR-0045: Owned-by-receiver para integration events cross-module (auto-quarantine)

- **Estado**: aceptado
- **Fecha**: 2026-06-12

## Contexto

US-019 (reportar una reseña) introdujo el primer caso de comunicacion asincrona cross-module donde el *publisher* y el *consumer* viven en assemblies distintos y el contrato (el tipo del evento) tiene que quedar en uno de los dos.

El flujo concreto es:

1. `Moderation` recibe un reporte de una reseña.
2. Cuenta cuantos reportes abiertos tiene esa reseña en el modulo `moderation`.
3. Si llega al threshold (ADR-0010), decide que la reseña debe ocultarse.
4. El ocultamiento es responsabilidad de `Reviews` (el aggregate `Review` expone `QuarantineByReports`).

Para que `Moderation` dispare el ocultamiento sin un acoplamiento directo tipo "llamo a un servicio de Reviews", usa un integration event via el outbox de Wolverine. Eso es correcto. La pregunta es: **en que assembly vive el tipo del evento?**

Las opciones relevantes son:

- El evento vive en `Planb.Moderation.Application` (el publisher define el contrato).
- El evento vive en `Planb.Reviews.Application` (el consumer define el contrato).
- El evento vive en `Planb.SharedKernel` (neutral).

La restriccion fundamental es que el grafo de assemblies debe ser aciclico. La dependencia de compilacion existente (previa a este decision) es: `Moderation` referencia `Planb.Reviews.Application.Contracts` para poder hacer la lectura sincrona `IReviewQueryService.GetAuthorUserIdAsync` (ADR-0017). Si `Reviews` tambien referenciara `Planb.Moderation.Application`, el grafo tendria un ciclo.

## Decision

El tipo `ReviewQuarantineRequestedIntegrationEvent` vive en `Planb.Reviews.Application.IntegrationEvents`. `Moderation` lo importa de ahi para publicarlo. `Reviews` lo consume localmente en `ReviewQuarantineRequestedHandler`.

El resultado:

```
Moderation --[compile-time]--> Reviews.Application  (para IReviewQueryService + el event type)
Reviews --[outbox/runtime]---> Reviews.Application  (consume su propio event type)
```

Sin ciclo. `Reviews` no sabe que `Moderation` existe; solo sabe que puede recibir un `ReviewQuarantineRequestedIntegrationEvent` y sabe como procesarlo. El handler `ReviewQuarantineRequestedHandler` es simplemente un consumer de un evento que esta definido en la misma assembly.

La convencion que se establece para todos los eventos de este tipo (donde el publisher pertenece a un BC distinto y el objetivo es actuar sobre un aggregate del consumer): **el tipo vive en el BC que recibe la accion (el receiver/consumer), no en el que la dispara**.

La justificacion semantica tambien es correcta: el evento modela "algo que se puede pedir de una reseña" (cuarentena por reportes), que es un contrato del dominio de reseñas. Que sea `Moderation` quien lo emite es un detalle de quien tiene la logica de threshold; no cambia que el contrato le pertenece a `Reviews`.

## Alternativas consideradas

**A. El evento vive en `Planb.Moderation.Application` (publisher-owned)**

`Reviews` tendria que referenciar `Planb.Moderation.Application` para poder consumir el tipo. Eso crea `Reviews -> Moderation`, que sumado a la dependencia existente `Moderation -> Reviews.Contracts` genera un ciclo logico (aunque tecnicamente `Contracts` esta separado del resto del modulo). En la practica obligaria a un refactor mas profundo de como se separan los contratos, o a depender de la convencion de que "Moderation solo referencia Reviews.Contracts, no Reviews.Application", lo que es fragil. Rechazada.

**B. El evento vive en `Planb.SharedKernel`**

`SharedKernel` esta pensado para primitivos de infraestructura (`Result<T>`, `IDateTimeProvider`, `IIntegrationEvent`), no para tipos de dominio. Poner `ReviewQuarantineRequestedIntegrationEvent` en `SharedKernel` contamina el kernel con semantica de dominio especifica. Ademas, si en el futuro hay 10 eventos de este tipo para distintos BCs, SharedKernel se vuelve un dumping ground. Rechazada.

**C. Un assembly separado `Planb.CrossModule.Events` (o similar)**

Rompe con la estructura flat actual de "cada modulo tiene su propio Application con sus contratos". Agrega un sexto proyecto que no corresponde a ningun bounded context. YAGNI: no hay suficientes eventos de este tipo para justificarlo. Rechazada.

**D. Llamada sincrona directa: `Moderation` llama `IReviewCommandService.QuarantineAsync(...)`**

Requiere que `Reviews.Application.Contracts` exponga una interfaz de escritura cross-BC, lo que rompe ADR-0017 (los Contracts son read-only para lecturas sincronas; las escrituras van por eventos). Ademas, el acoplamiento temporal es mas fuerte: si `Reviews` esta lento, afecta el handler de reporte de `Moderation`. Rechazada.

## Consecuencias

### Positivas

- El grafo de assemblies queda aciclico y verificable con NetArchTest (US-T07-b).
- `Reviews` encapsula el ocultamiento completamente: nadie fuera del modulo llama directamente a `review.QuarantineByReports(...)`.
- El contrato del evento es semanticamente correcto (pertenece al dominio de reseñas).
- Pattern reutilizable: cada vez que un BC externo necesita actuar sobre un aggregate de otro BC, el evento se define en el BC dueno del aggregate.

### Negativas

- `Moderation` referencia `Planb.Reviews.Application` para usar el tipo del evento. Esto es correcto dado el grafo existente, pero significa que `Moderation` tiene una dependencia de compilacion mas sobre `Reviews`. Hay que tener cuidado de que esa referencia no se expanda a otros tipos de `Reviews.Application` que no sean el event type y los contratos de lectura.
- Un developer nuevo puede confundirse: "por que `Moderation` publica un evento que esta definido en `Reviews`?". La documentacion inline de `ReviewQuarantineRequestedIntegrationEvent` explica el patron; este ADR es la fuente de razon.

### A vigilar

- Si en el futuro `Moderation` necesita actuar sobre aggregates de otros modulos (`Academic`, `Identity`), el mismo patron aplica: el event type vive en el modulo del aggregate, no en Moderation. Si eso escala a muchos eventos, revisar si tiene sentido un `Contracts` de escritura separado del de lectura.
- NetArchTest (US-T07-b, S6) debe incluir una regla que verifique que `Reviews` no referencia `Planb.Moderation.*` en tiempo de compilacion. Eso es el guardrail que previene que el ciclo se introduzca accidentalmente.

## Refs

- ADR-0010: threshold de auto-hide configurable por env var.
- ADR-0015: Wolverine como mediator; el outbox durable es el canal de entrega.
- ADR-0017: persistence ignorance + contratos de lectura cross-BC.
- `Planb.Reviews.Application/IntegrationEvents/ReviewQuarantineRequestedIntegrationEvent.cs`: el tipo del evento con su justificacion inline.
- `Planb.Moderation.Application/Features/ReportReview/ReportReviewCommandHandler.cs`: el publisher, con el threshold check y el `bus.PublishAsync`.
- `Planb.Reviews.Application/IntegrationEvents/ReviewQuarantineRequestedHandler.cs`: el consumer.
- US-T07-b: NetArchTest extension que incluye la regla `Reviews no referencia Moderation`.
