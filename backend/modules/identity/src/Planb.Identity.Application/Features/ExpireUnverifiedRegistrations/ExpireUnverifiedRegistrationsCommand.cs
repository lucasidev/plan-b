namespace Planb.Identity.Application.Features.ExpireUnverifiedRegistrations;

/// <summary>
/// Comando disparado por el scheduled job diario (US-022). Sin parámetros porque la cutoff de
/// 7 días la fija el handler usando el clock; el cron sólo decide cuándo correr.
/// </summary>
public sealed record ExpireUnverifiedRegistrationsCommand;
