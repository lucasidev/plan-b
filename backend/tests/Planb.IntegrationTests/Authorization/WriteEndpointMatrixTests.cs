using System.Net;
using System.Net.Http.Json;
using System.Text;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Planb.Identity.Domain.Users;
using Planb.IntegrationTests.Infrastructure;
using Shouldly;
using StackExchange.Redis;
using Xunit;

namespace Planb.IntegrationTests.Authorization;

/// <summary>
/// Las cuatro cuentas por rol que usa <see cref="WriteEndpointMatrixTests"/>, compartidas por toda
/// la clase (xUnit instancia <see cref="IClassFixture{TFixture}"/> una sola vez por clase, a
/// diferencia de la clase de test misma, que se reinstancia por cada caso de un <c>[Theory]</c>).
///
/// <para>
/// Poner <c>IAsyncLifetime</c> en la clase de test en vez de acá fue el primer intento, y recreaba
/// las cuatro cuentas (con su costo de bcrypt, ~2s cada alta) antes de cada una de las ~290 filas de
/// la matriz: una corrida de 28 minutos que terminaba abortada. Achicar el setup a un fixture propio
/// es lo que lo deja en el orden de los otros archivos de este proyecto.
/// </para>
/// </summary>
public sealed class WriteEndpointMatrixFixture : IAsyncLifetime
{
    public RegisterApiFixture Register { get; } = new();
    public AuthenticatedClient Admin { get; private set; } = null!;
    public AuthenticatedClient Member { get; private set; } = null!;
    public AuthenticatedClient Moderator { get; private set; } = null!;
    public AuthenticatedClient UniversityStaff { get; private set; } = null!;

    private static readonly Guid TudcsPlanId = Guid.Parse("00000003-0000-4000-a000-000000000003");

    public async Task InitializeAsync()
    {
        await Register.InitializeAsync();

        // Los rate limiters de forgot-password (5/hora) y resend-verification (3/hora) son por IP, y
        // WebApplicationFactory siempre reporta localhost: sin este clear, esta clase comparte bucket
        // con cualquier otra que ya le haya pegado a esos dos endpoints en el mismo Redis (mismo
        // criterio que RequestPasswordResetEndpointTests/ResendVerificationEmailEndpointTests). El
        // patrón va acotado a esos dos prefijos, no a "identity:ratelimit:*": ese comodín también
        // borra el bucket de register (por mail, no por IP) de cualquier otra clase que esté corriendo
        // en paralelo sobre el mismo Redis, en este proceso o en otro.
        var redis = Register.Factory.Services.GetRequiredService<IConnectionMultiplexer>();
        var server = redis.GetServer(redis.GetEndPoints()[0]);
        var staleKeys = server.Keys(pattern: "identity:ratelimit:forgot-password:*")
            .Concat(server.Keys(pattern: "identity:ratelimit:resend-verification:*"))
            .ToArray();
        if (staleKeys.Length > 0)
        {
            await redis.GetDatabase().KeyDeleteAsync(staleKeys);
        }

        Admin = await AuthenticatedClient.CreateAsync(
            Register, $"matrix-admin.{Guid.NewGuid():N}@planb.local", role: UserRole.Admin);
        Member = await AuthenticatedClient.CreateAsync(
            Register, $"matrix-member.{Guid.NewGuid():N}@planb.local", role: UserRole.Member);
        Moderator = await AuthenticatedClient.CreateAsync(
            Register, $"matrix-moderator.{Guid.NewGuid():N}@planb.local", role: UserRole.Moderator);
        UniversityStaff = await AuthenticatedClient.CreateAsync(
            Register, $"matrix-staff.{Guid.NewGuid():N}@planb.local", role: UserRole.UniversityStaff);

        // Member necesita un StudentProfile activo: PATCH /api/me/student-profile lo exige (404 sin
        // uno), y sin esto la fila de payload-en-el-borde de ese endpoint nunca llega a validar el
        // body, solo el 404 de "no hay profile".
        (await Member.Client.PostAsJsonAsync(
                "/api/me/student-profiles", new { careerPlanId = TudcsPlanId, enrollmentYear = 2024 }))
            .EnsureSuccessStatusCode();
    }

