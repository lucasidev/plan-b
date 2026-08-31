using System.Data.Common;
using Npgsql;
using Planb.SharedKernel.Abstractions.Persistence;

namespace Planb.Api.Infrastructure;

/// <summary>
/// La implementación Npgsql de <see cref="IDbConnectionFactory"/>. Vive en el host y no en un
/// módulo porque es plomería de composición: el driver entra por acá y no por el shared kernel,
/// que referencia el dominio.
///
/// <para>
/// Falla al construirse y no al primer query. Antes cada servicio de lectura validaba el
/// connection string en su propio constructor, así que un config incompleto se manifestaba en el
/// primer request que tocaba ese servicio; registrada como singleton, la falta explota al levantar.
/// </para>
/// </summary>
internal sealed class NpgsqlConnectionFactory : IDbConnectionFactory
{
    private readonly string _connectionString;

    public NpgsqlConnectionFactory(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("Planb")
            ?? throw new InvalidOperationException(
                "ConnectionStrings:Planb is required to read from the database.");
    }

    public DbConnection Create() => new NpgsqlConnection(_connectionString);
}
