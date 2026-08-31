using Planb.Academic.Domain.Chairs;

namespace Planb.Academic.Application.Features.AdminChairs;

/// <summary>
/// Suma un docente al equipo de una cátedra, desde un período (US-196). El "desde" no es metadata:
/// sin él, una ficha que publica reseñas de 2023 a 2026 le atribuye al titular de hoy lo que se
/// dictó hace tres años.
/// </summary>
public sealed record AddChairMemberCommand(
    Guid ChairId,
    Guid TeacherId,
    ChairMemberRole Role,
    Guid SinceTermId);