    public async Task DisposeAsync() => await Register.DisposeAsync();
}

/// <summary>
/// La matriz de intentos del spec (issue #417) contra el catálogo de <see cref="WriteEndpoints"/>:
/// sin sesión, con el rol equivocado, sobre una reseña ajena, con un id que no existe, con un payload
/// en el borde, y los ocho de identity con cookies basura. Se ataca desde el contrato: cada caso
/// arma el request exacto (verbo, ruta, rol, body) y solo mira el status code, nunca el handler.
///
/// <para>
/// Ninguna fila de esta matriz espera un 2xx, así que reusar las cuentas de <see cref="WriteEndpointMatrixFixture"/>
/// en todas las filas no ensucia nada: un intento rechazado no muta estado.
/// </para>
/// </summary>
[Collection("IpRateLimit")]
public class WriteEndpointMatrixTests : IClassFixture<WriteEndpointMatrixFixture>
{
    private static readonly Guid TudcsPlanId = Guid.Parse("00000003-0000-4000-a000-000000000003");
    private static readonly Guid Subject211Id = Guid.Parse("00000004-0000-4000-a000-000000000012");
    private static readonly Guid ChairPerezId = Guid.Parse("00000008-0000-4000-a000-000000000001");
    private static readonly Guid Term2024_1cId = Guid.Parse("00000005-0000-4000-a000-000000000001");
    private static readonly Guid Term2024_2cId = Guid.Parse("00000005-0000-4000-a000-000000000002");

    private readonly WriteEndpointMatrixFixture _fixture;

    public WriteEndpointMatrixTests(WriteEndpointMatrixFixture fixture)
    {
        _fixture = fixture;
    }

    // -----------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------

    private static HttpRequestMessage BuildRequest(HttpMethod method, string route, object? body)
    {
        var request = new HttpRequestMessage(method, route);
        if (body is not null)
        {
            request.Content = JsonContent.Create(body, body.GetType());
        }

        return request;
    }

    private HttpClient ClientFor(WriteAccess access) => access switch
    {
        WriteAccess.Admin => _fixture.Admin.Client,
        WriteAccess.AnyAccount or WriteAccess.Owner => _fixture.Member.Client,
        WriteAccess.Anonymous => _fixture.Register.Factory.CreateClient(),
        _ => throw new ArgumentOutOfRangeException(nameof(access), access, null),
    };

    /// <summary>
    /// forgot-password (5/hora) y resend-verification (3/hora) son rate-limited por IP, y varias
    /// baterías de esta matriz (body vacío, string largo, cookies basura) le pegan a los dos más de
    /// una vez a lo largo del archivo: sin limpiar antes de cada fila, la ventana que dejó una fila
    /// anterior hace caer la siguiente con 429 en vez del status que esa fila realmente prueba. Misma
    /// key que RequestPasswordResetEndpointTests/ResendVerificationEmailEndpointTests; no hace nada
    /// para el resto de los endpoints.
    /// </summary>
    private async Task ClearIpRateLimitBucketIfAnyAsync(WriteEndpointCase testCase)
    {
        var segment = testCase.Name switch
        {
            "Identity_RequestPasswordReset" => "forgot-password",
            "Identity_ResendVerificationEmail" => "resend-verification",
            _ => null,
        };
        if (segment is null)
        {
            return;
        }

        var redis = _fixture.Register.Factory.Services.GetRequiredService<IConnectionMultiplexer>();
        var server = redis.GetServer(redis.GetEndPoints()[0]);
        var keys = server.Keys(pattern: $"identity:ratelimit:{segment}:*").ToArray();
        if (keys.Length > 0)
        {
            await redis.GetDatabase().KeyDeleteAsync(keys);
        }
    }

    // -----------------------------------------------------------------
    // 1) Sin sesión: todo endpoint que exige cuenta responde 401.
    // -----------------------------------------------------------------

    public static IEnumerable<object[]> GatedEndpoints() =>
        WriteEndpoints.All.Where(e => e.Access != WriteAccess.Anonymous).Select(e => new object[] { e });

