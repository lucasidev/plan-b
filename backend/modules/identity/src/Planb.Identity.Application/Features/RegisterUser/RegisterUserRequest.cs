namespace Planb.Identity.Application.Features.RegisterUser;

/// <summary>
/// <see cref="CareerPlanId"/> es opcional: la mayoría del catálogo real (R6) todavía no tiene un
/// plan relevado, y una carrera sin plan tiene que poder registrarse igual. Cuando viene
/// null, <see cref="CareerId"/> es lo único que ancla la declaración; cuando viene un plan, el
/// handler sigue derivando el career id del plan (el <see cref="CareerId"/> del request no se usa
/// en ese camino, ya validado).
/// </summary>
public sealed record RegisterUserRequest(string Email, string Password, Guid CareerId, Guid? CareerPlanId);
