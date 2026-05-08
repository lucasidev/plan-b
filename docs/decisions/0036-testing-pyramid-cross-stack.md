# ADR-0036: Pirámide de testing cross-stack

- **Estado**: aceptado
- **Fecha**: 2026-04-30
- **Supersedes**: parcialmente [ADR-0024](0024-dev-tooling-stack.md) (sólo la fila "Tests frontend"; el resto sigue vigente)

## Contexto

Tres hechos forzaron la decisión:

1. **Asimetría**. Backend tiene 38 integration tests verdes ([ADR-0027](0027-integration-tests-shared-postgres.md)) corriendo en CI con Postgres + Redis + Mailpit como service containers. Frontend tiene cero tests. `vitest.config.ts` está armado con `passWithNoTests: true`, `@playwright/test` está instalado pero no hay `playwright.config.ts` ni carpeta `e2e/`. CI corre `bun run test` que pasa porque no hay nada que correr.

2. **El gap se hizo visible en US-033** (forgot/reset password). Es la primera US que toca múltiples páginas frontend con redirects, query params, banner temporal y server actions encadenadas. Para validarla antes de mergear hubo que escribir un Playwright spec ad-hoc, correrlo una vez, y borrarlo. Eso prueba que el feature anduvo en ese momento; no protege a la próxima persona que cambie la pieza.

3. **Cada nueva US frontend va a tener este problema mientras no haya infra**. Sin testing institucionalizado, "QA" es eyeballeo manual en browser por slice. Eso escala mal: cuando un cambio en feature A rompe feature B, lo descubrimos cuando volvemos a tocar B (días o semanas después) en lugar de en el PR que rompe.

[ADR-0024](0024-dev-tooling-stack.md) ya había elegido vitest + Playwright como tooling. Lo que falta es institucionalizar **qué se testea con qué, en qué capa, con qué convenciones, y cómo eso entra a CI**. Eso es esta ADR.

## Decisión

**Cada capa de la app tiene un tipo de test que la cubre. Si una capa está sin un tipo de test pertinente, eso se trackea como deuda técnica explícita en una US.**

### Pirámide

```
                                          ┌──────────────────────┐
                                          │  E2E (Playwright)    │  pocos · lentos · top
                                          │  user flows reales   │
                                          └──────────┬───────────┘
                                ┌────────────────────┴────────────────────┐
                                │ Integration (xUnit + WebAppFactory)     │  ya existe (ADR-0027)
                                │ HTTP + Postgres + Redis + Mailpit reales│
                                └────────────────────┬────────────────────┘
              ┌──────────────────────────────────────┴───────────────────────────────────┐
              │ Component (vitest + Testing Library + jsdom)                             │
              │ formularios, hooks, RSC con stubs                                        │
              ├──────────────────────────────────────────────────────────────────────────┤
              │ Server Action (vitest, fetch mockeado)                                   │
              │ lógica de actions sin browser                                            │
              └──────────────────────────────────────────────────────────────────────────┘
   ┌──────────────────────────────────────────────────────────────────────────────────────┐
   │ Application/Handler (xUnit + NSubstitute + Shouldly)                                 │
   │ Wolverine handler + FluentValidation, deps mockeadas                                 │
   └──────────────────────────────────────────────────────────────────────────────────────┘
   ┌──────────────────────────────────────────────────────────────────────────────────────┐
   │ Domain (xUnit + Shouldly) + Schemas/Utils (vitest)                                   │
   │ entidades, VOs, errors backend; zod schemas + lib/ utils frontend                    │
   └──────────────────────────────────────────────────────────────────────────────────────┘
                                            ▲
                              base ancha · rápidos · baratos · muchos
```

Reglas duras:

