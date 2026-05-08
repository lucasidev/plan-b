# Testing — convenciones de planb

Living document. Cómo escribir, dónde poner y cómo correr tests.

Decisión que lo motiva: [ADR-0036 — Pirámide de testing cross-stack](../decisions/0036-testing-pyramid-cross-stack.md).

## TL;DR

| Tocaste… | Test que necesitás | Stack | Dónde vive |
|---|---|---|---|
| Entidad / VO / Error del dominio backend | Domain unit | xUnit + Shouldly | `modules/<m>/tests/Planb.<M>.Tests/Domain/` |
| Wolverine handler + validator | Handler unit | xUnit + NSubstitute + Shouldly | `modules/<m>/tests/Planb.<M>.Tests/Features/<UseCase>/` o `Application/Features/<UseCase>/` |
| Endpoint Carter / repository EF / Dapper query | Integration | xUnit + WebApplicationFactory + Postgres/Redis/Mailpit reales | `tests/Planb.IntegrationTests/<Module>/` |
| Regla cross-cutting (boundaries, naming, etc.) | Architecture | NetArchTest | `tests/Planb.ArchitectureTests/` |
| Util / parser / `lib/*.ts` | Utils | vitest + jsdom | `lib/utils.test.ts` (co-localizado) |
| Schema Zod | Schema | vitest | `features/<f>/schema.test.ts` |
| Server Action | Action | vitest + fetch mockeado | `features/<f>/actions.test.ts` |
| Componente cliente / hook | Component | vitest + @testing-library/react + user-event | `features/<f>/components/<comp>.test.tsx` |
| User flow completo (multi-página, auth) | E2E | Playwright + chromium | `frontend/e2e/<área>/<flow>.spec.ts` |

Si no sabés qué test hace falta para tu cambio, **el PR template tiene un checklist por capa**. Tildá el que aplica, dejá explícito el resto.

## Cómo correr tests

### Local

```bash
# todo
just test

# backend solo
just backend-test
just backend-test-unit            # próximamente, cuando US-T03 separe los proyectos
just backend-test-integration     # próximamente

# frontend solo
just frontend-test                # vitest, rápido
just frontend-test-e2e            # Playwright headless, requiere backend levantado
just frontend-test-e2e-show       # Playwright con browser visible y slowMo (ver el flow correr)
```

Ambos recipes aceptan args, ej: `just frontend-test-e2e-show e2e/auth/onboarding.spec.ts`.

### CI

`just ci` corre las mismas gates que GitHub Actions. Antes de pushear, si tu cambio toca código real, corré `just ci` o al menos `just lint && just test`. Pre-push hooks corren build + typecheck pero NO tests largos (E2E queda para CI on-demand).

## Backend

### Domain unit

Pure logic. Sin EF, sin Postgres, sin nada I/O. Sólo entidades, VOs, errors.

```csharp
// modules/identity/tests/Planb.Identity.Tests/Domain/Users/UserTests.cs
public class UserTests
{
    [Fact]
    public void RequestPasswordReset_DegenerateToken_ReturnsFailure()
    {
        var user = UserFactory.CreateVerified();
        var clock = new FakeClock(DateTime.UtcNow);

        var result = user.RequestPasswordReset(rawToken: "", clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.Code.ShouldBe(UserErrors.TokenBlank.Code);
    }
}
```

Reglas:
- Nada de mocks. Si necesitás mockear, no es domain unit, subí a handler unit.
- `IDateTimeProvider` reemplazado por un fake simple (`FakeClock`) en el test. No mockees con NSubstitute.
- Nombre del test: `Method_Scenario_ExpectedOutcome`.

### Handler unit

Wolverine handler + FluentValidation, deps mockeadas con NSubstitute.

