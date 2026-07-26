using Planb.SharedKernel.Primitives;

namespace Planb.Planning.Domain.Drafts;

/// <summary>
/// Strongly-typed identifier para <see cref="SimulationDraft"/> (US-023). Mismo patrón que
/// CommissionId (Academic) / ReviewReportId (Moderation).
/// </summary>
public readonly record struct SimulationDraftId : IValueObject
{
    public Guid Value { get; private init; }

    public SimulationDraftId(Guid value)
    {
        if (value == Guid.Empty)
        {
            throw new ArgumentException("SimulationDraftId cannot be empty.", nameof(value));
        }
        Value = value;
    }

    public static SimulationDraftId New() => new(Guid.NewGuid());

    public override string ToString() => Value.ToString();
}
