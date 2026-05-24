using Planb.Identity.Domain.Users;

namespace Planb.Identity.Application.Features.UpdateMyProfile;

/// <summary>
/// Command del PATCH /api/me/student-profile (US-047). El endpoint extrae el UserId del JWT.
/// </summary>
public sealed record UpdateMyProfileCommand(
    UserId UserId,
    string? DisplayName,
    int? YearOfStudy,
    string? Legajo,
    bool? RegularStudent);
