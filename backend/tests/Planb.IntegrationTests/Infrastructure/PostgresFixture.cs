using Xunit;

namespace Planb.IntegrationTests.Infrastructure;

/// <summary>
/// Holds the admin Postgres connection string used by integration tests in this assembly.
/// Each test creates its own database inside this Postgres instance via
/// <see cref="IdentityDatabase.CreateMigratedAsync"/>, so parallel runs don't collide.
/// </summary>
public sealed class PostgresFixture : IAsyncLifetime
{
    public string AdminConnectionString { get; } = TestConnectionString.Resolve();

    public Task InitializeAsync() => Task.CompletedTask;
    public Task DisposeAsync() => Task.CompletedTask;
}

[CollectionDefinition(Name)]
public sealed class PostgresCollection : ICollectionFixture<PostgresFixture>
{
    public const string Name = "Postgres";
}
