# Testing (convenciones de planb)

Living document. Cómo escribir, dónde poner y cómo correr tests.

Decisión que lo motiva: [ADR-0036: Pirámide de testing cross-stack](../decisions/0036-testing-pyramid-cross-stack.md).

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
just frontend-test-e2e            # Playwright headless, levanta su propio stack (dev stack ABAJO)
just frontend-test-e2e-show       # Playwright con browser visible y slowMo (ver el flow correr)
```

Ambos recipes aceptan args, ej: `just frontend-test-e2e-show e2e/auth/sign-up.spec.ts`.

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
- Si el test pide demasiado setup (más de 5-6 substitutes), probablemente el handler tenga demasiadas deps: refactor antes de testear.

### Integration

Endpoints HTTP + Postgres/Redis/Mailpit reales, vía `WebApplicationFactory`. Patrón existente, ver [ADR-0027](../decisions/0027-integration-tests-shared-postgres.md).

**Cada clase tiene su base, copiada de una plantilla.** La primera clase de la corrida arma `planb_template_<hash>` levantando el host contra una base vacía (migra los tres contextos, siembra personas, catálogo y cuestionario, y Wolverine crea su schema); las demás obtienen la suya con `CREATE DATABASE ... TEMPLATE`, que es una copia de archivos. El hash sale de los ensamblados del host y de las tres infraestructuras, así que dos corridas sobre el mismo build comparten la plantilla y la segunda ni la arma; un rebuild que cambie migraciones o seeders arma una nueva. Con una base por clase, las colecciones de xUnit corren en paralelo (`parallelizeTestCollections: true`, cuatro hilos: el límite lo pone Postgres). Medido el 2026-09-02: la suite entera pasó de unos 25 minutos por áreas a 410 segundos en una sola corrida, 325 de 325; una clase de 3 tests bajó de 18 a 15 segundos, y esos 15 son casi todos el arranque del host (Wolverine genera código en Development), que es el siguiente escalón.

**Cuando una corrida se corta, deja su base.** La de cada clase (`planb_register_<guid>`) se dropea en el `DisposeAsync` de la fixture, que no corre si el proceso muere antes: un timeout, un Ctrl+C, Postgres caído a mitad. Las plantillas viejas quedan a propósito hasta que alguien las barra. `just db-prune` dropea todo lo que matchea `planb\_%`, plantillas incluidas (la vigente se rearma sola en la corrida siguiente), salteando las que tienen conexiones abiertas (esas son de una corrida en curso, posiblemente en otra terminal). Un cambio de datos de seed sin cambio de código, por ejemplo en `personas.json`, no cambia el hash: los seeders agregan lo nuevo al arrancar cada clase, pero no corrigen lo que ya estaba; ahí `just db-prune` es lo que fuerza una plantilla fresca.

**El schema tiene sus dos gates.** `just check-migrations` falla si el modelo de EF Core tiene cambios que nadie migró: cambiar un `ToTable` o una columna compila y formatea igual, y sin este chequeo el desfasaje solo aparece si algún test toca esa tabla. Y `MigrationRollbackTests` revierte y reaplica la migración más nueva de cada módulo, que es lo único que prueba que su `Down()` sirve antes del día que haga falta.

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

Aterrizó con US-T04-b (Identity); **US-T07-b generalizó las reglas a los 5 módulos** (8 reglas × 5 = 40 tests, parametrizadas con `[Theory]` en `ModuleBoundariesTests.cs`). Reglas enforced hoy:
- Domain no referencia EF Core, AspNetCore ni Wolverine.
- Handlers (`*CommandHandler` / `*QueryHandler`) y endpoints (`*Endpoint`) no referencian EF Core directo.
- Domain no depende de NINGÚN otro módulo (ni de Contracts); Application no depende del Domain ni Infrastructure de otros (solo `Contracts` reads / `IntegrationEvents` writes).
- Aggregates y VOs del Domain son sealed.

No expresables en NetArchTest (requieren body inspection), quedan en review: `DateTime.UtcNow` directo (usar `IDateTimeProvider`), `throw` para fallas de negocio (usar `Result<T>`).

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
- Helpers en `e2e/helpers/`: no copiar parsing de mail por test.
- Personas (`LUCIA`, `PAULA`, etc.) vienen del seed. Los tests no crean usuarios, los reutilizan.
- Locators robustos: `getByRole`, `getByLabel`. Evitar `getByText` salvo strings auténticamente únicos.
- Cada test es independiente: limpia rate limits (Mailpit y Redis se comparten dentro de una corrida). La base **no** hace falta restaurarla: cada corrida arranca de una base nueva.
- **E2E corre siempre en CI** en cada PR como gate antes de merge (job `e2e` en `.github/workflows/ci.yml`). Localmente: `just frontend-test-e2e` (headless) o `just frontend-test-e2e-show` (browser visible + slowMo).

**Base efímera por corrida.** Los dos recipes locales levantan su propio backend + frontend contra una base `planb_e2e` que se dropea y recrea al arrancar (`scripts/run-e2e.ts`), o sea que el stack de dev tiene que estar **abajo**: si `just dev` está corriendo, el script corta con el puerto ocupado. Es el mismo aislamiento que CI ya tenía por usar un service container nuevo en cada corrida, y el mismo patrón que [ADR-0027](../decisions/0027-integration-tests-shared-postgres.md) usa una capa más abajo.

Antes la suite local corría contra la base de dev y cada corrida dejaba usuarios, reseñas y borradores acumulados. El costo no era el desorden: **los specs no podían afirmar datos concretos** porque el estado era compartido y mutable entre corridas, así que afirmaban comportamiento y nada más. Con base propia, un spec puede volver a asumir un punto de partida conocido.

La base sobrevive a la corrida a propósito (el drop es al arrancar, no al terminar): si un spec falla, entrás con `psql -d planb_e2e` a ver en qué estado quedó. Contrapartida a tener presente: los bugs que se acumulan con el tiempo (filas huérfanas, cuentas dadas de baja que dejan rastro) ya no van a aparecer solos como aparecían en la base de dev de larga vida; esos hay que cubrirlos con un test explícito.

#### Política E2E: una sola regla

**E2E corre siempre en CI, en cada PR.** Sin labels, sin detectores custom, sin whitelists. Es el patrón estándar de la industria 2025: shift-left + gate consistente antes de merge. Para PRs 100% docs/config (sin código), aceptamos los ~7 min como costo de simplicidad.

**Pre-push hook NO corre E2E.** El hook se queda con gates rápidos (lint, typecheck, build, unit). Si el dev tocó código real y quiere validar antes de pushear, corre `just frontend-test-e2e-show` manualmente. La elección queda en el dev, no en el hook.

**Cómo llegamos acá** (2026-05-24): probamos un régimen de zona E2E con detector custom (`check-e2e-zone.ts`), whitelist de paths, auto-labeler, escape hatches, detección de mocks. Funcionaba parcialmente pero acumulaba deuda combinatoria sin resolver el problema real (devs entregando "listo" sin verificar). Filosofía Musk: el peor error es optimizar algo que no debería existir. Reset al estándar industria.

**Regla cultural** (vive en la disciplina del dev, no en tooling): cuando termines un slice que toque rutas reales (no mocks/ComingSoon), corré `just frontend-test-e2e-show <spec>` local con browser visible y verificá verde antes de declarar la US "lista" o pedir revisión. Esto vale especialmente para el asistente IA: el OK para commit/push viene después de mostrar el output del spec corrido, no antes.

#### Dominio vs infra: cuándo un helper directo está OK

Una pregunta recurrente: ¿está bien que `e2e/helpers/mailpit.ts` lea Mailpit HTTP directo en vez de pasar por un endpoint del backend? ¿Y `e2e/helpers/redis.ts` que borra keys de rate limit? La regla es:

> **Helpers de infra directos están OK si lo que tocan es infra. NO están OK si tocan dominio.**

| Helper | Qué toca | ¿OK? | Por qué |
|---|---|---|---|
| `mailpit.ts` | "Inbox del user": equivalente local de SES/SendGrid | Sí | Mailpit ES tu SMTP server en dev. El backend envía mail SMTP real, Mailpit lo intercepta, el test extrae el token con regex. El template HTML sí se renderiza, el link sí se valida. El único atajo es que el "click humano" lo hace un regex: inevitable en CI. |
| `redis.ts` | Rate limit state (clave de implementación) | Sí | Atajo semántico (en prod no reseteás rate limits, esperás el TTL). Pero esperar 15 min entre tests es inviable. El test ejerce fielmente el rate limit, solo manipula el estado de inicio. |
| Hipotético helper que hace `DELETE FROM identity.users WHERE email = ...` | Modelo del dominio | **No** | Eso requiere endpoint real (`DELETE /api/me/account`). Si el verb no existe en la API, **es señal de US faltante** (compliance + UX), no de "necesitamos un helper". |

**Corolario**: cuando un E2E necesita "limpiar" data del dominio, la primera pregunta no es "qué helper escribo" sino "qué verb me falta exponer en la API". Casi siempre es un verb que el producto debería tener anyway por compliance (Ley 25.326 art. 6: derecho de supresión) o UX. El helper directo a la DB de dominio es atajo arquitectónico que esconde una US faltante.

**Lo que sí es legítimo como helper de infra**: Mailpit (mail server local), Redis (cache/rate-limit state), Wolverine outbox query (state interno del messaging), file system (uploads tmp). Lo que NO: tablas del dominio (`users`, `reviews`, `student_profiles`, etc.).

**Atajos que aceptamos deliberadamente**: ningún E2E es 100% fiel al user real. Siempre hay alguno (el "click humano" del mail, el "esperar TTL" del rate limit, el tiempo físico). La regla práctica: que los atajos sean en la **interacción con sistemas externos** (mail provider, clock), no en el **comportamiento del producto**.

## Changelog

No hay nada que testear: la automatización se retiró ([ADR-0074](../decisions/0074-the-changelog-is-generated-on-demand-not-appended-on-every-push.md)). `CHANGELOG.md` está congelado y se genera de una pasada desde los commits el día que haya quien lo lea. Lo que sí sigue enforceado localmente es el formato del commit (lefthook `commit-msg`), que es lo que hace posible generarlo después.

## Cuando no sabés qué hacer

1. Mirá el [PR template](../../.github/pull_request_template.md): el checklist te dice qué capa estás tocando y qué test esperar.
2. Si el patrón no está cubierto en este doc, abrí un issue / Slack / lo que sea: la convención se actualiza acá.
3. Si la respuesta involucra "agregar una capa de tests nueva" → ADR.

## Refs

- [ADR-0024](../decisions/0024-dev-tooling-stack.md): tooling stack base.
- [ADR-0026](../decisions/0026-git-workflow-github-flow-with-rebase.md): git workflow + Conventional Commits.
- [ADR-0027](../decisions/0027-integration-tests-shared-postgres.md): integration tests pattern.
- [ADR-0036](../decisions/0036-testing-pyramid-cross-stack.md): pirámide de testing cross-stack.
- [ADR-0074](../decisions/0074-the-changelog-is-generated-on-demand-not-appended-on-every-push.md): changelog auto-append.
- [ADR-0038](../decisions/0038-release-and-versioning-policy.md): release & versioning policy (pre-deploy = no versiones; tags narrativos permitidos).
