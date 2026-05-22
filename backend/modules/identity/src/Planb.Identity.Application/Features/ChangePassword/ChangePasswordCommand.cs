using Planb.Identity.Domain.Users;

namespace Planb.Identity.Application.Features.ChangePassword;

/// <summary>
/// Comando del PATCH /api/me/password (US-079-i). El user logueado pide rotar su contraseña.
/// El endpoint extrae el <see cref="UserId"/> del claim <c>sub</c> del JWT y arma el comando;
/// <see cref="CurrentPassword"/> y <see cref="NewPassword"/> vienen del body.
/// </summary>
public sealed record ChangePasswordCommand(
    UserId UserId,
    string CurrentPassword,
    string NewPassword);
