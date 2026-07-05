namespace Planb.IntegrationTests.Identity;

/// <summary>
/// Mirror of <c>seed-data/personas.json</c> as compile-time constants. Tests depend on
/// the seed having actually run; these constants are the contract between seed and tests.
/// If you add a persona to the JSON, mirror it here.
/// </summary>
internal static class TestPersonas
{
    public const string LuciaEmail = "lucia.mansilla@gmail.com";
    public const string LuciaPassword = "lucia.mansilla.12";

    public const string MateoEmail = "mateo.gimenez@hotmail.com";
    public const string MateoPassword = "mateo.gimenez.12";

    public const string PaulaEmail = "paula.suspendida@planb.local";
    public const string PaulaPassword = "paula.suspendida.12";

    public const string MartinEmail = "martin.pendiente@planb.local";
    public const string MartinPassword = "martin.pendiente.12";

    // Staff persona provisionada vía RegisterStaff (rol Admin, sin StudentProfile). El backoffice la
    // usa para el admin CRUD (US-063).
    public const string AdminEmail = "admin@planb.local";
    public const string AdminPassword = "admin.planb.local.12";

    // Staff persona rol Moderator (US-050/051). Opera la cola de reportes.
    public const string ModeratorEmail = "moderador@planb.local";
    public const string ModeratorPassword = "moderador.planb.local.12";
}
