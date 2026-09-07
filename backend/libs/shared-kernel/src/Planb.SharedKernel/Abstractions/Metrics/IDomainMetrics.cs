namespace Planb.SharedKernel.Abstractions.Metrics;

/// <summary>
/// Los contadores de dominio que expone <c>GET /metrics</c>: eventos de negocio, no las señales HTTP
/// genéricas (esas las cubre <c>UseHttpMetrics</c> directo en el host). Vive en
/// SharedKernel y no en el host porque los handlers que la llaman viven en los módulos y no pueden
/// referenciar <c>Planb.Api</c>; la implementación real con prometheus-net sí vive ahí
/// (<c>PrometheusDomainMetrics</c>), registrada como singleton. Para tests unitarios que no
/// necesitan verificar qué se contó, <c>NullDomainMetrics</c> no hace nada.
///
/// <para>
/// El nombre de métrica Prometheus que documenta cada método es <b>contrato para el tablero</b>:
/// cambiarlo rompe cualquier dashboard o alerta ya armada contra ese nombre, así que un rename acá es
/// una decisión deliberada, no un detalle de refactor.
/// </para>
/// </summary>
public interface IDomainMetrics
{
    /// <summary>Se publicó una reseña. Cuenta <c>planb_reviews_published_total{instrument}</c>.</summary>
    void ReviewPublished(string instrumentCode);

    /// <summary>
    /// Se calculó la ficha de una cátedra al leerla. Cuenta
    /// <c>planb_chair_facts_computed_total{published="true|false"}</c>. Cruzar el piso no es un
    /// evento del dominio sino una comparación que se recalcula en cada lectura
    /// (<c>ChairFactsCalculator</c>), así que la señal de cuántas fichas se sirven publicadas
    /// contra cuántas todavía juntan reseñas sale de acá.
    /// </summary>
    void ChairFactsComputed(bool published);

    /// <summary>
    /// Un intento de inicio de sesión, exitoso o no. Cuenta
    /// <c>planb_sign_in_attempts_total{result="success|failure"}</c>.
    /// </summary>
    void SignInAttempt(bool succeeded);

    /// <summary>Se publicó una nota editorial. Cuenta <c>planb_editorial_notes_published_total</c>.</summary>
    void EditorialNotePublished();
}
