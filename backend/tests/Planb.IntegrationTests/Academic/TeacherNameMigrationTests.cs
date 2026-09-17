using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.Extensions.DependencyInjection;
using Planb.Academic.Domain.Teachers;
using Planb.Academic.Infrastructure.Persistence;
using Planb.IntegrationTests.Infrastructure;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Academic;

/// <summary>
/// La migración de R7 conserva cómo se publicaban las filas creadas cuando <c>Teacher</c> bajaba
/// los nombres a minúsculas. No recupera el casing original, que ya no estaba en la base.
/// </summary>
public class TeacherNameMigrationTests : IClassFixture<RegisterApiFixture>
{
    private const string MigrationId = "20260917021121_PreserveLegacyTeacherNameDisplay";
    private static readonly TeacherId LegacyTeacher =
        new(Guid.Parse("00000006-0000-4000-a000-00000000000d"));
    private static readonly TeacherId MixedCaseTeacher =
        new(Guid.Parse("00000006-0000-4000-a000-00000000000c"));

    private readonly RegisterApiFixture _fixture;

    public TeacherNameMigrationTests(RegisterApiFixture fixture) => _fixture = fixture;

    [Fact]
    public async Task Legacy_lowercase_names_keep_their_published_display_and_search_stays_normalized()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AcademicDbContext>();
        var migrations = db.Database.GetMigrations().ToList();
        var index = migrations.IndexOf(MigrationId);
        index.ShouldBeGreaterThan(0, "la migración de display de docentes debe seguir en el historial");

        var migrator = db.Database.GetService<IMigrator>();
        await migrator.MigrateAsync(migrations[index - 1]);

        await db.Database.ExecuteSqlRawAsync(
            """
            UPDATE academic.teachers
            SET
                first_name = CASE id
                    WHEN '00000006-0000-4000-a000-00000000000d' THEN 'sergio'
                    WHEN '00000006-0000-4000-a000-00000000000c' THEN 'DeStage'
                END,
                last_name = CASE id
                    WHEN '00000006-0000-4000-a000-00000000000d' THEN 'ruiz'
                    WHEN '00000006-0000-4000-a000-00000000000c' THEN 'McDonald'
                END
            WHERE id IN (
                '00000006-0000-4000-a000-00000000000d',
                '00000006-0000-4000-a000-00000000000c'
            );
            """);

        await migrator.MigrateAsync();
        db.ChangeTracker.Clear();

        var teachers = await db.Teachers.AsNoTracking()
            .Where(teacher => teacher.Id == LegacyTeacher || teacher.Id == MixedCaseTeacher)
            .ToDictionaryAsync(teacher => teacher.Id);

        teachers[LegacyTeacher].FirstName.ShouldBe("Sergio");
        teachers[LegacyTeacher].LastName.ShouldBe("Ruiz");
        teachers[MixedCaseTeacher].FirstName.ShouldBe("DeStage");
        teachers[MixedCaseTeacher].LastName.ShouldBe("McDonald");

        using var client = _fixture.Factory.CreateClient();
        var legacySearch = await client.GetOkAsync<SearchResponse>("/api/search?q=rUiZ");
        legacySearch.Items.ShouldContain(
            item => item.Id == LegacyTeacher.Value && item.Label == "Sergio Ruiz");

        var mixedCaseSearch = await client.GetOkAsync<SearchResponse>("/api/search?q=mcdonald");
        mixedCaseSearch.Items.ShouldContain(
            item => item.Id == MixedCaseTeacher.Value && item.Label == "DeStage McDonald");
    }

    private sealed record SearchResponse(IReadOnlyList<SearchItem> Items);
    private sealed record SearchItem(string Type, Guid Id, string Label, string? Sublabel);
}
