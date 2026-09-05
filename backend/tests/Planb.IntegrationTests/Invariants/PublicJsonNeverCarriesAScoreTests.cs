using System.Net.Http.Json;
using System.Reflection;
using System.Text.Json;
using System.Text.RegularExpressions;
using Planb.Academic.Application.Contracts;
using Planb.Academic.Application.Features.Search;
using Planb.IntegrationTests.Infrastructure;
using Planb.Reviews.Application.Abstractions.Persistence;
using Planb.Reviews.Application.Features.CareerFacts;
using Planb.Reviews.Application.Features.ChairFacts;
using Planb.Reviews.Application.Features.PublishingRulesRead;
using Planb.Reviews.Application.Features.SubjectFacts;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Invariants;

/// <summary>
/// La ficha publica conteos con sus voces y nunca un puntaje, un promedio, una nota ni una
/// estrella (ADR-0083), sea cual sea el nombre que se le ponga al campo. Un porcentaje con su
/// propio total (<c>percent</c> junto a <c>total</c>, <c>outOfTen</c> junto a <c>reaching</c>) es
/// un conteo, no un puntaje: lo que este archivo prohíbe es la palabra que promete un promedio o
/// un ranking, no el porcentaje en sí.
///
/// <para>
/// Dos tests sobre el mismo catálogo de rutas públicas. El primero (<see
/// cref="Public_json_never_carries_a_score_field"/>) recorre el JSON real que hoy devuelve cada
/// endpoint: agarra lo que llega con contenido. El segundo (<see
/// cref="Declared_response_type_never_carries_a_score_field"/>) recorre por reflection los tipos
/// que cada endpoint declara con <c>.Produces&lt;T&gt;()</c>: agarra los campos que hoy vienen
/// <c>null</c> y por eso no aparecen serializados, pero existen en el contrato igual.
/// </para>
///
/// <para>
/// <c>GET /api/academic/careers/{id}</c> y <c>GET /api/academic/universities/{id}</c> quedan
/// afuera del catálogo: son <c>RequireRole(Admin)</c>, no <c>AllowAnonymous</c>
/// (<see cref="Planb.Academic.Application.Features.AdminCareers.GetCareerEndpoint"/>,
/// <see cref="Planb.Academic.Application.Features.AdminUniversities.GetUniversityEndpoint"/>). El
/// catálogo público solo expone el listado (<c>careers?universityId=</c>,
/// <c>universities</c>), nunca el detalle por id de esos dos recursos.
/// </para>
/// </summary>
public class PublicJsonNeverCarriesAScoreTests : IClassFixture<PublicJsonNeverCarriesAScoreFixture>
{
    // "star" sin límite matchea el prefijo de "Start": AcademicTermListItem.StartDate (startDate en
    // el JSON) caía como falso positivo antes de este ajuste (corrida real, no hipótesis). El resto
    // de los términos queda sin límites a propósito: así "AverageScore"/"averageScore" (la prueba de
    // caída de este archivo) cae por "average" y por "score" aunque estén pegados en un solo
    // identificador, sin depender de dónde corta el camelCase.
    private static readonly Regex ForbiddenName = new(
        @"average|mean|score|rating|rank|star(?!t)|puntaje|promedio|nota\b",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private static readonly Guid TudcsCareerId = Guid.Parse("00000002-0000-4000-a000-000000000003");
    private static readonly Guid TudcsPlanId = Guid.Parse("00000003-0000-4000-a000-000000000003");
    private static readonly Guid Subject211 = Guid.Parse("00000004-0000-4000-a000-000000000012");
    private static readonly Guid UnstaId = Guid.Parse("00000001-0000-4000-a000-000000000001");
    private static readonly Guid ChairPerez = Guid.Parse("00000008-0000-4000-a000-000000000001");
    private static readonly Guid TeacherPerez = Guid.Parse("00000006-0000-4000-a000-00000000000b");

    private readonly HttpClient _anonymous;

    public PublicJsonNeverCarriesAScoreTests(PublicJsonNeverCarriesAScoreFixture fixture)
    {
        _anonymous = fixture.Register.Factory.CreateClient();
    }

    /// <summary>
    /// El catálogo de rutas públicas (ver docstring de la clase para las dos que quedan afuera).
    /// Mismos ids que usa <see cref="PublicJsonNeverCarriesAScoreFixture"/> para publicar.
    /// </summary>
    public static IEnumerable<object[]> PublicRoutes() =>
        new (string EndpointName, string Path)[]
        {
            ("Reviews_GetChairFacts", $"/api/reviews/chairs/{ChairPerez}/facts"),
            ("Reviews_GetSampleChairFacts", "/api/reviews/chairs/sample"),
            ("Reviews_GetSubjectFacts", $"/api/reviews/subjects/{Subject211}/facts"),
            ("Reviews_GetCareerFacts", $"/api/reviews/careers/{TudcsCareerId}/facts"),
            ("Reviews_GetCurrentInstrument", "/api/reviews/instrument"),
            ("Reviews_GetPublishingRules", "/api/reviews/publishing-rules"),
            ("Academic_Search", "/api/search?q=Fundamentos"),
            ("Academic_GetTeacher", $"/api/academic/teachers/{TeacherPerez}"),
            ("Academic_GetTeacherChairs", $"/api/academic/teachers/{TeacherPerez}/chairs"),
            ("Academic_GetSubject", $"/api/academic/subjects/{Subject211}"),
            ("Academic_GetSubjectChairs", $"/api/academic/subjects/{Subject211}/chairs"),
            ("Academic_ListAcademicTerms", $"/api/academic/academic-terms?universityId={UnstaId}"),
            ("Academic_ListUniversities", "/api/academic/universities"),
            ("Academic_ListCareers", $"/api/academic/careers?universityId={UnstaId}"),
            ("Academic_ListSubjects", $"/api/academic/subjects?careerPlanId={TudcsPlanId}"),
            ("Academic_ListCareerPlans", $"/api/academic/career-plans?careerId={TudcsCareerId}"),
            ("Academic_GetCareerPlanById", $"/api/academic/career-plans/{TudcsPlanId}"),
            ("Academic_ListPublicPrerequisites", $"/api/academic/prerequisites?careerPlanId={TudcsPlanId}"),
        }.Select(r => new object[] { r.EndpointName, r.Path });

    /// <summary>US-shape del contrato: mismas rutas, el tipo que cada *Endpoint.cs declara con <c>.Produces&lt;T&gt;()</c>.</summary>
    public static IEnumerable<object[]> DeclaredResponseTypes() =>
        new (string EndpointName, Type ResponseType)[]
        {
            ("Reviews_GetChairFacts", typeof(GetChairFactsResponse)),
            ("Reviews_GetSampleChairFacts", typeof(GetChairFactsResponse)),
            ("Reviews_GetSubjectFacts", typeof(GetSubjectFactsResponse)),
            ("Reviews_GetCareerFacts", typeof(GetCareerFactsResponse)),
            ("Reviews_GetCurrentInstrument", typeof(CurrentInstrumentView)),
            ("Reviews_GetPublishingRules", typeof(PublishingRulesResponse)),
            ("Academic_Search", typeof(SearchResponse)),
            ("Academic_GetTeacher", typeof(TeacherDetailItem)),
            ("Academic_GetTeacherChairs", typeof(IReadOnlyList<TeacherChairItem>)),
            ("Academic_GetSubject", typeof(SubjectDetailItem)),
            ("Academic_GetSubjectChairs", typeof(IReadOnlyList<ChairListItem>)),
            ("Academic_ListAcademicTerms", typeof(IReadOnlyList<AcademicTermListItem>)),
            ("Academic_ListUniversities", typeof(IReadOnlyList<UniversityListItem>)),
            ("Academic_ListCareers", typeof(IReadOnlyList<CareerListItem>)),
            ("Academic_ListSubjects", typeof(IReadOnlyList<SubjectListItem>)),
            ("Academic_ListCareerPlans", typeof(IReadOnlyList<CareerPlanListItem>)),
            ("Academic_GetCareerPlanById", typeof(CareerPlanSummary)),
            ("Academic_ListPublicPrerequisites", typeof(IReadOnlyList<PublicPrerequisiteEdge>)),
        }.Select(r => new object[] { r.EndpointName, r.ResponseType });

    [Theory]
    [MemberData(nameof(PublicRoutes))]
    public async Task Public_json_never_carries_a_score_field(string endpointName, string path)
    {
        var body = await _anonymous.GetOkStringAsync(path);
        using var document = JsonDocument.Parse(body);

        var offenders = WalkJson(document.RootElement, "$")
            .Where(field => ForbiddenName.IsMatch(field.Name))
            .ToList();

        offenders.ShouldBeEmpty(
            $"{endpointName} (GET {path}) publica un campo prohibido: " +
            string.Join(", ", offenders.Select(o => $"\"{o.Name}\" en {o.Path}")));
    }

    [Theory]
    [MemberData(nameof(DeclaredResponseTypes))]
    public void Declared_response_type_never_carries_a_score_field(string endpointName, Type responseType)
    {
        var offenders = WalkType(responseType, responseType.Name, new HashSet<Type>())
            .Where(field => ForbiddenName.IsMatch(field.Name))
            .ToList();

        offenders.ShouldBeEmpty(
            $"{endpointName} declara ({responseType.Name}) un campo prohibido: " +
            string.Join(", ", offenders.Select(o => $"\"{o.Name}\" en {o.Path}")));
    }

    /// <summary>Recorrido recursivo de un <see cref="JsonElement"/>: cada propiedad, con el path donde vive.</summary>
    private static IEnumerable<(string Name, string Path)> WalkJson(JsonElement element, string path)
    {
        switch (element.ValueKind)
        {
            case JsonValueKind.Object:
                foreach (var property in element.EnumerateObject())
                {
                    var childPath = $"{path}.{property.Name}";
                    yield return (property.Name, childPath);
                    foreach (var nested in WalkJson(property.Value, childPath))
                    {
                        yield return nested;
                    }
                }

                break;

            case JsonValueKind.Array:
                var index = 0;
                foreach (var item in element.EnumerateArray())
                {
                    foreach (var nested in WalkJson(item, $"{path}[{index}]"))
                    {
                        yield return nested;
                    }

                    index++;
                }

                break;
        }
    }

    /// <summary>Tipos que no valen la pena recorrer: no tienen "propiedades" en el sentido que este test busca.</summary>
    private static readonly HashSet<Type> LeafTypes =
    [
        typeof(string), typeof(bool), typeof(short), typeof(int), typeof(long),
        typeof(double), typeof(decimal), typeof(Guid), typeof(DateOnly),
        typeof(DateTime), typeof(DateTimeOffset), typeof(TimeSpan),
    ];

    /// <summary>
    /// Recorrido recursivo de un <see cref="Type"/> declarado (records anidados incluidos): cada
    /// propiedad pública, con el path donde vive. <paramref name="visited"/> evita recursión
    /// infinita en el único tipo autorreferenciado del árbol
    /// (<see cref="PublishedItemView.PreviousSeries"/>); revisitar un tipo ya expandido no suma
    /// nada nuevo, porque los nombres de campo son los mismos sea cual sea la instancia concreta
    /// que los contenga.
    /// </summary>
    private static IEnumerable<(string Name, string Path)> WalkType(Type type, string path, HashSet<Type> visited)
    {
        var underlying = Nullable.GetUnderlyingType(type) ?? type;

        if (underlying.IsEnum || LeafTypes.Contains(underlying))
        {
            yield break;
        }

        var elementType = ElementTypeOf(underlying);
        if (elementType is not null)
        {
            foreach (var nested in WalkType(elementType, $"{path}[]", visited))
            {
                yield return nested;
            }

            yield break;
        }

        if (!underlying.IsClass || !visited.Add(underlying))
        {
            yield break;
        }

        foreach (var property in underlying.GetProperties(BindingFlags.Public | BindingFlags.Instance))
        {
            var childPath = $"{path}.{property.Name}";
            yield return (property.Name, childPath);
            foreach (var nested in WalkType(property.PropertyType, childPath, visited))
            {
                yield return nested;
            }
        }
    }

    /// <summary>El tipo de elemento de un array o de un <c>IReadOnlyList&lt;T&gt;</c>/<c>IEnumerable&lt;T&gt;</c>; null si no es una colección.</summary>
    private static Type? ElementTypeOf(Type type)
    {
        if (type.IsArray)
        {
            return type.GetElementType();
        }

        if (type.IsGenericType)
        {
            var definition = type.GetGenericTypeDefinition();
            if (definition == typeof(IReadOnlyList<>) || definition == typeof(IEnumerable<>) ||
                definition == typeof(List<>))
            {
                return type.GetGenericArguments()[0];
            }
        }

        return null;
    }
}

/// <summary>
/// Arranca una vez por clase (xUnit reusa <see cref="IClassFixture{TFixture}"/> para todas las
/// filas de los dos Theory): diez reseñas sobre Pérez, para que las respuestas de facts vengan con
/// contenido real y no con secciones nulas. La docente con cátedra ya existe en el seed (Pérez,
/// <c>AcademicSeedData</c>): no hace falta sembrar nada más para los endpoints de docente.
/// </summary>
public sealed class PublicJsonNeverCarriesAScoreFixture : IAsyncLifetime
{
    public RegisterApiFixture Register { get; } = new();

