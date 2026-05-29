namespace Planb.Reviews.Application.Embeddings;

/// <summary>
/// Feature flag para el worker de embeddings. Cuando <see cref="Enabled"/> es <c>false</c> (el
/// default mientras el provider real no aterrice), el worker observa el evento, loguea, y
/// retorna sin tocar nada.
///
/// Bindea desde <c>Reviews:Embeddings</c> en appsettings:
/// <code>
/// "Reviews": {
///   "Embeddings": {
///     "Enabled": false,
///     "Model": "BAAI/bge-small-en-v1.5"
///   }
/// }
/// </code>
/// </summary>
public sealed class ReviewEmbeddingComputeOptions
{
    public const string SectionName = "Reviews:Embeddings";

    /// <summary>
    /// Master switch. Default false hasta que aterrice la US del provider de embeddings
    /// (ADR-0007 / ADR-0013).
    /// </summary>
    public bool Enabled { get; init; }

    /// <summary>
    /// Nombre del modelo a usar. Lo lee el worker para mandárselo al provider; no afecta el
    /// stub mientras esté off.
    /// </summary>
    public string? Model { get; init; }
}
