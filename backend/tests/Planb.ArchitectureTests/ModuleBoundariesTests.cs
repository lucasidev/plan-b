using System.Reflection;
using NetArchTest.Rules;
using Shouldly;
using Xunit;

namespace Planb.ArchitectureTests;

/// <summary>
/// Architecture tests que enforcean los boundaries del modular monolith (ADR-0014, ADR-0017) en
/// LOS 5 bounded contexts. US-T07-b generaliza las reglas que US-T04-b había hardcodeado a Identity:
/// cada regla es ahora un <see cref="TheoryAttribute"/> sobre los 5 módulos. Reemplazan reglas que
/// antes vivían solo en CLAUDE.md y dependían de review humano.
///
/// El módulo se pasa por nombre (string, serializable para xUnit) y las assemblies se resuelven con
/// <see cref="Assembly.Load(string)"/>; el test project referencia Domain + Application de cada
/// módulo (ver csproj) para que estén en el output y carguen.
///
/// Si una regla es difícil de testear con NetArchTest (e.g. inspección de method bodies para
/// <c>DateTime.UtcNow</c> directo), queda como nota en docs/testing/conventions.md y se chequea en
/// review hasta que tengamos un Roslyn analyzer custom.
/// </summary>
public class ModuleBoundariesTests
{
    private static readonly string[] AllModules =
        ["Identity", "Academic", "Enrollments", "Reviews", "Moderation"];

    /// <summary>Los 5 bounded contexts. Cada uno tiene <c>Planb.{Name}.Domain</c> y <c>.Application</c>.</summary>
    public static TheoryData<string> Modules => [.. AllModules];

    private static Assembly DomainOf(string module) => Assembly.Load($"Planb.{module}.Domain");

    private static Assembly ApplicationOf(string module) => Assembly.Load($"Planb.{module}.Application");

    // ─────────────────────────────────────────────────────────────────
    // Domain layer: puro, sin infraestructura
    // ─────────────────────────────────────────────────────────────────

    [Theory]
    [MemberData(nameof(Modules))]
    public void Domain_does_not_reference_EntityFrameworkCore(string module)
    {
        var result = Types.InAssembly(DomainOf(module))
            .Should()
            .NotHaveDependencyOn("Microsoft.EntityFrameworkCore")
            .GetResult();

        result.IsSuccessful.ShouldBeTrue(
            FailureMessage(module, result, "Domain debería ser persistence-ignorant (ADR-0017)"));
    }

    [Theory]
    [MemberData(nameof(Modules))]
    public void Domain_does_not_reference_AspNetCore(string module)
    {
        var result = Types.InAssembly(DomainOf(module))
            .Should()
            .NotHaveDependencyOn("Microsoft.AspNetCore")
            .GetResult();

        result.IsSuccessful.ShouldBeTrue(
            FailureMessage(module, result, "Domain no sabe nada de HTTP (ADR-0014)"));
    }

    [Theory]
    [MemberData(nameof(Modules))]
    public void Domain_does_not_reference_Wolverine(string module)
    {
        // Wolverine es el messaging stack (Application/Host). Domain levanta domain events vía la
        // abstracción Raise(IDomainEvent) de SharedKernel; el dispatching pasa por Application.
        var result = Types.InAssembly(DomainOf(module))
            .Should()
            .NotHaveDependencyOn("Wolverine")
            .GetResult();

        result.IsSuccessful.ShouldBeTrue(
            FailureMessage(module, result, "Domain no debería referenciar Wolverine"));
    }

    // ─────────────────────────────────────────────────────────────────
    // Application layer: handlers + endpoints, sin EF directo
    // ─────────────────────────────────────────────────────────────────

    [Theory]
    [MemberData(nameof(Modules))]
    public void Handlers_do_not_reference_EntityFrameworkCore(string module)
    {
        // Los Wolverine handlers (`*CommandHandler` / `*QueryHandler` por convención) deben usar
        // las abstracciones de persistence (IRepository, IUnitOfWork), nunca el DbContext concreto.
        var result = Types.InAssembly(ApplicationOf(module))
            .That()
            .HaveNameEndingWith("CommandHandler")
            .Or()
            .HaveNameEndingWith("QueryHandler")
            .Should()
            .NotHaveDependencyOn("Microsoft.EntityFrameworkCore")
            .GetResult();

        result.IsSuccessful.ShouldBeTrue(
            FailureMessage(module, result,
                "Handlers deberían usar IRepository / IUnitOfWork, no DbContext directo"));
    }

