namespace Planb.Reviews.Application.Abstractions.Persistence;

/// <summary>
/// El campo libre, para que el equipo lo lea ([ADR-0084](../../../../../../docs/decisions/0084-free-text-feeds-curation-and-is-never-published.md)).
///
/// <para>
/// El ADR le prometió al campo libre dos salidas (destilar ítems nuevos y escribir notas
/// editoriales) y ninguna de las dos se puede hacer sin leerlo primero. Hasta acá lo único que lo
/// leía era su propio autor, en Mis aportes: el equipo no tenía forma de ver lo que la gente
/// escribía, así que la curaduría existía solo en el papel.
/// </para>
///
/// <para>
/// <b>Sin la cuenta de quien escribió.</b> No es una omisión del SELECT que alguien pueda deshacer
/// mañana agregando una columna: leerlo con nombre convertiría un insumo interno en un registro de
/// quién dijo qué, que es exactamente lo que el producto promete no tener. El contexto que sí
/// viaja (materia, cátedra, período) es el que hace legible el texto, y es el mismo que la ficha
/// publica agregado.
/// </para>
/// </summary>
public interface IFreeTextQueryService
{
    /// <summary>
    /// Los textos libres cargados, del más nuevo al más viejo. Devuelve ids del catálogo y no
    /// nombres: los compone el handler pidiéndoselos a academic por contrato (ADR-0087).
    /// </summary>
    /// <param name="skip">Cuántos saltear. La curaduría se lee de a tandas, no de una sentada.</param>
    /// <param name="take">Cuántos traer.</param>
    Task<FreeTextPage> ListAsync(int skip, int take, CancellationToken ct = default);
}

/// <summary>
/// Una tanda de textos, con el total para que la pantalla sepa cuánto queda sin traérselo todo.
/// </summary>
public sealed record FreeTextPage(IReadOnlyList<FreeTextRow> Items, int Total);

/// <summary>
/// Un texto libre como lo guarda este módulo. <b>No trae la cuenta</b>, y esa ausencia es el
/// contrato: lo que se lee es lo que alguien escribió, no quién lo escribió.
/// </summary>
public sealed record FreeTextRow(
    Guid ReviewId,
    Guid SubjectId,
    Guid TermId,
    Guid? ChairId,
    string Text,
    DateTimeOffset WrittenAt);
