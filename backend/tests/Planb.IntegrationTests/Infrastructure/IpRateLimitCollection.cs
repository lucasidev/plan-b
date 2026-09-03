using Xunit;

namespace Planb.IntegrationTests.Infrastructure;

/// <summary>
/// Agrupa las clases que pegan a forgot-password o resend-verification, cuyo rate limiter cuenta
/// por IP y comparte bucket en Redis porque WebApplicationFactory siempre reporta localhost. Se
/// serializan (DisableParallelization) porque un clear del bucket a mitad de la ventana de otra
/// clase le resetea el contador y hace caer un 429 esperado.
/// </summary>
[CollectionDefinition("IpRateLimit", DisableParallelization = true)]
public sealed class IpRateLimitCollection
{
}
