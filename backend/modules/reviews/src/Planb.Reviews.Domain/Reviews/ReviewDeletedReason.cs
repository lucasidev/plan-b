namespace Planb.Reviews.Domain.Reviews;

/// <summary>
/// Why a review was soft-deleted. Persisted as text (HasConversion in EF config) so new
/// values do not require a migration.
///
/// <list type="bullet">
///   <item><c>Self</c>: the author deleted their own review (US-055).</item>
///   <item><c>Moderator</c>: reserved for moderator-initiated removal (US-051); not used
///         by US-055 but listed so the column domain is stable when that lands.</item>
/// </list>
/// </summary>
public enum ReviewDeletedReason
{
    Self,
    Moderator,
}