    private static readonly Guid TudcsPlanId = Guid.Parse("00000003-0000-4000-a000-000000000003");
    private static readonly Guid Subject211 = Guid.Parse("00000004-0000-4000-a000-000000000012");
    private static readonly Guid ChairPerez = Guid.Parse("00000008-0000-4000-a000-000000000001");

    private static readonly Guid[] Terms =
    [
        Guid.Parse("00000005-0000-4000-a000-000000000001"),
        Guid.Parse("00000005-0000-4000-a000-000000000002"),
        Guid.Parse("00000005-0000-4000-a000-000000000003"),
        Guid.Parse("00000005-0000-4000-a000-000000000004"),
        Guid.Parse("00000005-0000-4000-a000-000000000005"),
        Guid.Parse("00000005-0000-4000-a000-000000000006"),
    ];

    public async Task InitializeAsync()
    {
        await Register.InitializeAsync();

        for (var i = 0; i < 10; i++)
        {
            var auth = await AuthenticatedClient.CreateAsync(
                Register, $"public-json-{i}.{Guid.NewGuid():N}@planb.local");

            (await auth.Client.PostAsJsonAsync(
                    "/api/me/student-profiles",
                    new { careerPlanId = TudcsPlanId, enrollmentYear = 2024 }))
                .EnsureSuccessStatusCode();

            var published = await auth.Client.PostAsJsonAsync(
                "/api/reviews/courses",
                new
                {
                    subjectId = Subject211,
                    termId = Terms[i % Terms.Length],
                    chairId = (Guid?)ChairPerez,
                    answers = new[]
                    {
                        // Siete de diez aprueban: sostiene Completion. Ocho de diez marcan la
                        // negativa de esta frase: sostiene ChairConduct con una moda clara.
                        new { itemCode = "COURSE_OUTCOME", optionValue = i < 7 ? 1 : 3 },
                        new { itemCode = "CHAIR_ANSWERS_IN_CLASS", optionValue = i < 8 ? 3 : 1 },
                        new { itemCode = "CHAIR_CLASSES_HELD", optionValue = 3 },
                    },
                    freeText = (string?)null,
                });
            published.EnsureSuccessStatusCode();
        }
    }

    public async Task DisposeAsync() => await Register.DisposeAsync();
}
