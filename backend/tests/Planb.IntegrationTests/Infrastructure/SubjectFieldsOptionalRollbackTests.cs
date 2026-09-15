using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;
using Planb.Academic.Infrastructure.Persistence;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Infrastructure;

/// <summary>
/// Contracara negativa de <see cref="MigrationRollbackTests"/>: ese test completa los datos antes de
/// revertir para poder ejercitar el <c>Down()</c> de <c>SubjectFieldsOptional</c> entero; este prueba
/// que, sin ese backfill, el freno del <c>Down()</c> (ADR-0097: no inventa código, cadencia ni horas)
/// realmente frena con las materias tal como las deja el seed.
///
/// <para>
/// Va en su propia clase, con su propia base sembrada de <see cref="RegisterApiFixture"/>: revertir
/// una migración a propósito para que falle no puede compartir base con otro test, ni depender del
/// orden en que xUnit los corra.
/// </para>
/// </summary>
public class SubjectFieldsOptionalRollbackTests : IClassFixture<RegisterApiFixture>
{
    private const string SubjectFieldsOptionalMigrationId = "20260915154516_SubjectFieldsOptional";

    private readonly RegisterApiFixture _fixture;

    public SubjectFieldsOptionalRollbackTests(RegisterApiFixture fixture) => _fixture = fixture;

    [Fact]
    public async Task Reverting_past_SubjectFieldsOptional_fails_and_leaves_it_applied_when_subjects_have_no_code()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AcademicDbContext>();

        // Por id, no por posición (migrations[^2]): así la búsqueda sigue apuntando al Down() de
        // esta migración puntual aunque el módulo sume migraciones más nuevas después.
        var migrations = db.Database.GetMigrations().ToList();
        var index = migrations.IndexOf(SubjectFieldsOptionalMigrationId);
        index.ShouldBeGreaterThan(-1, "SubjectFieldsOptional tendría que seguir en el historial");

        var previous = migrations[index - 1];
        var migrator = db.Database.GetService<IMigrator>();

        var exception = await Should.ThrowAsync<PostgresException>(
            () => migrator.MigrateAsync(previous));

        exception.SqlState.ShouldBe("P0001");
        exception.MessageText.ShouldContain("SubjectFieldsOptional");

        // El Down() tira antes de terminar: la migración sigue aplicada y el schema, sin tocar.
        var applied = await db.Database.GetAppliedMigrationsAsync();
        applied.ShouldContain(SubjectFieldsOptionalMigrationId);

        var codeIsNullable = await db.Database
            .SqlQueryRaw<string>(
                """
                SELECT is_nullable AS "Value" FROM information_schema.columns
                WHERE table_schema = 'academic' AND table_name = 'subjects' AND column_name = 'code'
                """)
            .SingleAsync();
        codeIsNullable.ShouldBe("YES");
    }
}
