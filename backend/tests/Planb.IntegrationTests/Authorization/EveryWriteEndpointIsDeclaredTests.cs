using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authorization.Infrastructure;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;
using Planb.IntegrationTests.Infrastructure;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Authorization;

/// <summary>
/// Compara el catálogo declarado (<see cref="WriteEndpoints"/>) contra los endpoints reales que
/// expone la app, leídos con <see cref="EndpointDataSource"/>: ni un endpoint de escritura sin
/// declarar, ni uno declarado que ya no existe. Es el guard de faltantes del spec (issue #417): un
/// endpoint nuevo sin entrada en el catálogo hace caer <see cref="Every_real_write_endpoint_is_in_the_catalogue"/>.
/// </summary>
public class EveryWriteEndpointIsDeclaredTests : IClassFixture<RegisterApiFixture>
{
    private static readonly HashSet<string> WriteMethods =
        new(StringComparer.OrdinalIgnoreCase) { "POST", "PUT", "PATCH", "DELETE" };

    private readonly RegisterApiFixture _fixture;

    public EveryWriteEndpointIsDeclaredTests(RegisterApiFixture fixture)
    {
        _fixture = fixture;
    }

    private IReadOnlyList<RouteEndpoint> RealWriteEndpoints() =>
        _fixture.Factory.Services.GetServices<EndpointDataSource>()
            .SelectMany(ds => ds.Endpoints)
            .OfType<RouteEndpoint>()
            .Where(e => (e.Metadata.GetMetadata<HttpMethodMetadata>()?.HttpMethods ?? [])
                .Any(WriteMethods.Contains))
            .ToList();

    private static string DisplayName(Endpoint endpoint) =>
        endpoint.Metadata.GetMetadata<IEndpointNameMetadata>()?.EndpointName
        ?? endpoint.DisplayName
        ?? "?";

    [Fact]
    public void Every_real_write_endpoint_is_in_the_catalogue()
    {
        var declaredNames = WriteEndpoints.All.Select(e => e.Name).ToHashSet();

        var undeclared = RealWriteEndpoints()
            .Select(DisplayName)
            .Where(name => !declaredNames.Contains(name))
            .OrderBy(n => n, StringComparer.Ordinal)
            .ToList();

        undeclared.ShouldBeEmpty(
            $"Hay endpoint(s) de escritura sin declarar en WriteEndpoints.All: {string.Join(", ", undeclared)}");
    }

    [Fact]
    public void The_catalogue_does_not_list_an_endpoint_that_no_longer_exists()
    {
        var realNames = RealWriteEndpoints().Select(DisplayName).ToHashSet();

        var stale = WriteEndpoints.All
            .Select(e => e.Name)
            .Where(name => !realNames.Contains(name))
            .ToList();

        stale.ShouldBeEmpty(
            $"El catálogo declara endpoint(s) que ya no existen en la app: {string.Join(", ", stale)}");
    }

    [Fact]
    public void The_catalogue_covers_exactly_the_49_write_endpoints_of_the_spec()
    {
        // Ancla numérica del spec (issue #417, verificado en el código el 2026-09-02; bajó de 52 a
        // 49 al retirarse el claim docente, issue #416): si este número se mueve, alguien agregó o
        // sacó un endpoint de escritura y el catálogo se revisa a mano, no solo se actualiza el
        // número acá.
        RealWriteEndpoints().Count.ShouldBe(49);
        WriteEndpoints.All.Count.ShouldBe(49);
    }

    [Theory]
    [MemberData(nameof(Cases))]
    public void Declared_access_matches_the_real_endpoint_metadata(WriteEndpointCase declared)
    {
        var real = RealWriteEndpoints().SingleOrDefault(e => DisplayName(e) == declared.Name);
        real.ShouldNotBeNull($"'{declared.Name}' está en el catálogo pero no lo expone la app real.");

        var actual = Classify(real!);

        // Owner y AnyAccount son indistinguibles desde la metadata HTTP: las dos son
        // RequireAuthorization() a secas, y la propiedad sobre el recurso la resuelve el handler (no
        // hay una policy de "dueño" a nivel framework). El catálogo conoce esa distinción porque leyó
        // el comentario del *Endpoint.cs a mano; acá se los compara como el mismo balde.
        var expected = declared.Access == WriteAccess.Owner ? WriteAccess.AnyAccount : declared.Access;

        actual.ShouldBe(expected,
            $"'{declared.Name}' declara {declared.Access} en el catálogo pero la metadata real de la app es {actual}.");
    }

    public static IEnumerable<object[]> Cases() => WriteEndpoints.All.Select(e => new object[] { e });

    /// <summary>
    /// Clasifica un endpoint real por su metadata de autorización, leyendo lo mismo que lee
    /// <c>AuthorizationMiddleware</c>: <c>IAllowAnonymous</c> apaga el gate entero; <c>RequireRole</c>
    /// cuelga el <see cref="AuthorizationPolicy"/> ya construido directo en la metadata (no como
    /// <see cref="IAuthorizeData"/>, que es lo que agrega un <c>RequireAuthorization()</c> a secas).
    /// </summary>
    private static WriteAccess Classify(Endpoint endpoint)
    {
        if (endpoint.Metadata.GetMetadata<IAllowAnonymous>() is not null)
        {
            return WriteAccess.Anonymous;
        }

        var roles = endpoint.Metadata.GetOrderedMetadata<AuthorizationPolicy>()
            .SelectMany(p => p.Requirements)
            .OfType<RolesAuthorizationRequirement>()
            .SelectMany(r => r.AllowedRoles)
            .ToList();

        if (roles.Count > 0)
        {
            // "Admin" a secas, ni un rol distinto ni Admin sumado a otro: cualquier otra
            // combinación es un acceso que el catálogo no declara para ningún endpoint (OtherRole),
            // nunca el balde de AnyAccount (que es "sin requerimiento de rol", no "algún rol").
            var distinctRoles = roles.ToHashSet(StringComparer.Ordinal);
            return distinctRoles.SetEquals(["Admin"]) ? WriteAccess.Admin : WriteAccess.OtherRole;
        }

        var requiresAnyAccount = endpoint.Metadata.GetOrderedMetadata<IAuthorizeData>().Count > 0;
        return requiresAnyAccount ? WriteAccess.AnyAccount : WriteAccess.Anonymous;
    }
}
