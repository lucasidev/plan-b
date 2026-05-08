# ADR-0016: Carter para endpoints HTTP (rechazo a WolverineFx.Http)

- **Estado**: aceptado
- **Fecha**: 2026-04-23

## Contexto

Planb expone una API REST para el frontend Next.js. Dado el compromiso de Clean Architecture con vertical slices (Command + Handler + Validator + Endpoint + Request + Response por use case), la pregunta es cómo organizar los endpoints HTTP.

Tres opciones relevantes en .NET 10:

- **Minimal APIs vanilla**: `app.MapGet/MapPost` directo en `Program.cs` o en archivos de extensión.
- **Carter**: librería que define endpoints como clases (`ICarterModule`), agrupadas por feature. Descubrimiento automático al startup.
- **WolverineFx.Http**: integración HTTP nativa de Wolverine. Métodos con atributos (`[WolverinePost]`) donde el endpoint HTTP **es** el handler de Wolverine: sin dispatch intermedio.

## Decisión

**Carter**. Cada feature define un `ICarterModule` con su endpoint, que recibe un `IMessageBus` de Wolverine y dispatchea a los handlers de Application.

Pattern por use case:

```
Planb.<Module>.Application/Features/CreateReview/
├── CreateReviewCommand.cs        (sealed record: input al handler)
├── CreateReviewCommandHandler.cs (maneja dominio, no sabe de HTTP)
├── CreateReviewValidator.cs      (FluentValidation)
├── CreateReviewEndpoint.cs       (ICarterModule: sabe HTTP, dispatchea al handler)
├── CreateReviewRequest.cs        (body HTTP)
└── CreateReviewResponse.cs       (respuesta HTTP)
```

El endpoint solo se ocupa de:
- Routing (ruta, verbo, parámetros).
- Binding del body y queries.
- Mapear `Result<T>` al status code HTTP apropiado.

La lógica de dominio vive en el handler, que no referencia `Microsoft.AspNetCore.*`.

## Alternativas consideradas

### A. Minimal APIs vanilla

Definir endpoints con `app.MapPost("/reviews", ...)` en archivos de extensión. Funciona bien para proyectos chicos. Descartada porque con 30-50 endpoints MVP la organización se vuelve incómoda: endpoints desparramados o concentrados en un archivo gigante.

Carter resuelve esto agrupando endpoints en clases por feature, alineadas con el vertical slice.

### B. WolverineFx.Http

Atributos `[WolverinePost("/reviews")]` sobre métodos estáticos que son simultáneamente el endpoint HTTP y el handler de Wolverine. Elimina la indirección "endpoint → dispatch → handler" que Carter mantiene.

Descartada por un motivo principal: **colapsa HTTP y dominio en el mismo método**. El método ahora sabe simultáneamente cómo interpretar HTTP (status codes, bindings, headers) y cómo ejecutar la operación de dominio. Eso rompe la separación que es el punto de Clean Architecture.

En un proyecto que prioriza shipping rápido sobre rigor, WolverineFx.Http es una opción válida: menos código, menos archivos. Planb prioriza rigor (es su producto), así que el costo de un archivo Endpoint extra por feature se paga con gusto.

## Consecuencias

**Positivas:**

- El handler no depende de `Microsoft.AspNetCore.*`. Testeable sin pipeline HTTP.
- El handler se puede exponer también vía CLI, gRPC, o un job background, sin reescribir lógica: cambiaría solo el endpoint.
- Developer puede razonar sobre "qué HTTP hace esto" mirando solo el endpoint, y sobre "qué hace el dominio" mirando solo el handler.
- Carter tiene soporte de autenticación, authorization policies, OpenAPI, y validaciones integrables con FluentValidation.

**Negativas:**

- Un archivo extra por use case respecto a WolverineFx.Http (~50 features × 1 archivo = 50 archivos más).
- El endpoint tiene algo de boilerplate (bind request, invoke, map Result).

**Mitigaciones:**

- Helper extension `ToHttpResult(this Result<T>)` reduce el boilerplate del endpoint a 2-3 líneas.
- OpenAPI se genera automáticamente desde la registración de Carter + atributos.

**Cuándo revisitar:**

- Si el equipo crece y la ceremonia por use case se vuelve prohibitiva.
- Si aparece un feature crítico que solo funciona con WolverineFx.Http (ej. binding específico). Se puede mezclar: Carter para el 95%, WolverineFx.Http puntualmente.
