using System.Data;
using Dapper;
using Microsoft.Extensions.Configuration;
using Npgsql;
using Planb.Reviews.Application.Abstractions.Persistence;

namespace Planb.Reviews.Infrastructure.Persistence.Queries;

/// <summary>
/// Dapper read del cuestionario vigente (US-146, ADR-0082): el instrumento con
/// <c>valid_until IS NULL</c> para ese código, con sus ítems y opciones.
///
/// <para>
/// Una sola query con dos joins y armado en memoria, en vez de una por ítem: son 14 ítems y unas 50
/// opciones, y la pantalla los pide todos juntos porque el cuestionario se responde de corrido.
/// </para>
///
/// <para>
/// La proyección NO trae <c>valence</c> a propósito: es lo que decide el rojo en la ficha, y la
/// recolección va sin alarma. Tampoco trae los ítems retirados, aunque el instrumento vigente no
/// debería ofrecerlos: el filtro por <c>i.is_active</c> es la red por si un ítem se retira sin
/// republicar el cuestionario.
/// </para>
/// </summary>
internal sealed class DapperCurrentInstrumentQueryService : ICurrentInstrumentQueryService
{
    private readonly string _connectionString;

    public DapperCurrentInstrumentQueryService(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("Planb")
            ?? throw new InvalidOperationException(
                "ConnectionStrings:Planb is required for DapperCurrentInstrumentQueryService.");
    }

    public async Task<CurrentInstrumentView?> GetCurrentAsync(
        string code, CancellationToken ct = default)
    {
        const string sql = @"
            SELECT
                ins.code           AS InstrumentCode,
                ins.version        AS Version,
                i.code             AS ItemCode,
                i.text             AS Text,
                i.help             AS Help,
                i.layer            AS Layer,
                ii.""order""       AS ItemOrder,
                o.value            AS OptionValue,
                o.label            AS OptionLabel,
                o.""order""        AS OptionOrder
            FROM reviews.instruments ins
            JOIN reviews.instrument_items ii ON ii.instrument_id = ins.id
            JOIN reviews.items i             ON i.id = ii.item_id
            JOIN reviews.item_options o      ON o.item_id = i.id
            WHERE ins.code = @Code
              AND ins.valid_until IS NULL
              AND i.is_active = true
            ORDER BY ii.""order"", o.""order"";";

        using IDbConnection db = new NpgsqlConnection(_connectionString);
        var rows = (await db.QueryAsync<InstrumentRow>(
            new CommandDefinition(sql, new { Code = code }, cancellationToken: ct))).ToList();

        if (rows.Count == 0)
        {
            return null;
        }

        var items = rows
            .GroupBy(r => new { r.ItemCode, r.Text, r.Help, r.Layer, r.ItemOrder })
            .OrderBy(g => g.Key.ItemOrder)
            .Select(g => new InstrumentItemView(
                g.Key.ItemCode,
                g.Key.Text,
                g.Key.Help,
                g.Key.Layer,
                g.OrderBy(r => r.OptionOrder)
                    .Select(r => new InstrumentOptionView(r.OptionValue, r.OptionLabel))
                    .ToList()))
            .ToList();

        return new CurrentInstrumentView(rows[0].InstrumentCode, rows[0].Version, items);
    }

    /// <summary>Fila cruda del join. Dapper la materializa por nombre de columna.</summary>
    private sealed record InstrumentRow(
        string InstrumentCode,
        short Version,
        string ItemCode,
        string Text,
        string? Help,
        string Layer,
        short ItemOrder,
        short OptionValue,
        string OptionLabel,
        short OptionOrder);
}