```csharp
// modules/identity/tests/Planb.Identity.Tests/Features/RequestPasswordReset/RequestPasswordResetCommandHandlerTests.cs
public class RequestPasswordResetCommandHandlerTests
{
    [Fact]
    public async Task Handle_EmailNotVerified_ReturnsSuccessWithoutSendingMail()
    {
        var users = Substitute.For<IUserRepository>();
        users.FindByEmailAsync(Arg.Any<EmailAddress>(), Arg.Any<CancellationToken>())
             .Returns(UserFactory.CreateUnverified());
        var emails = Substitute.For<IVerificationEmailSender>();
        // ... arrange remaining deps with substitutes ...

        var result = await RequestPasswordResetCommandHandler.Handle(
            new RequestPasswordResetCommand("foo@bar.com"),
            users, unitOfWork, tokenGen, emails, publisher, clock, default);

        result.IsSuccess.ShouldBeTrue();
        await emails.DidNotReceive().SendPasswordResetAsync(
            Arg.Any<EmailAddress>(), Arg.Any<string>(), Arg.Any<CancellationToken>());
    }
}
```

Reglas:
- Mockear puertos (`IUserRepository`, `IVerificationEmailSender`, `IRateLimiter`, etc.). NO mockear `User`/`EmailAddress`/`Result` (son value types/aggregates, los construís de verdad).
- Una assertion por test cuando sea posible. Si necesitás múltiples, agrupá con descriptivos.
- Si el test pide demasiado setup (más de 5-6 substitutes), probablemente el handler tenga demasiadas deps — refactor antes de testear.

### Integration

Endpoints HTTP + Postgres/Redis/Mailpit reales, vía `WebApplicationFactory`. Patrón existente, ver [ADR-0027](../decisions/0027-integration-tests-shared-postgres.md).

```csharp
// tests/Planb.IntegrationTests/Identity/RequestPasswordResetEndpointTests.cs
public class RequestPasswordResetEndpointTests : IClassFixture<IdentityApiFixture>
{
    [Fact]
    public async Task Returns204_AndSendsMail_ForVerifiedUser()
    {
        await _fixture.SeedUserAsync("lucia@test.com", verified: true);

        var response = await _fixture.Client.PostAsJsonAsync(
            "/api/identity/forgot-password",
            new { email = "lucia@test.com" });

        response.StatusCode.ShouldBe(HttpStatusCode.NoContent);
        var mails = await _fixture.MailpitClient.GetMessagesAsync();
        mails.ShouldContain(m => m.To == "lucia@test.com");
    }
}
```

Reglas:
- DB efímera por test class via fixture. Cada test arranca con DB limpia (o con seed conocido del fixture).
- Mailpit + Redis se asume corriendo (CI los levanta como service containers; local los levanta `just infra-up`).
- Tests integration son el último recurso, no el primero. Si la lógica se puede cubrir en handler unit, va a handler unit.

### Architecture

Reglas de boundary, una por proyecto separado. Falla en CI si alguien rompe la convención.

```csharp
// tests/Planb.ArchitectureTests/ModuleBoundariesTests.cs
public class ModuleBoundariesTests
{
    [Fact]
    public void Endpoints_DoNotInjectDbContext()
    {
        var result = Types.InAssembly(IdentityAssembly)
            .That().HaveNameEndingWith("Endpoint")
            .Should().NotHaveDependencyOn("Microsoft.EntityFrameworkCore.DbContext")
            .GetResult();

        result.IsSuccessful.ShouldBeTrue(
            string.Join(", ", result.FailingTypeNames ?? []));
    }
}
```

Aterriza con US-T04. Reglas iniciales planeadas:
- Endpoints no referencian `DbContext`.
- Nadie usa `DateTime.UtcNow` directo (todos vía `IDateTimeProvider`).
- Domain no referencia EF Core.
- Application no referencia `Microsoft.AspNetCore.*`.
- Aggregates ↔ aggregates entre módulos viaja sólo por integration events (Wolverine).

## Frontend

### Utils / Schemas

```ts
// src/lib/utils.test.ts
import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('mergea clases ignorando falsy', () => {
    expect(cn('a', null, undefined, false, 'b')).toBe('a b');
  });
});
```

