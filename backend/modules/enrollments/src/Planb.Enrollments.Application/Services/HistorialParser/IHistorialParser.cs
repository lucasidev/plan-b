using Planb.Enrollments.Domain.HistorialImports;

namespace Planb.Enrollments.Application.Services.HistorialParser;

/// <summary>
/// Port del parser heurístico. Implementación concreta es <c>HistorialParser</c> en este mismo
/// módulo Application — la interface existe para que el handler dependa de la abstracción +
/// los tests puedan inyectar fakes con outputs predecibles si hace falta.
///
/// <para>
/// El parser es <b>puro</b>: no toca DB, network, filesystem, ni reloj. Todo lo que necesita
/// se pasa por parámetro. Devuelve el <see cref="HistorialImportPayload"/> listo para guardar
/// en el aggregate.
/// </para>
/// </summary>
public interface IHistorialParser
{
    HistorialImportPayload Parse(string rawText, HistorialParserInputs inputs);
}
