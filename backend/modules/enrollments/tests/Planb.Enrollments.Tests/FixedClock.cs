using Planb.SharedKernel.Abstractions.Clock;

namespace Planb.Enrollments.Tests;

internal sealed class FixedClock : IDateTimeProvider
{
    public DateTimeOffset UtcNow { get; private set; }

    public FixedClock(DateTimeOffset initial) => UtcNow = initial;

    public void Advance(TimeSpan delta) => UtcNow = UtcNow.Add(delta);
}
