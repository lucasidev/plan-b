---
paths:
  - "frontend/src/**/*.test.{ts,tsx}"
  - "frontend/e2e/**/*.spec.ts"
  - "backend/**/tests/**/*.cs"
---

# Testing (planb)

Estás tocando un test. Antes de escribirlo, mirá qué capa corresponde a tu cambio: la tabla completa "qué test para qué cambio" está en [`docs/testing/conventions.md`](../../docs/testing/conventions.md), la pirámide formal en [ADR-0036](../../docs/decisions/0036-testing-pyramid-cross-stack.md).

Lo que se olvida:

- **Elegí la capa por el cambio, no por costumbre**: dominio (entidad/VO/Error) → domain unit (xUnit + Shouldly); handler + validator → handler unit (xUnit + NSubstitute); endpoint Carter / repo EF / query Dapper → integration (WebApplicationFactory + Postgres/Redis/Mailpit **reales**, no mocks); regla cross-cutting (boundaries, naming) → architecture (NetArchTest); frontend util/schema/action/componente → vitest; flujo completo multi-página → E2E Playwright.
- **Frontend co-localiza** el test con el código (`schema.test.ts` al lado de `schema.ts`), no en un `__tests__` aparte.
- **Integration usa infra real**, no mocks: esa es la razón de que la capa exista. Si lo estás mockeando, o es un unit test o está mal ubicado.
- **Rutas reales → el E2E no es opcional**: corré el spec visible antes de pedir OK (skill `e2e-zone`).

Correr: `just test` (todo) · `just frontend-test` (vitest) · `just frontend-test-e2e-show <spec>` (E2E visible) · `just ci` (las gates de CI).
