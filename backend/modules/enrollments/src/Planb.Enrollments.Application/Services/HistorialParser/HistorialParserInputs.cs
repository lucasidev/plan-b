using Planb.Academic.Application.Contracts;

namespace Planb.Enrollments.Application.Services.HistorialParser;

/// <summary>
/// Inputs que el parser necesita resueltos del lado application antes de operar. El parser
/// es puro (no toca DB ni network), así que el handler hace los reads cross-BC y le pasa
/// las listas de subjects + terms cacheadas a este record.
///
/// <para>
/// Pasar los lookups como diccionarios (no listas) ahorra alocación + complejidad en el parser:
/// hacer match O(1) por código en lugar de filtrar la lista por cada item parseado.
/// </para>
/// </summary>
public sealed record HistorialParserInputs(
    IReadOnlyDictionary<string, SubjectListItem> SubjectsByCode,
    IReadOnlyList<AcademicTermListItem> Terms);
