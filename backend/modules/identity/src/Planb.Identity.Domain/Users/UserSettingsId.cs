namespace Planb.Identity.Domain.Users;

public readonly record struct UserSettingsId(Guid Value)
{
    public static UserSettingsId New() => new(Guid.NewGuid());
}
