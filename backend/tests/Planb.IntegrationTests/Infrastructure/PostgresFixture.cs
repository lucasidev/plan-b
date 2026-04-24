using Xunit;

namespace Planb.IntegrationTests.Infrastructure;

/// <summary>
/// Resolves the admin Postgres connection string used by integration tests.
///
/// Source of truth, in order:
/// 1. <c>INTEGRATION_TEST_PG_CONNECTION</c> env var — explicit override.
/// 2. <c>ConnectionStrings__Planb</c> env var — set by <c>just</c> recipes (loads <c>.env</c>).
/// 3. CI default (Postgres GitHub Actions service on localhost).
///
/// Each test creates its own database inside this Postgres instance via
/// <see cref="IdentityDatabase.CreateMigratedAsync"/>, so parallel runs don't collide.
/// </summary>
public sealed class PostgresFixture : IAsyncLifetime
{
    private const string CiFallback =
        "Host=localhost;Port=5432;Database=postgres;Username=planb;Password=planb_test";

    public string AdminConnectionString { get; } =
        Environment.GetEnvironmentVariable("INTEGRATION_TEST_PG_CONNECTION")
        ?? Environment.GetEnvironmentVariable("ConnectionStrings__Planb")
        ?? CiFallback;

    public Task InitializeAsync() => Task.CompletedTask;
    public Task DisposeAsync() => Task.CompletedTask;
}

[CollectionDefinition(Name)]
public sealed class PostgresCollection : ICollectionFixture<PostgresFixture>
{
    public const string Name = "Postgres";
}