- **Subir un nivel sólo si el inferior no alcanza**. Si una regla del dominio se puede testear sin EF, va al unit del dominio, no a integration. Si una validación de Zod se puede testear puro con vitest, no se sube a component test ni a E2E.
- **No mockees lo que no posees**. Postgres, Redis, SMTP los corremos reales (containers). EF, sí, mockeable a nivel de repos. La línea es: el contrato del recurso externo es de ellos, su confiabilidad la testea el integration; arriba de eso mockeás.
- **Un E2E vale por 50 unitarios pero cuesta 50 veces más**. Por eso pocos E2E (un happy path por feature, dos o tres edge cases críticos), pirámide alta.
- **Cada capa tiene su carpeta y su nombre**. No tests "varios". El siguiente programador tiene que saber dónde poner su test sin pensarlo.

### Tooling por capa

| Capa | Stack | Estado pre-ADR | Acción |
|---|---|---|---|
| **Backend Domain unit** | xUnit + Shouldly | Mezclado dentro de IntegrationTests | Separar en `Planb.<Module>.Tests` (US-T03) |
| **Backend Handler unit** | xUnit + NSubstitute + Shouldly | No existe | Agregar (US-T03) |
| **Backend Integration** | xUnit + WebApplicationFactory + Postgres/Redis/Mailpit reales | Existe | Mantener tal cual (ADR-0027) |
| **Backend Architecture** | NetArchTest | No existe | Nuevo proyecto `Planb.ArchitectureTests` (US-T04) |
| **Frontend Schemas/Utils** | vitest + jsdom | Config existe, 0 tests | Agregar tests sample + convención (US-T01) |
| **Frontend Server Actions** | vitest + fetch mockeado | No existe | Patrón nuevo (US-T01) |
| **Frontend Components** | vitest + @testing-library/react + user-event | No existe; faltan deps | Instalar + setup (US-T01) |
| **Frontend E2E** | Playwright + chromium (FF/Webkit opcional) | `@playwright/test` instalado, 0 tests | Setup permanente + helpers (US-T02) |
| **API contract** | (deferred: TBD ADR aparte) | No existe | Defer hasta que duela |

### Layout de archivos

**Backend** (un proyecto de tests por tipo, dentro de cada módulo):

```
backend/
├── modules/<m>/
│   ├── src/...
│   └── tests/
│       └── Planb.<M>.Tests/                    ← domain + handlers, mockeados
│           ├── Domain/
│           │   └── Users/UserTests.cs
│           └── Application/
│               └── Features/<UseCase>/
│                   └── <UseCase>CommandHandlerTests.cs
├── tests/
│   ├── Planb.IntegrationTests/                 ← cross-module + endpoints (sin tocar)
│   └── Planb.ArchitectureTests/                ← reglas de boundary (US-T04)
│       └── ModuleBoundariesTests.cs
```

**Frontend** (tests co-localizados al source para vitest, E2E aparte):

```
frontend/
├── src/
│   ├── features/<feature>/
│   │   ├── actions.ts
│   │   ├── actions.test.ts                     ← server action tests
│   │   ├── schema.ts
│   │   ├── schema.test.ts                      ← zod schema tests
│   │   └── components/
│   │       ├── <feature>-form.tsx
│   │       └── <feature>-form.test.tsx         ← component tests
│   └── lib/
│       ├── utils.ts
│       └── utils.test.ts                       ← util tests
├── e2e/
│   ├── auth/
│   │   ├── sign-in.spec.ts
│   │   └── forgot-password.spec.ts             ← uno por user flow
│   └── helpers/
│       ├── personas.ts                         ← Lucía, Mateo, etc.
│       ├── mailpit.ts                          ← extract token, list mails
│       └── redis.ts                            ← clear rate limits
├── playwright.config.ts                        ← permanente
├── vitest.config.ts                            ← existente, ajustar setupFiles
└── test-setup.ts                               ← @testing-library/jest-dom + helpers globales
```

### Naming

