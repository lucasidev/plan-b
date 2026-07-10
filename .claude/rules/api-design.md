---
paths:
  - "backend/modules/**/Features/**/*Endpoint.cs"
---

# API design (planb)

Estás tocando un endpoint. El scaffold completo está en el skill `slice-backend`; esta regla es lo que se olvida al EDITAR uno que ya existe.

- **`Result<T>` a HTTP**: el endpoint mapea el `Result<T>` a status code con un `ToResult`/`ToProblem` privado que hace `switch` sobre `error.Type`. No hay helper centralizado (ADR-0016: cada endpoint tiene el suyo). El mapeo es fijo, respetalo: `Validation` da 400, `Unauthorized` 401, `Forbidden` 403, `NotFound` 404, `Conflict` 409, el resto 500.
- **El error a HTTP siempre es `Results.Problem`** (RFC 7807: title = `error.Code`, detail = `error.Message`), nunca `Results.BadRequest(string)`.
- **Ruta en inglés, REST**: `/api/{recurso}` en plural + verbo HTTP, no `/api/getX`. La identidad del user sale del JWT, no de la ruta ni del body.
- **Carter**: el endpoint es `ICarterModule` y se descubre por convención, no lo registres a mano.

Detalle: [ADR-0016](../../docs/decisions/0016-carter-para-endpoints-http.md) + skill `slice-backend`.
