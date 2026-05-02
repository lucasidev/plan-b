using System.Reflection;
using NetArchTest.Rules;
using Shouldly;
using Xunit;

namespace Planb.ArchitectureTests;

/// <summary>
/// Architecture tests que enforcean los boundaries del modular monolith
/// (ADR-0014, ADR-0017). Estos tests reemplazan reglas que antes vivían
/// sólo en CLAUDE.md y dependían de memoria humana / code review.
///
/// Si una regla es difícil de testear con NetArchTest (e.g. inspección de
/// method bodies para `DateTime.UtcNow` directo), queda como nota en
/// docs/testing/conventions.md y se chequea en review hasta que tengamos
/// un Roslyn analyzer custom.
///
/// Excepciones legítimas: si una regla tiene un caso válido que la rompe
/// (raro), documentar en este archivo con [Trait("Exception", "...")] o
/// agregar un attribute custom + whitelist en el test correspondiente.
/// </summary>
public class ModuleBoundariesTests
{
    // Los assemblies del backend que referenciamos via ProjectReference quedan
    // cargables al runtime via Assembly.Load por nombre. El test project tiene
    // que tener una ProjectReference a cada uno (ver Planb.ArchitectureTests.csproj).
    private static Assembly IdentityDomain =>
        typeof(Planb.Identity.Domain.Users.User).Assembly;

    private static Assembly IdentityApplication =>
        Assembly.Load("Planb.Identity.Application");

    private static Assembly IdentityInfrastructure =>
        Assembly.Load("Planb.Identity.Infrastructure");

    // ─────────────────────────────────────────────────────────────────
    // Domain layer: pure, no infrastructure
    // ─────────────────────────────────────────────────────────────────

    [Fact]
    public void Identity_Domain_does_not_reference_EntityFrameworkCore()
    {
        var result = Types.InAssembly(IdentityDomain)
            .Should()
            .NotHaveDependencyOn("Microsoft.EntityFrameworkCore")
            .GetResult();

        result.IsSuccessful.ShouldBeTrue(
            FailureMessage(result, "Domain debería ser persistence-ignorant (ADR-0017)"));
    }

    [Fact]
    public void Identity_Domain_does_not_reference_AspNetCore()
    {
        var result = Types.InAssembly(IdentityDomain)
            .Should()
            .NotHaveDependencyOn("Microsoft.AspNetCore")
            .GetResult();

        result.IsSuccessful.ShouldBeTrue(
            FailureMessage(result, "Domain no sabe nada de HTTP (ADR-0014)"));
    }

    [Fact]
    public void Identity_Domain_does_not_reference_Wolverine()
    {
        // Wolverine es el messaging stack (capa Application/Host). Domain levanta
        // domain events vía la abstracción `Raise(IDomainEvent)` de SharedKernel;
        // el dispatching a Wolverine pasa por la capa Application. Domain no
        // debería conocer Wolverine.
        var result = Types.InAssembly(IdentityDomain)
            .Should()
            .NotHaveDependencyOn("Wolverine")
            .GetResult();

        result.IsSuccessful.ShouldBeTrue(
            FailureMessage(result, "Domain no debería referenciar Wolverine"));
    }

    // ─────────────────────────────────────────────────────────────────
    // Application layer: handlers + endpoints, sin EF
    // ─────────────────────────────────────────────────────────────────

    [Fact]
    public void Identity_handlers_do_not_reference_EntityFrameworkCore()
    {
        // Los Wolverine handlers (Static classes con `*CommandHandler` o
        // `*QueryHandler` por convención) viven en Application y deben usar
        // las abstracciones de persistence (`IUserRepository`, `IIdentityUnitOfWork`),
        // nunca el DbContext concreto.
        var result = Types.InAssembly(IdentityApplication)
            .That()
            .HaveNameEndingWith("CommandHandler")
            .Or()
            .HaveNameEndingWith("QueryHandler")
            .Should()
            .NotHaveDependencyOn("Microsoft.EntityFrameworkCore")
            .GetResult();

        result.IsSuccessful.ShouldBeTrue(
            FailureMessage(result,
                "Handlers deberían usar IRepository / IUnitOfWork, no DbContext directo"));
    }