- **Backend (xUnit)**: archivo `<TypeUnderTest>Tests.cs`. Método `Method_Scenario_ExpectedOutcome`. Ej: `Handle_EmailNotVerified_ReturnsSuccessWithoutSendingMail`.
- **Frontend unit/component (vitest)**: archivo `<source>.test.ts(x)`. Bloques `describe('<componente o función>', () => { it('<comportamiento esperado en español>', ...) })`. UX strings en español, descriptores técnicos en inglés.
- **Frontend E2E (Playwright)**: archivo `<feature>.spec.ts` o `<US-NNN>-<flow>.spec.ts` cuando trackea una US específica. Test name = acción del usuario en presente: `'recovers password from sign-in'`.

### CI integration

CI actual (`.github/workflows/ci.yml`) tiene dos jobs:
- `backend`: format check + build (Release) + test. Service containers: postgres, redis, mailpit. **Sin cambio inmediato**: cuando aterricen US-T03 + US-T04, los nuevos proyectos de tests ya quedan dentro del `dotnet test` global.
- `frontend`: install + lint + typecheck + build + test. **Ajuste con US-T01**: agrega `@testing-library/*` deps + `setupFiles`, `bun run test` empieza a correr tests de verdad en vez de pasar trivialmente.

Job nuevo con **US-T02**:
- `frontend-e2e`: corre Playwright contra un backend dev levantado en background. Service containers postgres + redis + mailpit. Trigger: **on-demand** (label `e2e` en el PR o push a `main`), no en cada push, para no bloquear feedback rápido. Cuando estabilice (después de 4-5 sprints sin flakes), considerar moverlo a always-on.

Coverage gates: **no**. Tracking sí (subir reports a artifacts), gate no. Coverage % obsesiva lleva a tests inútiles que cubren líneas sin verificar comportamiento.

### Pre-commit / pre-push

- **Pre-commit** (lefthook actual): format + lint sólo, sin tests. Mantener: los tests rápidos viven en `pre-push`.
- **Pre-push** (lefthook actual): backend build + frontend lint + typecheck. **Ajuste con US-T01**: agregar `bun run test` (vitest, < 5s con tests sample). NO agregar E2E al pre-push (lento, requiere backend levantado).

## Alternativas consideradas

### A. Status quo + QA manual frontend

Costo: cero. Lo descartamos porque ya está fallando: cada US frontend nueva multiplica el tiempo de QA manual y el riesgo de regresiones invisibles. La sintomática fue US-033, pero el patrón aplica a toda US no trivial que toque múltiples páginas o estados.

### B. Adopción lazy "agregamos tests cuando duela"

Costo: aparente cero, real progresivo. Lo descartamos porque no hay convención compartida: cada US autora elige stack distinto, layout distinto, granularidad distinta. La doc fragmenta y los reviewers no saben qué pedir. El próximo developer tiene que reverse-engineer convenciones.

### C. Pirámide completa con convenciones formales (la elegida)

Costo: 1-2 sprints de yak shaving (US-T01 a US-T04). Beneficio: el siguiente desarrollador (sea humano o agente) sabe qué testing escribir, dónde, con qué stack, sin preguntar. Las convenciones se vuelven texto en CLAUDE.md y se enforce con review + (eventualmente) NetArchTest.

### D. Property-based testing en domain (FsCheck / Verify)

Considerada y deferida. Tiene casos buenos en planb (sliding window del rate limiter, conversion de timezones, parser de tokens). Lo dejamos para una ADR aparte cuando aparezca el primer caso fuerte. No bloquea esta decisión.

### E. Mutation testing (Stryker / Stryker.NET)

Considerada y deferida. Útil para validar que la suite tiene buena fault detection una vez que existe. Hoy no existe, así que arrancar con mutation testing antes de tener tests sería ridículo. ADR aparte cuando la suite madure.

### F. Visual regression testing (Chromatic / Percy / Playwright snapshot)

Considerada y deferida. La UI todavía se mueve mucho (cada review pass cambia spacing, colores, copy). Visual regression hoy generaría falsos positivos a una tasa alta. Reconsiderar después de Sprint 4 cuando el design system esté congelado.

