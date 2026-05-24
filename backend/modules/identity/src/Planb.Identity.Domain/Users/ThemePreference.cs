namespace Planb.Identity.Domain.Users;

/// <summary>
/// Preferencia de tema visual. <c>Auto</c> sigue al sistema operativo
/// (resuelto en el cliente via media query); <c>Light</c> y <c>Dark</c>
/// fijan el tema independientemente del sistema.
/// </summary>
public enum ThemePreference
{
    Auto = 0,
    Light = 1,
    Dark = 2,
}
