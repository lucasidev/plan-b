using Planb.SharedKernel.Primitives;

namespace Planb.Reviews.Domain.Votes;

/// <summary>
/// Strongly-typed identity para <see cref="ReviewVote"/>.
/// </summary>
public readonly record struct ReviewVoteId : IValueObject
{
    public Guid Value { get; private init; }

    public ReviewVoteId(Guid value)
    {
        if (value == Guid.Empty)
        {
            throw new ArgumentException("ReviewVoteId cannot be empty.", nameof(value));
        }
        Value = value;
    }

    public static ReviewVoteId New() => new(Guid.NewGuid());

    public override string ToString() => Value.ToString();
}
