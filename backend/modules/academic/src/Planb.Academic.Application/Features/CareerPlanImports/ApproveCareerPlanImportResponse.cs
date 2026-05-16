namespace Planb.Academic.Application.Features.CareerPlanImports;

/// <summary>
/// Resultado del approve. <see cref="CareerPlanId"/> es el plan recién creado, que el frontend
/// usa para volver al onboarding paso 2 y completar el StudentProfile.
/// <see cref="CareerId"/> también para que el cliente lo refleje en su state local sin
/// roundtrip extra. <see cref="SubjectCount"/> para mostrar feedback ("creamos 32 materias").
/// </summary>
public sealed record ApproveCareerPlanImportResponse(
    Guid CareerPlanId,
    Guid CareerId,
    int SubjectCount);
