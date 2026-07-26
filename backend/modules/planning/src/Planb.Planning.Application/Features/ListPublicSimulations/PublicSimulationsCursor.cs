using System.Globalization;
using System.Text;

namespace Planb.Planning.Application.Features.ListPublicSimulations;

/// <summary>
/// Cursor opaco de paginación keyset para el feed público (US-027): base64 de
/// "sharedAt(round-trip)|id". No hay un patrón de cursor previo en el codebase (Reviews pagina con
/// page/pageSize, ver <c>BrowseReviewsQuery</c>); este es el primero. El cliente nunca decodifica ni
/// arma el valor: solo reenvía tal cual el <c>nextCursor</c> que ya recibió.
/// </summary>
internal static class PublicSimulationsCursor
{
    private const char Separator = '|';
    private const string SharedAtFormat = "O";

    public static string Encode(DateTimeOffset sharedAt, Guid id) =>
        Convert.ToBase64String(
            Encoding.UTF8.GetBytes(
                $"{sharedAt.ToString(SharedAtFormat, CultureInfo.InvariantCulture)}{Separator}{id:D}"));

    /// <summary>
    /// Intenta decodificar. Falso ante cualquier corrupción (base64 inválido, shape inesperado,
    /// fecha o guid que no parsean): un cursor manipulado se trata como inválido, nunca como
    /// "sin cursor" (eso lo pediría el caller mandando el parámetro ausente, no roto).
    /// </summary>
    public static bool TryDecode(string cursor, out DateTimeOffset sharedAt, out Guid id)
    {
        sharedAt = default;
        id = default;

        byte[] bytes;
        try
        {
            bytes = Convert.FromBase64String(cursor);
        }
        catch (FormatException)
        {
            return false;
        }

        var raw = Encoding.UTF8.GetString(bytes);
        var parts = raw.Split(Separator, 2);
        if (parts.Length != 2)
        {
            return false;
        }

        return DateTimeOffset.TryParseExact(
                parts[0], SharedAtFormat, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out sharedAt)
            && Guid.TryParse(parts[1], out id);
    }
}
