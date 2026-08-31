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

    private async Task<Guid> CreateTeacherAsync(AuthenticatedClient admin, Guid? universityId = null)
    {
        universityId ??= Unsta;

        var response = await admin.Client.PostAsJsonAsync(
            "/api/academic/teachers",
            new
            {
                universityId,
                firstName = $"Ana{Guid.NewGuid():N}"[..12],
                lastName = $"Perez{Guid.NewGuid():N}"[..12],
            });
        response.StatusCode.ShouldBe(HttpStatusCode.Created);

        var created = await response.Content.ReadFromJsonAsync<TeacherRow>();
        return created!.Id;
    }

    private sealed record UniversityRow(Guid Id, string Name);

    private sealed record TeacherRow(Guid Id);
}