```ts
// src/features/sign-in/schema.test.ts
import { describe, it, expect } from 'vitest';
import { signInSchema } from './schema';

describe('signInSchema', () => {
  it('rechaza emails sin @', () => {
    const result = signInSchema.safeParse({ email: 'foo', password: '12345678901234' });
    expect(result.success).toBe(false);
  });
});
```

### Server Actions

Mockear `apiFetch` (o `fetch` global) y verificar comportamiento del action.

```ts
// src/features/forgot-password/actions.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { forgotPasswordAction } from './actions';

vi.mock('@/lib/api-client', () => ({
  apiFetch: vi.fn(),
}));

describe('forgotPasswordAction', () => {
  beforeEach(() => vi.clearAllMocks());

  it('redirige a check-inbox cuando el backend responde 204', async () => {
    const { apiFetch } = await import('@/lib/api-client');
    (apiFetch as any).mockResolvedValue({ status: 204 });

    const formData = new FormData();
    formData.set('email', 'lucia@test.com');

    // Mockear redirect de Next y verificar que se invocó con el path correcto.
    // ... patrón a estabilizar en US-T01 ...
  });
});
```

Patrón exacto se solidifica con US-T01. Lo importante: el action es testeable sin browser, sin backend real, sólo con vitest + fetch mock.

### Components

```tsx
// src/features/sign-in/components/sign-in-form.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SignInForm } from './sign-in-form';

describe('SignInForm', () => {
  it('muestra error in-form cuando el backend devuelve credenciales inválidas', async () => {
    // mockear el action para que devuelva el FormState de error
    render(<SignInForm onSwitchToSignUp={() => {}} />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/tu email/i), 'lucia@test.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'wrong-password-12');
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/email o contraseña/i);
  });
});
```

Reglas:
- `@testing-library/user-event` para interacciones, no `fireEvent` directo.
- `screen.getByRole` / `getByLabelText` por encima de `getByTestId`. Tests deben fallar cuando el ARIA cambia.
- UI strings esperadas en español (porque la app es en español).

### E2E

Un spec por user flow. Reusan helpers de `e2e/helpers/`.

```ts
// frontend/e2e/auth/forgot-password.spec.ts
import { test, expect } from '@playwright/test';
import { extractResetTokenFromMail } from '../helpers/mailpit';
import { LUCIA } from '../helpers/personas';
import { clearForgotPasswordRateLimits } from '../helpers/redis';

test.beforeEach(async () => {
  await clearForgotPasswordRateLimits();
});

test('Lucía recovers her password from sign-in', async ({ page }) => {
  await page.goto('/auth');
  await page.getByRole('link', { name: /olvidaste tu contraseña/i }).click();
  await page.getByLabel(/tu email/i).fill(LUCIA.email);
  await page.getByRole('button', { name: /mandame el link/i }).click();
  await expect(page).toHaveURL(/\/forgot-password\/check-inbox/);

  const token = await extractResetTokenFromMail(LUCIA.email);
  await page.goto(`/reset-password?token=${token}`);
  // ...
});
```

Reglas:
- Helpers en `e2e/helpers/` — no copiar parsing de mail por test.
- Personas (`LUCIA`, `MATEO`, etc.) vienen del seed. Los tests no crean usuarios, los reutilizan.
- Locators robustos: `getByRole`, `getByLabel`. Evitar `getByText` salvo strings auténticamente únicos.
- Cada test es independiente: limpia rate limits, restaura estado al final si modificó datos.
- E2E corre on-demand en CI (label `e2e` en el PR o push a main). Localmente: `just frontend-test-e2e` (headless) o `just frontend-test-e2e-show` (browser visible + slowMo).

#### Cuándo un PR necesita E2E (zona E2E)

**Regla**: si un PR toca cualquier path de la lista de zona E2E, antes de mergear hay que correr `just frontend-test-e2e-show` localmente con suite verde y aplicar label `e2e` al PR para que CI ejercite la suite pre-merge.