    [Theory]
    [MemberData(nameof(Modules))]
    public void Endpoints_do_not_reference_EntityFrameworkCore(string module)
    {
        // Los endpoints Carter son thin: parsean HTTP, despachan al handler vía IMessageBus (o
        // llaman un read service), devuelven la response. No deberían tener noción de EF.
        var result = Types.InAssembly(ApplicationOf(module))
            .That()
            .HaveNameEndingWith("Endpoint")
            .Should()
            .NotHaveDependencyOn("Microsoft.EntityFrameworkCore")
            .GetResult();

        result.IsSuccessful.ShouldBeTrue(
            FailureMessage(module, result, "Endpoints son thin: HTTP in/out, sin EF (ADR-0016)"));
    }

    // ─────────────────────────────────────────────────────────────────
    // Aislamiento cross-module
    // ─────────────────────────────────────────────────────────────────

    [Theory]
    [MemberData(nameof(Modules))]
    public void Domain_does_not_depend_on_other_modules(string module)
    {
        // El Domain es puro: no depende de NINGUNA capa de otros módulos, ni siquiera Contracts.
        foreach (var other in AllModules.Where(m => m != module))
        {
            var result = Types.InAssembly(DomainOf(module))
                .Should()
                .NotHaveDependencyOn($"Planb.{other}")
                .GetResult();

            result.IsSuccessful.ShouldBeTrue(
                FailureMessage(module, result,
                    $"el Domain es puro, no debería depender de Planb.{other}.*"));
        }
    }

    [Theory]
    [MemberData(nameof(Modules))]
    public void Application_does_not_depend_on_other_modules_internals(string module)
    {
        // Cross-module reads van por Contracts/ (interfaces sync); writes por IntegrationEvents/
        // (Wolverine outbox). El Domain y el Infrastructure de otros módulos están prohibidos.
        foreach (var other in AllModules.Where(m => m != module))
        {
            foreach (var prefix in new[] { $"Planb.{other}.Domain", $"Planb.{other}.Infrastructure" })
            {
                var result = Types.InAssembly(ApplicationOf(module))
                    .Should()
                    .NotHaveDependencyOn(prefix)
                    .GetResult();

                result.IsSuccessful.ShouldBeTrue(
                    FailureMessage(module, result,
                        $"Application no debería depender de {prefix}.*; usá " +
                        $"Planb.{other}.Application.Contracts (reads sync) o " +
                        $"Planb.{other}.Application.IntegrationEvents (writes async)"));
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────
    // Convención de primitivas del dominio
    // ─────────────────────────────────────────────────────────────────

    [Theory]
    [MemberData(nameof(Modules))]
    public void Domain_classes_are_sealed(string module)
    {
        // Aggregates y value objects son sealed: permitir herencia abre la puerta a
        // partial-correctness (subclases que rompen invariantes). Si genuinely hace falta herencia:
        // abstract base + sealed concretes. Filtro: clases públicas no-abstractas del Domain. Las
        // static (abstract+sealed en IL, e.g. los *Errors) quedan afuera por AreNotAbstract().
        var result = Types.InAssembly(DomainOf(module))
            .That()
            .ResideInNamespaceStartingWith($"Planb.{module}.Domain")
            .And()
            .ArePublic()
            .And()
            .AreClasses()
            .And()
            .AreNotAbstract()
            .Should()
            .BeSealed()
            .GetResult();

        result.IsSuccessful.ShouldBeTrue(
            FailureMessage(module, result,
                "las clases de Domain deberían ser sealed (sin herencia accidental)"));
    }

    // ─────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────

    private static string FailureMessage(string module, TestResult result, string explanation)
    {
        var failing = result.FailingTypeNames is null or { Count: 0 }
            ? "(no failing types reported)"
            : string.Join(", ", result.FailingTypeNames);
        return $"[{module}] {explanation}. Tipos infractores: {failing}";
    }
}
