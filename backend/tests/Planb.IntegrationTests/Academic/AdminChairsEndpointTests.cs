using System.Net;
using System.Net.Http.Json;
using Planb.Academic.Application.Features.AdminChairs;
using Planb.Identity.Domain.Users;
using Planb.IntegrationTests.Infrastructure;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Academic;

/// <summary>
/// Integration tests de la gestión de cátedras desde el backoffice (US-196).
///
/// <para>
/// Lo que se prueba acá y no en un unit: la coherencia cross-aggregate, que no la impone ninguna FK
/// (ADR-0017). En particular que no se pueda armar una cátedra de una materia de una universidad
/// con un docente de otra, que es el agujero que la falta de constraint deja abierto.
/// </para>
/// </summary>
public class AdminChairsEndpointTests : IClassFixture<RegisterApiFixture>
{
    private readonly RegisterApiFixture _fixture;

    // 211 Fundamentos de Control de Calidad (TUDCS, UNSTA). Ver AcademicSeedData.
    private static readonly Guid Subject211 =
        Guid.Parse("00000004-0000-4000-a000-000000000012");

    private static readonly Guid UnstaTerm =
        Guid.Parse("00000005-0000-4000-a000-000000000001");
    private static readonly Guid UnstaTermLater =
        Guid.Parse("00000005-0000-4000-a000-000000000002");

    // UNSTA. Mismo id que usa AdminTeachersEndpointTests.
    private static readonly Guid Unsta = Guid.Parse("00000001-0000-4000-a000-000000000001");

    public AdminChairsEndpointTests(RegisterApiFixture fixture) => _fixture = fixture;

    private Task<AuthenticatedClient> AdminAsync() =>
        AuthenticatedClient.CreateAsync(
            _fixture, $"admin.chairs.{Guid.NewGuid():N}@planb.local", role: UserRole.Admin);

    private static string UniqueName() => $"Cátedra {Guid.NewGuid():N}"[..24];