**Detección automática**: `.github/workflows/auto-label.yml` aplica el label `e2e` automáticamente cuando los paths del PR matchean la lista en `.github/labeler.yml`. Si tu PR matchea, el label aparece solo. Igual hay que correr la suite local antes de mergear.

**Zona E2E** (paths que disparan el label automático):

| Path glob | Por qué |
|---|---|
| `frontend/src/app/**` | Routes, layouts, server actions, guards. Cambios acá afectan redirects / cookies / sesión / render server-side que los specs verifican. |
| `frontend/middleware.ts` | Si existe, define cross-cutting auth/redirect. |
| `frontend/src/lib/{session,forward-set-cookies,api-client,env}.ts` | Cross-cutting auth + session + api wiring. Tocar cualquiera puede romper todos los specs de auth. |
| `frontend/e2e/**` | Suite directa o helpers compartidos. |
| `frontend/playwright.config.ts` | Config de la suite. |
| `backend/host/Planb.Api/**` | Host (DI, pipeline auth, seed data, Program.cs). Cualquier cambio afecta startup. |
| `backend/modules/*/src/**/Migrations/**` | Migrations de cualquier módulo. Pueden romper la inicialización del backend. |
| `backend/modules/identity/**` | Auth y session viven en Identity, todos los specs E2E actuales lo tocan transitivamente. |
| `.github/workflows/{e2e,ci}.yml` | Workflow que ejercita la suite o CI estándar. |

**Quedan fuera explícitamente**: cambios docs-only (`docs/**`, `*.md`), `.github/dependabot.yml`, `Justfile` (a menos que cambie comandos de CI), ADRs, lessons-learned, componentes aislados con cobertura vitest, otros módulos backend (academic, reviews, enrollments, moderation) que aún no tienen specs E2E. Si en el futuro un nuevo módulo gana cobertura E2E, agregar su path al `labeler.yml`.

**Si el label se aplica pero no aplica realmente** (false positive): removerlo manualmente del PR. CI no va a forzar la corrida, solo dispara cuando el label está. Documentar el caso si pasa seguido (puede indicar que el path glob es muy laxo).

#### Dominio vs infra: cuándo un helper directo está OK

Una pregunta recurrente: ¿está bien que `e2e/helpers/mailpit.ts` lea Mailpit HTTP directo en vez de pasar por un endpoint del backend? ¿Y `e2e/helpers/redis.ts` que borra keys de rate limit? La regla es:

> **Helpers de infra directos están OK si lo que tocan es infra. NO están OK si tocan dominio.**

| Helper | Qué toca | ¿OK? | Por qué |
|---|---|---|---|
| `mailpit.ts` | "Inbox del user" — equivalente local de SES/SendGrid | Sí | Mailpit ES tu SMTP server en dev. El backend envía mail SMTP real, Mailpit lo intercepta, el test extrae el token con regex. El template HTML sí se renderiza, el link sí se valida. El único atajo es que el "click humano" lo hace un regex — inevitable en CI. |
| `redis.ts` | Rate limit state (clave de implementación) | Sí | Atajo semántico (en prod no reseteás rate limits, esperás el TTL). Pero esperar 15 min entre tests es inviable. El test ejerce fielmente el rate limit, solo manipula el estado de inicio. |
| Hipotético helper que hace `DELETE FROM identity.users WHERE email = ...` | Modelo del dominio | **No** | Eso requiere endpoint real (`DELETE /api/me/account`). Si el verb no existe en la API, **es señal de US faltante** (compliance + UX), no de "necesitamos un helper". |

**Corolario**: cuando un E2E necesita "limpiar" data del dominio, la primera pregunta no es "qué helper escribo" sino "qué verb me falta exponer en la API". Casi siempre es un verb que el producto debería tener anyway por compliance (Ley 25.326 art. 6 — derecho de supresión) o UX. El helper directo a la DB de dominio es atajo arquitectónico que esconde una US faltante.

