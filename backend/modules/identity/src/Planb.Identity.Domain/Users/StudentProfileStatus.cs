namespace Planb.Identity.Domain.Users;

/// <summary>
/// Lifecycle del StudentProfile (US-012). Hoy solo Active. Estados como Inactive y Graduated
/// se agregan cuando los flujos de transferencia entre carreras o graduación lo requieran.
/// La constraint UNIQUE del schema filtra por Active, asi que perfiles inactivos no bloquean
/// el alta de uno nuevo activo.
/// </summary>
public enum StudentProfileStatus
{
    Active,
}
