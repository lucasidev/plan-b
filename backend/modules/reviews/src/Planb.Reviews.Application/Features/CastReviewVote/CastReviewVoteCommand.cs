namespace Planb.Reviews.Application.Features.CastReviewVote;

/// <summary>
/// Votar la utilidad de una reseña (helpfulness). El <see cref="VoterUserId"/> lo extrae el
/// endpoint del JWT. <see cref="IsHelpful"/> es true ("útil") o false ("no útil").
///
/// Semántica toggle (la resuelve el handler): si el votante ya tenía un voto con el mismo
/// sentido, se saca; si lo tenía con el sentido contrario, se cambia; si no tenía, se crea.
/// </summary>
public sealed record CastReviewVoteCommand(
    Guid ReviewId,
    Guid VoterUserId,
    bool IsHelpful);