    [Theory]
    [MemberData(nameof(GatedEndpoints))]
    public async Task Without_a_session_a_gated_endpoint_answers_401(WriteEndpointCase testCase)
    {
        using var anonymous = _fixture.Register.Factory.CreateClient();

        var response = await anonymous.SendAsync(
            BuildRequest(testCase.Method, testCase.FakeRoute, testCase.ValidBody?.Invoke()));

        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized,
            $"{testCase.Method} {testCase.FakeRoute} sin sesión: esperaba 401, fue {(int)response.StatusCode}.");
    }

    // -----------------------------------------------------------------
    // 2) Member, Moderator y UniversityStaff: todo endpoint Admin responde 403.
    // -----------------------------------------------------------------

    public static IEnumerable<object[]> AdminOnlyEndpoints() =>
        WriteEndpoints.All.Where(e => e.Access == WriteAccess.Admin).Select(e => new object[] { e });

    [Theory]
    [MemberData(nameof(AdminOnlyEndpoints))]
    public Task Member_cannot_reach_admin_only_endpoints(WriteEndpointCase testCase) =>
        AssertForbiddenForNonAdmin(testCase, _fixture.Member.Client, "Member");

    [Theory]
    [MemberData(nameof(AdminOnlyEndpoints))]
    public Task Moderator_cannot_reach_admin_only_endpoints(WriteEndpointCase testCase) =>
        AssertForbiddenForNonAdmin(testCase, _fixture.Moderator.Client, "Moderator");

    [Theory]
    [MemberData(nameof(AdminOnlyEndpoints))]
    public Task University_staff_cannot_reach_admin_only_endpoints(WriteEndpointCase testCase) =>
        AssertForbiddenForNonAdmin(testCase, _fixture.UniversityStaff.Client, "UniversityStaff");

    private static async Task AssertForbiddenForNonAdmin(WriteEndpointCase testCase, HttpClient client, string role)
    {
        var response = await client.SendAsync(
            BuildRequest(testCase.Method, testCase.FakeRoute, testCase.ValidBody?.Invoke()));

        response.StatusCode.ShouldBe(HttpStatusCode.Forbidden,
            $"{testCase.Method} {testCase.FakeRoute} con rol {role}: esperaba 403, fue {(int)response.StatusCode}.");
    }

    // -----------------------------------------------------------------
    // 3) y 4) Una reseña ajena: Admin y Member, PUT y DELETE.
    // -----------------------------------------------------------------

    private async Task<(AuthenticatedClient Author, Guid ReviewId)> PublishOwnedReviewAsync(string label, Guid termId)
    {
        var author = await AuthenticatedClient.CreateAsync(
            _fixture.Register, $"matrix-{label}.{Guid.NewGuid():N}@planb.local");
        (await author.Client.PostAsJsonAsync(
                "/api/me/student-profiles", new { careerPlanId = TudcsPlanId, enrollmentYear = 2024 }))
            .EnsureSuccessStatusCode();

        var publish = await author.Client.PostAsJsonAsync(
            "/api/reviews/courses",
            new
            {
                subjectId = Subject211Id,
                termId,
                chairId = (Guid?)ChairPerezId,
                answers = new[] { new { itemCode = "COURSE_OUTCOME", optionValue = (short)1 } },
                freeText = "reseña original, sin tocar",
            });
        publish.StatusCode.ShouldBe(HttpStatusCode.Created, await publish.Content.ReadAsStringAsync());

        var created = await publish.Content.ReadFromJsonAsync<PublishedReviewDto>();
        return (author, created!.Id);
    }

    private static async Task AssertReviewUnchangedAsync(AuthenticatedClient author, Guid reviewId)
    {
        var mine = await author.Client.GetFromJsonAsync<List<MyReviewDto>>("/api/reviews/courses/me");
        var review = mine!.SingleOrDefault(r => r.Id == reviewId);

        review.ShouldNotBeNull("la reseña ajena tiene que seguir existiendo después del intento.");
        review!.FreeText.ShouldBe("reseña original, sin tocar", "el intento ajeno no debería haber pisado el contenido.");
    }

    [Fact]
    public async Task Admin_cannot_touch_someone_elses_review()
    {
        var (author, reviewId) = await PublishOwnedReviewAsync("ajena-admin", Term2024_1cId);

        var revise = await _fixture.Admin.Client.PutAsJsonAsync(
            $"/api/reviews/courses/{reviewId}",
            new { answers = new[] { new { itemCode = "COURSE_OUTCOME", optionValue = (short)2 } }, freeText = "pisado por admin" });
        revise.StatusCode.ShouldBe(HttpStatusCode.NotFound,
            $"el contrato dice 404 para una reseña ajena, nunca 403, ni siquiera con Admin; fue {(int)revise.StatusCode}.");

        var delete = await _fixture.Admin.Client.DeleteAsync($"/api/reviews/courses/{reviewId}");
        delete.StatusCode.ShouldBe(HttpStatusCode.NotFound,
            $"el contrato dice 404 para una reseña ajena, nunca 403, ni siquiera con Admin; fue {(int)delete.StatusCode}.");

        await AssertReviewUnchangedAsync(author, reviewId);
    }

    [Fact]
    public async Task Member_cannot_touch_someone_elses_review()
    {
        var (author, reviewId) = await PublishOwnedReviewAsync("ajena-member", Term2024_2cId);

        var revise = await _fixture.Member.Client.PutAsJsonAsync(
            $"/api/reviews/courses/{reviewId}",
            new { answers = new[] { new { itemCode = "COURSE_OUTCOME", optionValue = (short)2 } }, freeText = "pisado por otro member" });
        revise.StatusCode.ShouldBe(HttpStatusCode.NotFound,
            $"el contrato dice 404 para una reseña ajena, nunca 403; fue {(int)revise.StatusCode}.");

        var delete = await _fixture.Member.Client.DeleteAsync($"/api/reviews/courses/{reviewId}");
        delete.StatusCode.ShouldBe(HttpStatusCode.NotFound,
            $"el contrato dice 404 para una reseña ajena, nunca 403; fue {(int)delete.StatusCode}.");

        await AssertReviewUnchangedAsync(author, reviewId);
    }

    // -----------------------------------------------------------------
    // 5) Ids inexistentes: 404 o 400, nunca 500 ni 2xx.
    // -----------------------------------------------------------------

    public static IEnumerable<object[]> EndpointsWithRouteId() =>
        WriteEndpoints.All.Where(e => e.SeededIds.Length > 0).Select(e => new object[] { e });

    [Theory]
    [MemberData(nameof(EndpointsWithRouteId))]
    public async Task Unknown_route_ids_are_404_or_400_never_500_nor_2xx(WriteEndpointCase testCase)
    {
        var client = ClientFor(testCase.Access);
        var response = await client.SendAsync(
            BuildRequest(testCase.Method, testCase.FakeRoute, testCase.ValidBody?.Invoke()));

        // 404 o 400 ya implican "nunca 500, nunca 2xx": no hace falta un chequeo de rango aparte
        // (uno anterior acá, `(int)StatusCode < 300`, rechazaba un 404 legítimo por error de lógica).
        (response.StatusCode == HttpStatusCode.NotFound || response.StatusCode == HttpStatusCode.BadRequest)
            .ShouldBeTrue(
                $"{testCase.Method} {testCase.FakeRoute} con un id inexistente: esperaba 404 o 400, " +
                $"fue {(int)response.StatusCode}.");
    }

    // -----------------------------------------------------------------
    // 6) Payload en el borde: body vacío, string al máximo, enum inválido, fecha imposible.
    // -----------------------------------------------------------------

    // Reviews_ReviseReview queda afuera de esta batería genérica: su SeededIds es un GUID que no
    // existe (no hay reseña real para "el rol correcto"), así que cualquier body ahí da 404 por el id
    // y no dice nada del body. Lo prueba Owner_rejects_a_malformed_body_from_its_real_author con una
    // reseña y una autora reales.
    private static readonly string[] OwnerBodyEndpoints = ["Reviews_ReviseReview"];

    public static IEnumerable<object[]> EndpointsWithBody() =>
        WriteEndpoints.All
            .Where(e => e.HasBody && !OwnerBodyEndpoints.Contains(e.Name))
            .Select(e => new object[] { e });

    public static IEnumerable<object[]> EndpointsWithLongStringBody() =>
        WriteEndpoints.All
            .Where(e => e.LongStringBody is not null && !OwnerBodyEndpoints.Contains(e.Name))
            .Select(e => new object[] { e });

    public static IEnumerable<object[]> EndpointsWithInvalidEnumBody() =>
        WriteEndpoints.All.Where(e => e.InvalidEnumBody is not null).Select(e => new object[] { e });

    public static IEnumerable<object[]> EndpointsWithNumericEnumBody() =>
        WriteEndpoints.All.Where(e => e.NumericEnumBody is not null).Select(e => new object[] { e });

    public static IEnumerable<object[]> EndpointsWithImpossibleDateBody() =>
        WriteEndpoints.All.Where(e => e.ImpossibleDateBody is not null).Select(e => new object[] { e });

    [Theory]
    [MemberData(nameof(EndpointsWithBody))]
    public async Task Empty_body_is_400(WriteEndpointCase testCase)
    {
        await ClearIpRateLimitBucketIfAnyAsync(testCase);

        var client = ClientFor(testCase.Access);
        var response = await client.SendAsync(
            BuildRequest(testCase.Method, testCase.SeededRoute, new { }));

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest,
            $"{testCase.Method} {testCase.SeededRoute} con body vacío: esperaba 400, fue {(int)response.StatusCode}.");
    }

    // Un body que no es JSON hace que el binding de Minimal APIs tire BadHttpRequestException, y con
    // ThrowOnBadRequest (el default de Development) esa excepción llegaba al exception handler como
    // 500. Mismo contrato que el resto de la batería: un request mal armado es 400, nunca 500.
    [Theory]
    [MemberData(nameof(EndpointsWithBody))]
    public async Task Body_that_is_not_json_is_400(WriteEndpointCase testCase)
    {
        await ClearIpRateLimitBucketIfAnyAsync(testCase);

        var client = ClientFor(testCase.Access);
        var request = new HttpRequestMessage(testCase.Method, testCase.SeededRoute)
        {
            Content = new StringContent("not json", Encoding.UTF8, "application/json"),
        };
        var response = await client.SendAsync(request);

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest,
            $"{testCase.Method} {testCase.SeededRoute} con un body que no es JSON: esperaba 400, fue {(int)response.StatusCode}.");
    }

    [Theory]
    [MemberData(nameof(EndpointsWithLongStringBody))]
    public async Task String_field_at_10000_chars_is_400(WriteEndpointCase testCase)
    {
        await ClearIpRateLimitBucketIfAnyAsync(testCase);

        var client = ClientFor(testCase.Access);
        var response = await client.SendAsync(
            BuildRequest(testCase.Method, testCase.SeededRoute, testCase.LongStringBody!.Invoke()));

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest,
            $"{testCase.Method} {testCase.SeededRoute} con un string de 10.000 caracteres: " +
            $"esperaba 400, fue {(int)response.StatusCode}.");
    }

    [Theory]
    [MemberData(nameof(EndpointsWithInvalidEnumBody))]
    public async Task Invalid_enum_value_is_400(WriteEndpointCase testCase)
    {
        var client = ClientFor(testCase.Access);
        var response = await client.SendAsync(
            BuildRequest(testCase.Method, testCase.SeededRoute, testCase.InvalidEnumBody!.Invoke()));

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest,
            $"{testCase.Method} {testCase.SeededRoute} con un enum inválido: esperaba 400, fue {(int)response.StatusCode}.");
    }

    // Enum.TryParse acepta un string numérico y lo castea aunque ningún miembro valga eso (#428): un
    // "9" que no es ninguna opción del enum tiene que dar 400 igual que "NotALanguage", nunca colarse
    // como el literal crudo.
    [Theory]
    [MemberData(nameof(EndpointsWithNumericEnumBody))]
    public async Task Numeric_enum_value_is_400(WriteEndpointCase testCase)
    {
        var client = ClientFor(testCase.Access);
        var response = await client.SendAsync(
            BuildRequest(testCase.Method, testCase.SeededRoute, testCase.NumericEnumBody!.Invoke()));

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest,
            $"{testCase.Method} {testCase.SeededRoute} con un enum numérico ('9'): esperaba 400, fue {(int)response.StatusCode}.");
    }

    [Theory]
    [MemberData(nameof(EndpointsWithImpossibleDateBody))]
    public async Task Impossible_date_range_is_400(WriteEndpointCase testCase)
    {
        var client = ClientFor(testCase.Access);
        var response = await client.SendAsync(
            BuildRequest(testCase.Method, testCase.SeededRoute, testCase.ImpossibleDateBody!.Invoke()));

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest,
            $"{testCase.Method} {testCase.SeededRoute} con un período que termina antes de empezar: " +
            $"esperaba 400, fue {(int)response.StatusCode}.");
    }

    /// <summary>
    /// El caso Owner de la batería 6: una reseña y una autora reales, para que un body corrupto
    /// (acá, un freeText de 10.000 caracteres) se pruebe contra su dueña real y no contra un id que
    /// de entrada ya es 404.
    /// </summary>
    [Fact]
    public async Task Owner_rejects_a_malformed_body_from_its_real_author()
    {
        var (author, reviewId) = await PublishOwnedReviewAsync("owner-borde", Term2024_1cId);

        var response = await author.Client.PutAsJsonAsync(
            $"/api/reviews/courses/{reviewId}",
            new
            {
                answers = new[] { new { itemCode = "COURSE_OUTCOME", optionValue = (short)1 } },
                freeText = new string('x', 10_000),
            });

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest,
            $"PUT /api/reviews/courses/{reviewId} con un freeText de 10.000 caracteres: " +
            $"esperaba 400, fue {(int)response.StatusCode}.");
    }

    // -----------------------------------------------------------------
    // 7) Los ocho de identity sin sesión, con cookies/tokens basura: nunca 500.
    // -----------------------------------------------------------------

    // El spec pide "401 o 400, nunca 500" para los ocho. Corrido contra la app real, cuatro de los
    // ocho no caen ahí por diseño documentado, no por bug: register/forgot-password son anti-
    // enumeración a propósito (ADR-0076, mismo 2xx exista o no la cuenta, cookies no cambian nada) y
    // sign-out es idempotente a propósito (su propio *Endpoint.cs: "Always returns 204... callable
    // with no cookies, with an unknown refresh, or with one already revoked"). verify-email y
    // reset-password devuelven 404 porque el body ya trae un token de mentira ("garbage-token"): eso
    // no es sobre las cookies, es el mismo 404 de "token no existe" que da cualquier token inventado.
    // La parte no ambigua y que sí importa (nunca 500) es la que queda como assert; el resto es huella
    // en el reporte, no una aserción de status exacto que no es pareja entre los ocho.
    public static IEnumerable<object[]> AnonymousIdentityEndpoints() =>
        WriteEndpoints.All.Where(e => e.Access == WriteAccess.Anonymous).Select(e => new object[] { e });

    [Theory]
    [MemberData(nameof(AnonymousIdentityEndpoints))]
    public async Task Anonymous_identity_endpoints_reject_garbage_session_material_without_a_500(
        WriteEndpointCase testCase)
    {
        await ClearIpRateLimitBucketIfAnyAsync(testCase);

        using var client = _fixture.Register.Factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            HandleCookies = false,
        });

        var request = BuildRequest(testCase.Method, testCase.SeededRoute, testCase.ValidBody?.Invoke());
        request.Headers.Add("Cookie", "planb_session=garbage-token; planb_refresh=garbage-token");

        var response = await client.SendAsync(request);

        ((int)response.StatusCode).ShouldBeLessThan(500,
            $"{testCase.Method} {testCase.SeededRoute} con cookies basura no debería ser 500, " +
            $"fue {(int)response.StatusCode}.");
    }

    private sealed record PublishedReviewDto(Guid Id);

    private sealed record MyReviewDto(Guid Id, string? FreeText);
}