**Lo que sí es legítimo como helper de infra**: Mailpit (mail server local), Redis (cache/rate-limit state), Wolverine outbox query (state interno del messaging), file system (uploads tmp). Lo que NO: tablas del dominio (`users`, `reviews`, `student_profiles`, etc.).

**Atajos que aceptamos deliberadamente**: ningún E2E es 100% fiel al user real. Siempre hay alguno (el "click humano" del mail, el "esperar TTL" del rate limit, el tiempo físico). La regla práctica: que los atajos sean en la **interacción con sistemas externos** (mail provider, clock), no en el **comportamiento del producto**.

## Changelog automation

Cubierto por [ADR-0037](../decisions/0037-changelog-automation-auto-append.md). Resumen:

- **No editás `CHANGELOG.md` a mano**. Un workflow GHA (`changelog.yml`) corre en cada push a `main`, lee el último commit, lo parsea como Conventional Commit, y appendea un bullet a la sección `[Unreleased]`.
- Para que tu cambio aparezca en el changelog, tu commit message debe ser un Conventional Commit válido. Lefthook commit-msg ya enforcea eso localmente.
- Tipos que **aparecen** en el changelog (mapeo a Keep-a-Changelog):
  - `feat`, `perf` → "Added"
  - `fix` → "Fixed"
  - `refactor` → "Changed"
  - `revert` → "Removed"
- Tipos que **no aparecen**: `docs`, `style`, `test`, `build`, `ci`, `chore`. El script los detecta y skipea silenciosamente.
- **BREAKING CHANGE**: si el subject tiene `!:` o el body contiene `BREAKING CHANGE:`, el bullet aparece marcado `**(BREAKING)**`. No bumpea versión (versioning está deferred, ver más abajo).

### PR titles para Squash and merge

Cuando un PR se mergea con Squash, el título del PR se vuelve el commit en main. Ese título debe ser Conventional Commit válido (`feat(scope): descripción`) para que el workflow lo lea bien.

[ADR-0026](../decisions/0026-git-workflow-github-flow-con-rebase.md) define Rebase and merge como default; usar Squash sólo si los commits del PR tienen WIP/fixup que no aporta historia. La red de seguridad para Squash es el workflow `pr-title.yml` (`amannn/action-semantic-pull-request`) que valida el title del PR como Conventional Commit antes de permitir merge.

### Versioning

Política completa en [ADR-0038](../decisions/0038-release-and-versioning-policy.md). Resumen:

- Pre-deploy (estamos acá): no hay versiones, no hay releases, no hay tags-as-releases. CHANGELOG mantiene una `[Unreleased]` única.
- Tags narrativos manuales para hitos (presentaciones, demos, pre-refactor) **están permitidos**. No son releases. Sin formato fijo, sin prefijo `v`. Ejemplo: `presentacion-fase-2-2026-05-15`.
- Trigger para abrir la ADR de versioning real: primer deploy a entorno con URL accesible. Esquema recomendado para esa ADR futura: **semver** (`MAJOR.MINOR.PATCH`).

## Cuando no sabés qué hacer

1. Mirá el [PR template](../../.github/pull_request_template.md) — el checklist te dice qué capa estás tocando y qué test esperar.
2. Si el patrón no está cubierto en este doc, abrí un issue / Slack / lo que sea — la convención se actualiza acá.
3. Si la respuesta involucra "agregar una capa de tests nueva" → ADR.

## Refs

- [ADR-0024](../decisions/0024-dev-tooling-stack.md): tooling stack base.
- [ADR-0026](../decisions/0026-git-workflow-github-flow-con-rebase.md): git workflow + Conventional Commits.
- [ADR-0027](../decisions/0027-integration-tests-shared-postgres.md): integration tests pattern.
- [ADR-0036](../decisions/0036-testing-pyramid-cross-stack.md): pirámide de testing cross-stack.
- [ADR-0037](../decisions/0037-changelog-automation-auto-append.md): changelog auto-append.
- [ADR-0038](../decisions/0038-release-and-versioning-policy.md): release & versioning policy (pre-deploy = no versiones; tags narrativos permitidos).
