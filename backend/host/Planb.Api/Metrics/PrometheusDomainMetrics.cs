using Planb.SharedKernel.Abstractions.Metrics;
using Prometheus;

namespace Planb.Api.Metrics;

/// <summary>
/// <see cref="IDomainMetrics"/> sobre prometheus-net: cada método incrementa el contador
/// correspondiente en el registry default, el mismo que expone <c>GET /metrics</c>
/// (<c>MapMetrics</c> en Program.cs). Un solo singleton para todo el proceso: los colectores de
/// prometheus-net son thread-safe y están pensados para vivir así.
/// </summary>
public sealed class PrometheusDomainMetrics : IDomainMetrics
{
    private readonly Counter _reviewsPublished = Prometheus.Metrics.CreateCounter(
        "planb_reviews_published_total",
        "Reseñas publicadas, por instrumento.",
        ["instrument"]);

    private readonly Counter _chairFactsComputed = Prometheus.Metrics.CreateCounter(
        "planb_chair_facts_computed_total",
        "Fichas de cátedra calculadas al leerlas, separadas por si publicaron o no.",
        ["published"]);

    private readonly Counter _signInAttempts = Prometheus.Metrics.CreateCounter(
        "planb_sign_in_attempts_total",
        "Intentos de inicio de sesión, por resultado.",
        ["result"]);

    private readonly Counter _editorialNotesPublished = Prometheus.Metrics.CreateCounter(
        "planb_editorial_notes_published_total",
        "Notas editoriales publicadas.");

    public void ReviewPublished(string instrumentCode) =>
        _reviewsPublished.WithLabels(instrumentCode).Inc();

    public void ChairFactsComputed(bool published) =>
        _chairFactsComputed.WithLabels(published ? "true" : "false").Inc();

    public void SignInAttempt(bool succeeded) =>
        _signInAttempts.WithLabels(succeeded ? "success" : "failure").Inc();

    public void EditorialNotePublished() =>
        _editorialNotesPublished.Inc();
}