    [Fact]
    public async Task Creating_a_chair_requires_the_admin_role()
    {
        var member = await AuthenticatedClient.CreateAsync(
            _fixture, $"chairs-member-{Guid.NewGuid():N}@planb.local");

        var response = await member.Client.PostAsJsonAsync(
            $"/api/academic/subjects/{Subject211}/chairs", new { name = UniqueName() });

        response.StatusCode.ShouldBe(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task An_unknown_subject_is_not_found()
    {
        var admin = await AdminAsync();

        var response = await admin.Client.PostAsJsonAsync(
            $"/api/academic/subjects/{Guid.NewGuid()}/chairs", new { name = UniqueName() });

        response.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Two_chairs_of_the_same_subject_cannot_share_a_name()
    {
        var admin = await AdminAsync();
        var name = UniqueName();

        var first = await admin.Client.PostAsJsonAsync(
            $"/api/academic/subjects/{Subject211}/chairs", new { name });
        first.StatusCode.ShouldBe(HttpStatusCode.Created);

        var second = await admin.Client.PostAsJsonAsync(
            $"/api/academic/subjects/{Subject211}/chairs", new { name });
        second.StatusCode.ShouldBe(HttpStatusCode.Conflict);
    }

    /// <summary>
    /// El recorrido del issue en un solo test: se carga una cátedra, se le suma un integrante y se
    /// le cierra el tramo, y el listado del backoffice lo refleja. Van juntos porque cada paso
    /// necesita el id que devuelve el anterior.
    /// </summary>
    [Fact]
    public async Task A_chair_is_created_a_member_added_and_then_closed()
    {
        var admin = await AdminAsync();

        var created = await admin.Client.PostAsJsonAsync(
            $"/api/academic/subjects/{Subject211}/chairs", new { name = UniqueName() });
        created.StatusCode.ShouldBe(HttpStatusCode.Created);
        var chair = await created.Content.ReadFromJsonAsync<CreateChairResponse>();
        chair.ShouldNotBeNull();

        var teacherId = await CreateTeacherAsync(admin);

        var added = await admin.Client.PostAsJsonAsync(
            $"/api/academic/chairs/{chair!.Id}/members",
            new { teacherId, role = "Lead", sinceTermId = UnstaTerm });
        added.StatusCode.ShouldBe(HttpStatusCode.NoContent);

        var listed = await admin.Client.GetFromJsonAsync<List<AdminChairListItem>>(
            $"/api/academic/chairs?subjectId={Subject211}");
        var mine = listed!.Single(c => c.Id == chair.Id);
        var lead = mine.Members.ShouldHaveSingleItem();
        lead.TeacherId.ShouldBe(teacherId);
        lead.UntilTermLabel.ShouldBeNull();

        var closed = await admin.Client.PostAsJsonAsync(
            $"/api/academic/chairs/{chair.Id}/members/{teacherId}/close",
            new { untilTermId = UnstaTermLater });
        closed.StatusCode.ShouldBe(HttpStatusCode.NoContent);

        // Cerrar no borra: el tramo sigue, con su hasta. Lo que esa persona dictó sigue siendo suyo.
        var after = await admin.Client.GetFromJsonAsync<List<AdminChairListItem>>(
            $"/api/academic/chairs?subjectId={Subject211}");
        var stillThere = after!.Single(c => c.Id == chair.Id).Members.ShouldHaveSingleItem();
        stillThere.TeacherId.ShouldBe(teacherId);
        stillThere.UntilTermLabel.ShouldNotBeNull();
    }

    [Fact]
    public async Task The_same_teacher_cannot_be_added_twice_while_current()
    {
        var admin = await AdminAsync();

        var created = await admin.Client.PostAsJsonAsync(
            $"/api/academic/subjects/{Subject211}/chairs", new { name = UniqueName() });
        var chair = await created.Content.ReadFromJsonAsync<CreateChairResponse>();
        var teacherId = await CreateTeacherAsync(admin);

        var first = await admin.Client.PostAsJsonAsync(
            $"/api/academic/chairs/{chair!.Id}/members",
            new { teacherId, role = "Assistant", sinceTermId = UnstaTerm });
        first.StatusCode.ShouldBe(HttpStatusCode.NoContent);

        var second = await admin.Client.PostAsJsonAsync(
            $"/api/academic/chairs/{chair.Id}/members",
            new { teacherId, role = "Assistant", sinceTermId = UnstaTermLater });
        second.StatusCode.ShouldBe(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task An_invalid_role_is_a_validation_error_and_not_a_crash()
    {
        var admin = await AdminAsync();

        var created = await admin.Client.PostAsJsonAsync(
            $"/api/academic/subjects/{Subject211}/chairs", new { name = UniqueName() });
        var chair = await created.Content.ReadFromJsonAsync<CreateChairResponse>();
        var teacherId = await CreateTeacherAsync(admin);

        var response = await admin.Client.PostAsJsonAsync(
            $"/api/academic/chairs/{chair!.Id}/members",
            new { teacherId, role = "Titular", sinceTermId = UnstaTerm });

        // El rol viaja como string justamente para que un typo del admin sea 400 y no el 500 que
        // produce un fallo de binding del enum.
        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }

    /// <summary>
    /// El agujero que la falta de FK cross-schema deja abierto: nada en la base impide sumar un
    /// docente de otra universidad, así que lo tiene que atajar el application layer.
    /// </summary>
    [Fact]
    public async Task A_teacher_from_another_university_is_rejected()
    {
        var admin = await AdminAsync();

        var created = await admin.Client.PostAsJsonAsync(
            $"/api/academic/subjects/{Subject211}/chairs", new { name = UniqueName() });
        var chair = await created.Content.ReadFromJsonAsync<CreateChairResponse>();

        var universities = await admin.Client.GetFromJsonAsync<List<UniversityRow>>(
            "/api/academic/universities");
        var other = universities!.First(u => u.Id != Unsta);
        var foreignTeacher = await CreateTeacherAsync(admin, other.Id);

        var response = await admin.Client.PostAsJsonAsync(
            $"/api/academic/chairs/{chair!.Id}/members",
            new { teacherId = foreignTeacher, role = "Assistant", sinceTermId = UnstaTerm });

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }

    /// <summary>
    /// E1 de US-196: "en el período siguiente sigue siendo la misma cátedra, sin recargarse de
    /// cero". Es lo único que la distingue de una comisión, que es la oferta de un cuatrimestre y
    /// muere con él, y por eso la cátedra existe como entidad propia.
    ///
    /// <para>
    /// Se prueba haciendo cruzar el borde al equipo: un integrante entra en un período y su tramo
    /// se cierra en el siguiente, y la cátedra sigue siendo <b>la misma fila, con el mismo id</b>,
    /// cargando su historia. Si alguien le colgara un período propio a la cátedra, se cae acá.
    /// </para>
    /// </summary>
    [Fact]
    public async Task A_chair_is_the_same_entity_across_periods()
    {
        var admin = await AdminAsync();
        var name = UniqueName();

        var created = await admin.Client.PostAsJsonAsync(
            $"/api/academic/subjects/{Subject211}/chairs", new { name });
        created.StatusCode.ShouldBe(HttpStatusCode.Created);
        var chair = (await created.Content.ReadFromJsonAsync<CreateChairResponse>())!;

        var teacherId = await CreateTeacherAsync(admin);

        var added = await admin.Client.PostAsJsonAsync(
            $"/api/academic/chairs/{chair.Id}/members",
            new { teacherId, role = "Lead", sinceTermId = UnstaTerm });
        added.StatusCode.ShouldBe(HttpStatusCode.NoContent);

        var closed = await admin.Client.PostAsJsonAsync(
            $"/api/academic/chairs/{chair.Id}/members/{teacherId}/close",
            new { untilTermId = UnstaTermLater });
        closed.StatusCode.ShouldBe(HttpStatusCode.NoContent);

        // Después de cruzar de un período al siguiente sigue siendo la misma cátedra, no una nueva.
        var list = await admin.Client.GetAsync($"/api/academic/chairs?subjectId={Subject211}");
        list.StatusCode.ShouldBe(HttpStatusCode.OK);
        var body = await list.Content.ReadAsStringAsync();

        body.ShouldContain(chair.Id.ToString());
        body.ShouldContain(name);
    }

    /// <summary>
    /// E2 de US-196: la cátedra recién cargada "aparece en la lista que Reseñar ofrece". Es la razón
    /// de ser de la story, porque la cátedra es lo que el alumno recuerda al reseñar.
    ///
    /// <para>
    /// Va contra el endpoint del que la pantalla de reseñar lee su lista
    /// (<c>/api/academic/subjects/{id}/chairs</c>), que es público y devuelve solo las activas: una
    /// cátedra nace activa, así que cargarla alcanza para que el alumno pueda elegirla.
    /// </para>
    /// </summary>
    [Fact]
    public async Task A_freshly_loaded_chair_is_offered_by_the_list_that_reviewing_reads()
    {
        var admin = await AdminAsync();
        var name = UniqueName();

        var created = await admin.Client.PostAsJsonAsync(
            $"/api/academic/subjects/{Subject211}/chairs", new { name });
        created.StatusCode.ShouldBe(HttpStatusCode.Created);

        // Sin cuenta: quien todavía no reseñó tiene que poder ver qué cátedras hay.
        var anonymous = _fixture.Factory.CreateClient();
        var offered = await anonymous.GetAsync($"/api/academic/subjects/{Subject211}/chairs");

        offered.StatusCode.ShouldBe(HttpStatusCode.OK);
        (await offered.Content.ReadAsStringAsync()).ShouldContain(name);
    }

    /// <summary>
    /// El edge case de US-196: "una materia con dos cátedras en paralelo, cada una con su propio
    /// equipo docente en el mismo período: se cargan como entidades separadas".
    ///
    /// <para>
    /// Distinto de que no puedan compartir nombre: acá los nombres difieren y lo que se prueba es
    /// que los equipos no se mezclen. Dos titulares vigentes en el mismo período son válidos si son
    /// de cátedras distintas, y serían un error dentro de una sola.
    /// </para>
    /// </summary>
    [Fact]
    public async Task Two_parallel_chairs_of_one_subject_keep_their_own_teams()
    {
        var admin = await AdminAsync();

        var first = (await (await admin.Client.PostAsJsonAsync(
            $"/api/academic/subjects/{Subject211}/chairs", new { name = UniqueName() }))
            .Content.ReadFromJsonAsync<CreateChairResponse>())!;
        var second = (await (await admin.Client.PostAsJsonAsync(
            $"/api/academic/subjects/{Subject211}/chairs", new { name = UniqueName() }))
            .Content.ReadFromJsonAsync<CreateChairResponse>())!;

        var firstLead = await CreateTeacherAsync(admin);
        var secondLead = await CreateTeacherAsync(admin);

        foreach (var (chairId, teacherId) in new[] { (first.Id, firstLead), (second.Id, secondLead) })
        {
            var added = await admin.Client.PostAsJsonAsync(
                $"/api/academic/chairs/{chairId}/members",
                new { teacherId, role = "Lead", sinceTermId = UnstaTerm });
            added.StatusCode.ShouldBe(HttpStatusCode.NoContent);
        }

        // Cada una con su titular vigente en el mismo período, sin que la segunda choque con la
        // primera: el titular único es invariante de UNA cátedra, no de la materia.
        var list = await admin.Client.GetAsync($"/api/academic/chairs?subjectId={Subject211}");
        var body = await list.Content.ReadAsStringAsync();

        body.ShouldContain(first.Id.ToString());
        body.ShouldContain(second.Id.ToString());
        body.ShouldContain(firstLead.ToString());
        body.ShouldContain(secondLead.ToString());
    }

    /// <summary>
    /// E3 de US-196: el equipo cargado (titular, adjunto y ayudantes) queda distinguible por nombre
    /// y rol en Catálogo, que es contra lo que se compara un pedido de verificación de cargo: "Camila
    /// compara el nombre declarado contra el nombre del adjunto que ya está cargado en Catálogo, la
    /// verificación se hace contra ese dato, nunca contra lo que la persona declara de sí misma".
    /// </summary>
    [Fact]
    public async Task The_loaded_team_is_distinguishable_by_role_and_name_for_verification()
    {
        var admin = await AdminAsync();

        var created = await admin.Client.PostAsJsonAsync(
            $"/api/academic/subjects/{Subject211}/chairs", new { name = UniqueName() });
        created.StatusCode.ShouldBe(HttpStatusCode.Created);
        var chair = (await created.Content.ReadFromJsonAsync<CreateChairResponse>())!;

        var lead = await CreateTeacherAsync(admin, firstName: "Rodrigo", lastName: "Dominguez");
        var associate = await CreateTeacherAsync(admin, firstName: "Elena", lastName: "Suarez");
        var assistantOne = await CreateTeacherAsync(admin, firstName: "Marcos", lastName: "Ibanez");
        var assistantTwo = await CreateTeacherAsync(admin, firstName: "Julia", lastName: "Vega");

        foreach (var (teacherId, role) in new[]
        {
            (lead, "Lead"),
            (associate, "Associate"),
            (assistantOne, "Assistant"),
            (assistantTwo, "Assistant"),
        })
        {
            var added = await admin.Client.PostAsJsonAsync(
                $"/api/academic/chairs/{chair.Id}/members",
                new { teacherId, role, sinceTermId = UnstaTerm });
            added.StatusCode.ShouldBe(HttpStatusCode.NoContent);
        }

        var listed = await admin.Client.GetFromJsonAsync<List<AdminChairListItem>>(
            $"/api/academic/chairs?subjectId={Subject211}");
        var team = listed!.Single(c => c.Id == chair.Id).Members;
        team.Count.ShouldBe(4);

        // El adjunto se distingue por nombre y rol de los dos ayudantes y del titular: es
        // exactamente el dato contra el que se compara un pedido de verificación de cargo.
        // El storage normaliza el nombre a minúsculas (ver DapperCatalogSearchReader, que lo
        // capitaliza recién al leer para búsqueda): la comparación es case-insensitive porque lo
        // que importa acá es que el nombre distinga al adjunto, no su capitalización.
        var associateMember = team.Single(m => m.Role == "Associate");
        associateMember.TeacherId.ShouldBe(associate);
        associateMember.FirstName.ShouldBe("Elena", StringComparer.OrdinalIgnoreCase);
        associateMember.LastName.ShouldBe("Suarez", StringComparer.OrdinalIgnoreCase);

        team.Single(m => m.Role == "Lead").TeacherId.ShouldBe(lead);
        team.Where(m => m.Role == "Assistant").Select(m => m.TeacherId)
            .ShouldBe([assistantOne, assistantTwo], ignoreOrder: true);
    }

    private async Task<Guid> CreateTeacherAsync(
        AuthenticatedClient admin, Guid? universityId = null, string? firstName = null, string? lastName = null)
    {
        universityId ??= Unsta;

        var response = await admin.Client.PostAsJsonAsync(
            "/api/academic/teachers",
            new
            {
                universityId,
                firstName = firstName ?? $"Ana{Guid.NewGuid():N}"[..12],
                lastName = lastName ?? $"Perez{Guid.NewGuid():N}"[..12],
            });
        response.StatusCode.ShouldBe(HttpStatusCode.Created);

        var created = await response.Content.ReadFromJsonAsync<TeacherRow>();
        return created!.Id;
    }

    private sealed record UniversityRow(Guid Id, string Name);

    private sealed record TeacherRow(Guid Id);
}
