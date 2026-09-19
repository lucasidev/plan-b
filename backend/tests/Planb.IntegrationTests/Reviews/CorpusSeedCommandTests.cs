using System.Diagnostics;
using Dapper;
using Npgsql;
using Planb.IntegrationTests.Infrastructure;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Reviews;

public class CorpusSeedCommandTests
{
    /// <summary>#530: los comandos reales sobre una base vacía dejan un corpus coherente e idempotente.</summary>
    [Fact]
    public async Task Seed_db_on_an_empty_database_creates_every_author_and_can_run_twice()
    {
        var database = $"planb_corpus_command_{Guid.NewGuid():N}";
        var settings = new NpgsqlConnectionStringBuilder(TestConnectionString.Resolve()) { Database = "postgres" };
        await using var admin = new NpgsqlConnection(settings.ConnectionString);
        await admin.OpenAsync();
        await admin.ExecuteAsync($"CREATE DATABASE \"{database}\"");
        settings.Database = database;
        try
        {
            await RunCommandAsync("migrate-db", settings.ConnectionString);
            await RunCommandAsync("seed-db", settings.ConnectionString);
            await using var connection = new NpgsqlConnection(settings.ConnectionString);
            await connection.OpenAsync();
            var before = (await connection.QueryAsync<string>(
                "SELECT row_to_json(r)::text FROM reviews.reviews r ORDER BY id")).ToArray();
            before.Length.ShouldBeGreaterThan(300);
            (await connection.ExecuteScalarAsync<int>("""
                SELECT count(*)::int FROM reviews.reviews r
                LEFT JOIN identity.users u ON u.id = r.account_id
                WHERE u.id IS NULL OR u.email_verified_at IS NULL OR u.created_at >= r.created_at
                """)).ShouldBe(0);
            (await connection.ExecuteScalarAsync<int>("""
                SELECT count(*)::int FROM reviews.reviews r
                LEFT JOIN identity.student_profiles p ON p.user_id = r.account_id AND p.status = 'Active'
                JOIN academic.subjects s ON s.id = r.subject_id
                WHERE r.account_id::text LIKE '00000020-%'
                    AND p.career_plan_id IS DISTINCT FROM s.career_plan_id
                """)).ShouldBe(0);

            var accountsBefore = await connection.ExecuteScalarAsync<int>("SELECT count(*)::int FROM identity.users");
            await RunCommandAsync("seed-db", settings.ConnectionString);
            (await connection.QueryAsync<string>(
                "SELECT row_to_json(r)::text FROM reviews.reviews r ORDER BY id")).ToArray().ShouldBe(before);
            (await connection.ExecuteScalarAsync<int>("SELECT count(*)::int FROM identity.users")).ShouldBe(accountsBefore);
        }
        finally
        {
            await admin.ExecuteAsync($"DROP DATABASE \"{database}\" WITH (FORCE)");
        }
    }

    private static async Task RunCommandAsync(string command, string connectionString)
    {
        // El host usa su salida real: la carpeta de tests contiene assemblies que su .deps.json no declara.
        var testOutput = new DirectoryInfo(AppContext.BaseDirectory);
        var backend = testOutput;
        while (backend is not null && !File.Exists(Path.Combine(backend.FullName, "Planb.sln")))
            backend = backend.Parent;
        backend.ShouldNotBeNull("The command test requires the built backend checkout.");
        var hostDirectory = Path.Combine(backend.FullName, "host", "Planb.Api", "bin",
            testOutput.Parent!.Name, testOutput.Name);
        var hostAssembly = Path.Combine(hostDirectory, "Planb.Api.dll");
        File.Exists(hostAssembly).ShouldBeTrue("Build the API with the same configuration as the integration tests.");
        var start = new ProcessStartInfo("dotnet")
        {
            WorkingDirectory = hostDirectory,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true,
        };
        start.ArgumentList.Add(hostAssembly);
        start.ArgumentList.Add(command);
        start.Environment["ASPNETCORE_ENVIRONMENT"] = "Production";
        start.Environment["DOTNET_ENVIRONMENT"] = "Production";
        start.Environment["ConnectionStrings__Planb"] = connectionString;
        start.Environment["ConnectionStrings__PlanbWolverine"] = connectionString;
        using var process = Process.Start(start)!;
        var output = process.StandardOutput.ReadToEndAsync();
        var error = process.StandardError.ReadToEndAsync();
        using var timeout = new CancellationTokenSource(TimeSpan.FromMinutes(2));
        try
        {
            await process.WaitForExitAsync(timeout.Token);
        }
        catch (OperationCanceledException)
        {
            process.Kill(entireProcessTree: true);
            await process.WaitForExitAsync();
            throw;
        }
        process.ExitCode.ShouldBe(0, $"{command}: {await output}\n{await error}");
    }
}
