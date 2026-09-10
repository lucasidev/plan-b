namespace Planb.Identity.Application.Features.RegisterUser;

/// <summary>Ver <see cref="RegisterUserRequest.CareerPlanId"/>: mismo contrato, nullable.</summary>
public sealed record RegisterUserCommand(string Email, string Password, Guid CareerId, Guid? CareerPlanId);
