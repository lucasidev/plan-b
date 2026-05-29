using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Planb.Reviews.Application.IntegrationEvents;

namespace Planb.Reviews.Application.Embeddings;

/// <summary>
/// Worker que reacciona a <see cref="ReviewPublishedIntegrationEvent"/> para computar el
/// embedding semántico de una reseña (ADR-0007: embeddings asincrónicos; ADR-0013: solo en
/// transiciones a <c>Published</c>).
///
/// <para>
/// Hoy es un stub: cuando <see cref="ReviewEmbeddingComputeOptions.Enabled"/> es <c>false</c>
/// (default), loguea el evento y retorna. El stub existe para validar el wiring end-to-end
/// (domain event, translator, integration event, handler) sin todavía depender del provider
/// de embeddings. Cuando aterrice la US específica, esta clase pasa a invocar el provider y
/// persistir el resultado en <c>review_embeddings</c>.
/// </para>
///
/// <para>
/// Wolverine lo descubre por convención (método estático <c>Handle</c>). Está separado del
/// translator para que la conexión "domain event -> integration event" siga corta y declarativa.
/// </para>
/// </summary>
public static class ReviewEmbeddingComputeHandler
{
    public static Task Handle(
        ReviewPublishedIntegrationEvent integrationEvent,
        IOptions<ReviewEmbeddingComputeOptions> options,
        ILogger<ReviewEmbeddingComputeOptions> logger,
        CancellationToken ct)
    {
        var settings = options.Value;
        if (!settings.Enabled)
        {
            logger.LogInformation(
                "ReviewEmbeddingComputeHandler skipped (feature off). ReviewId={ReviewId}",
                integrationEvent.ReviewId);
            return Task.CompletedTask;
        }

        // TODO: provider real (ADR-0007). Mientras tanto, si alguien enciende el flag sin
        // wiring del provider, loguemos warning ruidoso para que sea obvio en logs.
        logger.LogWarning(
            "ReviewEmbeddingComputeHandler enabled but no provider wired. ReviewId={ReviewId}",
            integrationEvent.ReviewId);
        return Task.CompletedTask;
    }
}
