namespace Planb.Academic.Application.Features.AdminSubjects;

/// <summary>Materia que declara a la desactivada como correlativa (US-062, para el 409 has_dependents).</summary>
public sealed record SubjectDependentItem(Guid Id, string Code, string Name);

/// <summary>
/// Resultado del intento de desactivar una materia (US-062). Cuando <see cref="Deactivated"/> es
/// false, la materia NO se tocó: otras materias la declaran correlativa (<see cref="Dependents"/>
/// trae cuáles, con <see cref="Code"/> el código de error para que el endpoint arme el 409) y el
/// admin tiene que reasignarlas antes de poder desactivarla. Este outcome viaja como el valor de
/// éxito del Result (no como Error): el listado de dependientes no entra en el shape fijo
/// (Code, Message, Type) de <c>Error</c>, así que la decisión de status HTTP queda en el endpoint.
/// </summary>
public sealed record DeactivateSubjectResponse(
    bool Deactivated, string? Code, IReadOnlyList<SubjectDependentItem> Dependents);
