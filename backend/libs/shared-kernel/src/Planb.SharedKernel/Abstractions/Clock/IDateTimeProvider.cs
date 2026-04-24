namespace Planb.SharedKernel.Abstractions.Clock;

/// <summary>
/// Abstracts the current time so handlers are testable and time-independent.
/// Never use DateTime.UtcNow directly in domain/application code.
/// </summary>
public interface IDateTimeProvider
{
    DateTimeOffset UtcNow { get; }
}

public sealed class SystemDateTimeProvider : IDateTimeProvider
{
    public DateTimeOffset UtcNow => DateTimeOffset.UtcNow;
}
