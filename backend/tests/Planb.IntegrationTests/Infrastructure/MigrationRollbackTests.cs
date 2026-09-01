using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.Extensions.DependencyInjection;
using Planb.Academic.Infrastructure.Persistence;
using Planb.Identity.Infrastructure.Persistence;
using Planb.Reviews.Infrastructure.Persistence;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Infrastructure;

/// <summary>
/// La última migración de cada módulo se puede revertir y volver a aplicar.
///
/// <para>
/// Existe porque el rollback de schema es la única maniobra de emergencia que el runbook ofrece
/// (<c>docs/engineering/rollback.md</c>) y hasta acá nada la probaba: ese mismo documento declaraba
/// que un <c>Down()</c> correcto era "responsabilidad del autor de la migración". Un <c>Down()</c>
/// mal escrito no rompe nada hasta el día que hace falta, que es el peor día para descubrirlo.
/// </para>
///
/// <para>
/// <b>Qué cubre y qué no.</b> Cubre la migración <b>más nueva</b> de cada módulo, que es la que
/// nadie corrió nunca hacia atrás. No re-verifica las viejas: una vez que otra migración se apila
/// encima, su <c>Down()</c> deja de ser el que este test ejercita. Es deliberado: el riesgo está
/// en la que se acaba de escribir, y revertir el historial entero en cada corrida costaría minutos
/// para proteger un camino que ya se ejercitó cuando era nueva.
/// </para>
///
/// <para>
/// Va en su propia clase para tener su propia base: revertir y reaplicar deja el schema donde
/// estaba, pero mientras tanto la tabla no existe, y compartir base con otros tests los haría
/// depender del orden.
/// </para>
/// </summary>
public class MigrationRollbackTests : IClassFixture<RegisterApiFixture>
{
    private readonly RegisterApiFixture _fixture;

    public MigrationRollbackTests(RegisterApiFixture fixture) => _fixture = fixture;

    [Fact]
    public async Task The_newest_migration_of_each_module_rolls_back_and_reapplies()
    {
        using var scope = _fixture.Factory.Services.CreateScope();

        await RoundTripAsync<IdentityDbContext>(scope);
        await RoundTripAsync<AcademicDbContext>(scope);
        await RoundTripAsync<ReviewsDbContext>(scope);
    }

    /// <summary>
    /// Revierte hasta la anteúltima migración (lo que corre el <c>Down()</c> de la última) y vuelve
    /// a aplicar. Si el <c>Down()</c> está mal escrito, la primera llamada tira.
    /// </summary>
    private static async Task RoundTripAsync<TContext>(IServiceScope scope)
        where TContext : DbContext
    {
        var db = scope.ServiceProvider.GetRequiredService<TContext>();
        var migrations = db.Database.GetMigrations().ToList();

        // Con una sola migración no hay "anterior" a la que volver, y revertir a cero borraría el
        // schema entero para probar un Down que nunca se va a correr en ese estado.
        migrations.Count.ShouldBeGreaterThan(
            1, $"{typeof(TContext).Name} tendría que tener más de una migración");

        var previous = migrations[^2];
        var migrator = db.Database.GetService<IMigrator>();

        await migrator.MigrateAsync(previous);
        await migrator.MigrateAsync();

        // Y quedó donde estaba: la última aplicada vuelve a ser la última definida.
        var applied = await db.Database.GetAppliedMigrationsAsync();
        applied.Last().ShouldBe(migrations[^1]);
    }
}
