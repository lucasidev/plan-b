namespace Planb.IntegrationTests.Infrastructure;

/// <summary>
/// Resolves the admin Postgres connection string for integration tests.
///
/// Precedence:
/// 1. <c>INTEGRATION_TEST_PG_CONNECTION</c> env var — explicit override (e.g. for a CI job that
///    targets a different Postgres than the local default).
/// 2. <c>ConnectionStrings__Planb</c> env var — set by <c>just</c> recipes via the loaded
///    <c>.env</c>, and by the GitHub Actions workflow.
///
/// If neither is set, throws with an actionable message instead of falling back to a
/// hard-coded value. A silent fallback masks misconfigured runs as cryptic Postgres errors —
/// we'd rather fail loudly the moment a fixture is constructed.
/// </summary>
internal static class TestConnectionString
{
    public static string Resolve()
    {
        var value =
            Environment.GetEnvironmentVariable("INTEGRATION_TEST_PG_CONNECTION")
            ?? Environment.GetEnvironmentVariable("ConnectionStrings__Planb");

        if (string.IsNullOrWhiteSpace(value))
        {
            throw new InvalidOperationException(
                "Integration tests require a Postgres connection string. " +
                "Set ConnectionStrings__Planb (run via `just backend-test` to load .env), " +
                "or INTEGRATION_TEST_PG_CONNECTION to point at a custom server.");
        }

        return value;
    }
}
