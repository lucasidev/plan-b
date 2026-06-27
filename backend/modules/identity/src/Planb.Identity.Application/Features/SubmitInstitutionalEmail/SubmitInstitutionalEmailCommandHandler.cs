using Planb.Academic.Application.Contracts;
using Planb.Identity.Application.Abstractions.Email;
using Planb.Identity.Application.Abstractions.Persistence;
using Planb.Identity.Application.Abstractions.Security;
using Planb.Identity.Domain.TeacherProfiles;
using Planb.Identity.Domain.Users;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Abstractions.DomainEvents;
using Planb.SharedKernel.Primitives;

namespace Planb.Identity.Application.Features.SubmitInstitutionalEmail;

/// <summary>
/// Handler de US-031 paso 1 (ingresar email institucional). Flow:
/// <list type="number">
///   <item>Cargar el claim por id (con sus tokens). Validar ownership (el claim es del user del JWT).</item>
///   <item>Traer los dominios institucionales de la universidad del docente (cross-BC, IAcademicQueryService).</item>
///   <item>Generar token + <c>SubmitInstitutionalEmail</c> en el aggregate (valida forma del email +
///         dominio ∈ universidad, setea email + método, emite token invalidando el anterior).</item>
///   <item>Persistir, y recién después mandar el mail al email ya normalizado por el aggregate.</item>
/// </list>
/// </summary>
public static class SubmitInstitutionalEmailCommandHandler
{
    public static async Task<Result> Handle(
        SubmitInstitutionalEmailCommand command,
        ITeacherProfileRepository profiles,
        IIdentityUnitOfWork unitOfWork,
        IAcademicQueryService academic,
        ITokenGenerator tokenGenerator,
        IVerificationEmailSender emailSender,
        IDomainEventPublisher publisher,
        IDateTimeProvider clock,
        CancellationToken ct)
    {
        var profile = await profiles.FindByIdAsync(new TeacherProfileId(command.ClaimId), ct);
        if (profile is null)
        {
            return TeacherProfileErrors.ClaimNotFound;
        }
        if (profile.UserId != command.UserId)
        {
            return TeacherProfileErrors.NotClaimOwner;
        }

        var allowedDomains = await academic.GetInstitutionalEmailDomainsForTeacherAsync(
            profile.TeacherId, ct);

        var rawToken = tokenGenerator.Generate();
        var result = profile.SubmitInstitutionalEmail(
            command.Email, allowedDomains, rawToken, TimeSpan.FromHours(24), clock);
        if (result.IsFailure)
        {
            return result.Error;
        }

        await DomainEventDispatcher.DispatchAsync([profile], publisher, ct);
        await unitOfWork.SaveChangesAsync(ct);

        // El aggregate normalizó el email al validarlo; mandamos el mail a esa forma canónica.
        var recipient = EmailAddress.Create(profile.InstitutionalEmail!).Value;
        await emailSender.SendTeacherVerificationAsync(recipient, rawToken, ct);

        return Result.Success();
    }
}
