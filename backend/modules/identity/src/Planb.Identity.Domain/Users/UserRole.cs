namespace Planb.Identity.Domain.Users;

/// <summary>
/// Mutually-exclusive user role. See ADR-0008.
/// Profiles (StudentProfile, TeacherProfile) layer capabilities on top of <see cref="Member"/>;
/// they are not roles.
/// </summary>
public enum UserRole
{
    Member,
    Moderator,
    Admin,
    UniversityStaff,
}
