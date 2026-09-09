namespace Planb.Academic.Infrastructure.Georef;

/// <summary>
/// Saca el texto de localidad o de provincia de un domicilio de la Guía SIU (R6, tareas 19 y 5). El
/// patrón de la fuente es "calle numero - localidad - provincia": partir por " - " (espacio, guion,
/// espacio) no rompe con guiones pegados dentro de la calle (ej. "Sarmiento y Marconi -Bella Vista -
/// Amaicha Del Llano - Tucumán" da 3 partes igual, porque ese guion no tiene espacio de los dos lados).
/// </summary>
public static class GeorefAddressParsing
{
    private const string Separator = " - ";

    /// <summary>Null si el domicilio no tiene la forma esperada (3 partes): no hay localidad que resolver.</summary>
    public static string? ExtractLocality(string address)
    {
        var parts = address.Split(Separator, StringSplitOptions.None);
        return parts.Length == 3 ? parts[1].Trim() : null;
    }

    /// <summary>
    /// La provincia (tercera parte): el fallback de Dónde estudiarla (R6, tarea 5) cuando la
    /// localidad de la unidad académica no resolvió contra Georef. Agrupar por esto en vez de por
    /// una localidad fingida es lo que permite decir "no sabemos la ciudad" en vez de adivinarla.
    /// </summary>
    public static string? ExtractProvince(string address)
    {
        var parts = address.Split(Separator, StringSplitOptions.None);
        return parts.Length == 3 ? parts[2].Trim() : null;
    }
}
