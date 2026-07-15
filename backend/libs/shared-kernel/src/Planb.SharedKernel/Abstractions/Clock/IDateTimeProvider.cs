namespace Planb.SharedKernel.Abstractions.Clock;

/// <summary>
/// Abstrae la hora actual para que los handlers sean testeables e independientes del tiempo.
/// Nunca usar DateTime.UtcNow directo en código de dominio/aplicación.
/// </summary>
public interface IDateTimeProvider
{
    DateTimeOffset UtcNow { get; }
}

public sealed class SystemDateTimeProvider : IDateTimeProvider
{
    public DateTimeOffset UtcNow => DateTimeOffset.UtcNow;
}
