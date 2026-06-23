namespace Planb.Reviews.Application.Features.CastReviewVote;

/// <summary>
/// Estado resultante del voto, para que el cliente actualice los botones sin refetch.
/// <see cref="MyVoteIsHelpful"/>: null = el votante ya no tiene voto (toggle off), true = útil,
/// false = no útil.
/// </summary>
public sealed record CastReviewVoteResponse(
    int HelpfulCount,
    int NotHelpfulCount,
    bool? MyVoteIsHelpful);
