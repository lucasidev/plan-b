namespace Planb.Enrollments.Application.Features.HistorialImports;

/// <summary>
/// Query del GET /api/me/historial-imports/{id}. Resuelve ownership (el import tiene que
/// pertenecer al StudentProfile del user autenticado) y devuelve el DTO listo para serializar.
///
/// Lo usa el frontend para polling: hace GET cada N segundos hasta ver Status=Parsed (preview
/// disponible), Failed (mostrar error + reintentar) o Confirmed (terminal, redirigir).
/// </summary>
public sealed record GetHistorialImportQuery(Guid UserId, Guid ImportId);