    [Fact]
    public void Identity_endpoints_do_not_reference_EntityFrameworkCore()
    {
        // Los endpoints Carter son thin: parsean HTTP, despachan al handler vía
        // IMessageBus, devuelven la response. No deberían tener noción de EF.
        var result = Types.InAssembly(IdentityApplication)
            .That()
            .HaveNameEndingWith("Endpoint")
            .Should()
            .NotHaveDependencyOn("Microsoft.EntityFrameworkCore")
            .GetResult();

        result.IsSuccessful.ShouldBeTrue(
            FailureMessage(result, "Endpoints son thin: HTTP in/out, sin EF (ADR-0016)"));
    }

    // ─────────────────────────────────────────────────────────────────
    // Cross-module isolation
    // ─────────────────────────────────────────────────────────────────

    [Fact]
    public void Identity_assemblies_do_not_reference_other_module_internals()
    {
        // Cross-module reads van por Contracts/ (interfaces sync). Cross-module writes van por
        // IntegrationEvents/ (Wolverine outbox). Identity NO debe acoplarse al Domain ni al
        // Infrastructure de otros bounded contexts. Sí puede consumir el namespace público
        // (Application/Contracts y Application/IntegrationEvents).
        //
        // El Identity Domain no debe depender de NINGUNA capa de otros módulos, ni siquiera
        // Contracts: el dominio es puro.
        var otherModules = new[] { "Academic", "Reviews", "Moderation", "Enrollments" };

        foreach (var module in otherModules)
        {
            // Domain: prohibido todo cross-module (incluso Contracts).
            var domainResult = Types.InAssembly(IdentityDomain)
                .Should()
                .NotHaveDependencyOn($"Planb.{module}")
                .GetResult();

            domainResult.IsSuccessful.ShouldBeTrue(
                FailureMessage(domainResult,
                    $"Identity Domain no debería depender de Planb.{module}.* (el dominio es puro)"));

            // Application: prohibido Domain + Infrastructure de otros módulos. Contracts y
            // IntegrationEvents son superficie pública y SI están permitidos.
            var forbiddenAppPrefixes = new[]
            {
                $"Planb.{module}.Domain",
                $"Planb.{module}.Infrastructure",
            };

            foreach (var prefix in forbiddenAppPrefixes)
            {
                var appResult = Types.InAssembly(IdentityApplication)
                    .Should()
                    .NotHaveDependencyOn(prefix)
                    .GetResult();

                appResult.IsSuccessful.ShouldBeTrue(
                    FailureMessage(appResult,
                        $"Identity Application no debería depender de {prefix}.* — usá " +
                        $"Planb.{module}.Application.Contracts (reads sync) o " +
                        $"Planb.{module}.Application.IntegrationEvents (writes async)"));
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────
    // Domain primitives convention
    // ─────────────────────────────────────────────────────────────────

    [Fact]
    public void Identity_Domain_aggregates_and_VOs_are_sealed()
    {
        // Convención del modular monolith: aggregates y value objects son
        // sealed. Permitir herencia abre la puerta a partial-correctness
        // (subclases que rompen invariantes). Si genuinely necesitamos
        // herencia, abstract base + sealed concretes.
        //
        // Filtro: types públicos en namespaces que terminan en .Users,
        // excluyendo abstractas + records que ya son sealed implícitos en
        // ciertas configuraciones. Los records tipo `public record` son
        // por definición sealed-by-default en C#11+ but treating them as
        // an exception is fine.
        var result = Types.InAssembly(IdentityDomain)
            .That()
            .ResideInNamespace("Planb.Identity.Domain.Users")
            .And()
            .ArePublic()
            .And()
            .AreClasses()
            .And()
            .AreNotAbstract()
            .Should()
            .BeSealed()
            .GetResult();

        // Si esta regla resulta restrictiva (genuinamente necesitamos un
        // class no-sealed en Domain), considerar:
        //   1) ¿La herencia es real, o es leak de implementation detail?
        //   2) Si es real, cambiar a sealed con interfaces / abstract base.
        //   3) Si después de pensarlo sigue siendo necesario, agregar
        //      un attribute custom [DomainInheritanceException("razón")]
        //      y filtrarlo acá.
        result.IsSuccessful.ShouldBeTrue(
            FailureMessage(result,
                "Domain classes deberían ser sealed (sin herencia accidental)"));
    }

    // ─────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────

    private static string FailureMessage(TestResult result, string explanation)
    {
        var failing = result.FailingTypeNames is null or { Count: 0 }
            ? "(no failing types reported)"
            : string.Join(", ", result.FailingTypeNames);
        return $"{explanation}. Tipos infractores: {failing}";
    }
}
