namespace Planb.Identity.Application.Features.AdminUsers;

// Dapper materializa los timestamps y nullables por propiedad, igual que StudentProfileResponse.
public sealed record AdminUserRow
{
    public Guid Id { get; init; }
    public string Email { get; init; } = null!;
    public DateTimeOffset CreatedAt { get; init; }
    public DateTimeOffset? EmailVerifiedAt { get; init; }
    public DateTimeOffset? DisabledAt { get; init; }
    public string? DisabledReason { get; init; }
    public string? DisplayName { get; init; }
    public Guid? CareerId { get; init; }
    public int? EnrollmentYear { get; init; }
    public string? CareerName { get; init; }
    public string? UniversityName { get; init; }
}

public sealed record AdminUserPage(IReadOnlyList<AdminUserRow> Items, int Total, int Page, int PageSize);
