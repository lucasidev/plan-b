namespace Planb.Enrollments.Application.Features.HistorialImports;

/// <summary>
/// Resultado del confirm. <see cref="CreatedCount"/> es el número de <c>EnrollmentRecord</c>
/// efectivamente creados (los items que no causaron conflicto). <see cref="SkippedCount"/>
/// son los que se detectaron como duplicados (existía un record con misma triple) y se
/// respetaron sin sobrescribir.
/// </summary>
public sealed record ConfirmHistorialImportResponse(
    Guid Id,
    int CreatedCount,
    int SkippedCount);