### G. Contract testing entre backend y frontend (OpenAPI codegen / Zod compartido / Pact)

Considerada y deferida. No estamos rompiendo contratos hoy porque los DTOs son tipados a mano y poco frecuentes. Cuando aparezca el primer drift contract → bug en producción, abrimos ADR aparte. Pact específicamente no aplica (modular monolith, no microservicios).

### H. Coverage gates (mínimo X% bloquea merge)

Considerada y descartada. La regla "% cubierto" optimiza para tests que ejercen líneas sin verificar comportamiento. Tracking sí (reports en artifact); gate no.

## Consecuencias

### Positivas

- Cada feature US nueva agrega tests en al menos 2 capas. PR review tiene un checklist concreto (ver `.github/pull_request_template.md`).
- El gap "feature anda en mi máquina pero no hay nada en CI que lo valide" deja de existir gradualmente conforme aterrizan US-T01 a T05.
- Convenciones documentadas en `docs/testing/conventions.md` + secciones de Testing en `backend/CLAUDE.md` y `frontend/CLAUDE.md`. Reviewers tienen una referencia para "esto debería tener test de qué tipo".
- El spec ad-hoc de US-033 que corrimos manualmente queda documentado como caso de uso del setup permanente, y se migra a `frontend/e2e/auth/forgot-password.spec.ts` como parte de US-T02.

### Negativas

- CI se vuelve más lento. Estimación: backend +0s (proyectos `Planb.<M>.Tests` usan in-memory, son rápidos); frontend +30s con vitest reales; frontend-e2e job +5-7min on-demand. Se mitiga con on-demand trigger y caching de browsers.
- Inversión inicial 1-2 sprints (US-T01 a T05). Bloquea features urgentes si se priorizan los T-stories arriba de las features. Mitigación: T-stories son non-blocking, podemos aterrizarlos en paralelo a features.
- Más superficie para mantener cuando hay refactor grande (cambios de routing, cambios de schema). Tests E2E especialmente son frágiles a redesigns. Mitigación: helpers (`personas.ts`, `mailpit.ts`) absorben el churn donde se puede.

### Lo que se conserva del status quo

- ADR-0027 (integration tests contra Postgres compartido) sigue vigente sin cambios.
- ADR-0024 sigue vigente excepto la fila "tests frontend" (que esta ADR formaliza con el stack vitest + Testing Library + Playwright).
- xUnit + NSubstitute + Shouldly como stack backend.
- Conventional Commits + Lefthook como gates locales.

## Implementación

Las US para implementar esta decisión viven en `docs/domain/user-stories/` con prefijo `US-T`:

- **US-T01-f**: Frontend unit/component testing infra (vitest + Testing Library + sample tests por capa).
- **US-T02-f**: Frontend E2E infra (Playwright config permanente + e2e helpers + migración del spec de US-033 + CI job on-demand).
- **US-T03-b**: Backend unit test layer split (separar `Planb.<M>.Tests` por módulo, empezando por identity).
- **US-T04-b**: Backend architecture tests con NetArchTest.
- **US-T05-i**: PR template + CHANGELOG automation (ver [ADR-0037](0037-changelog-automation-auto-append.md)).

Las T-stories son **non-blocking**: pueden aterrizar en paralelo a features regulares. La única dependencia dura es US-T01 antes de T02 (Playwright reusa setup helpers de vitest si los hay).

## Refs

- [ADR-0024](0024-dev-tooling-stack.md): tooling stack (parcialmente superseded por esta ADR).
- [ADR-0027](0027-integration-tests-shared-postgres.md): integration tests pattern (vigente).
- [ADR-0037](0037-changelog-automation-auto-append.md): changelog automation (companion).
- [docs/testing/conventions.md](../testing/conventions.md): living how-to.
- [.github/pull_request_template.md](../../.github/pull_request_template.md): checklist por PR.
