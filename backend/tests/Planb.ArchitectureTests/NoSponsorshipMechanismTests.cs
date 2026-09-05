using System.Reflection;
using Shouldly;
using Xunit;

namespace Planb.ArchitectureTests;

/// <summary>
/// La garantía de que no existe el mecanismo, no que hoy nadie lo use. Un tipo o una propiedad
/// que se llamara Sponsor, Sponsored, Featured, Promoted o Highlighted sería el primer paso hacia
/// destacar o patrocinar una institución, así que ninguno de los cinco puede aparecer en ningún
/// assembly del backend.
///
/// <para>
/// NetArchTest (que usa <see cref="ModuleBoundariesTests"/>) resuelve dependencias y nombres de
/// TIPO, no nombres de propiedad: no hay forma de pedirle "ninguna propiedad se llama X" con su
/// fluent API. Por eso esto reflexiona directo sobre los assemblies ya cargados por el test
/// project (mismas <see cref="Assembly.Load(string)"/> por nombre que <see cref="ModuleBoundariesTests"/>,
/// sumando Infrastructure y el Host para cubrir "del backend" entero, no sólo Domain/Application).
/// </para>
/// </summary>
public class NoSponsorshipMechanismTests
{
    private static readonly string[] ForbiddenWords =
        ["Sponsor", "Sponsored", "Featured", "Promoted", "Highlighted"];

    // Domain + Application ya los carga ModuleBoundariesTests por nombre; sumamos Infrastructure
    // (donde viven los DTOs de config, tipo SmtpOptions) y el Host (Program.cs, appsettings
    // binding) para que "del backend" cubra todo lo que el test project referencia.
    private static readonly string[] AssemblyNames =
    [
        "Planb.SharedKernel",
        "Planb.Api",
        "Planb.Identity.Domain", "Planb.Identity.Application", "Planb.Identity.Infrastructure",
        "Planb.Academic.Domain", "Planb.Academic.Application", "Planb.Academic.Infrastructure",
        "Planb.Reviews.Domain", "Planb.Reviews.Application", "Planb.Reviews.Infrastructure",
    ];

    public static TheoryData<string> ForbiddenWordsData => [.. ForbiddenWords];

    private static IEnumerable<Type> AllTypes()
    {
        foreach (var assemblyName in AssemblyNames)
        {
            var assembly = Assembly.Load(assemblyName);
            Type?[] types;
            try
            {
                types = assembly.GetTypes();
            }
            catch (ReflectionTypeLoadException ex)
            {
                types = ex.Types;
            }

            foreach (var type in types)
            {
                if (type is not null) yield return type;
            }
        }
    }

    /// <summary>US-171 N2: ningún tipo del backend se llama como un mecanismo de patrocinio.</summary>
    [Theory]
    [MemberData(nameof(ForbiddenWordsData))]
    public void No_type_is_named_after_a_sponsorship_mechanism(string word)
    {
        var offenders = AllTypes()
            .Where(t => t.Name.Contains(word, StringComparison.OrdinalIgnoreCase))
            .Select(t => t.FullName)
            .ToList();

        offenders.ShouldBeEmpty($"ningún tipo del backend debería llamarse como \"{word}\"");
    }

    /// <summary>US-171 N2: ninguna propiedad del backend se llama como un mecanismo de patrocinio.</summary>
    [Theory]
    [MemberData(nameof(ForbiddenWordsData))]
    public void No_property_is_named_after_a_sponsorship_mechanism(string word)
    {
        const BindingFlags allDeclared = BindingFlags.Public | BindingFlags.NonPublic |
            BindingFlags.Instance | BindingFlags.Static | BindingFlags.DeclaredOnly;

        var offenders = AllTypes()
            .SelectMany(t => t.GetProperties(allDeclared)
                .Where(p => p.Name.Contains(word, StringComparison.OrdinalIgnoreCase))
                .Select(p => $"{t.FullName}.{p.Name}"))
            .ToList();

        offenders.ShouldBeEmpty(
            $"ninguna propiedad del backend debería llamarse como \"{word}\": " +
            string.Join(", ", offenders));
    }
}
