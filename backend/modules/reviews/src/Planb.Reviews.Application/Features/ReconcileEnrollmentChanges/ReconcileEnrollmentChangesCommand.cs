namespace Planb.Reviews.Application.Features.ReconcileEnrollmentChanges;

/// <summary>
/// Barrido de recuperación del evento de edición de cursada (US-015, ADR-0063): busca reseñas
/// publicadas cuya cursada volvió a estar en curso y les aplica la cuarentena que el evento no
/// llegó a aplicar.
///
/// <para>
/// <b>Por qué existe.</b> El outbox durable de Wolverine garantiza que el evento se persista en la
/// misma transacción que el cambio de la cursada, así que no se puede perder entre el commit y la
/// cola. Lo que no cubre es el otro extremo: si el consumer falla repetidamente, Wolverine agota
/// los reintentos y manda el mensaje al dead-letter. Ahí la reseña queda publicada hablando de una
/// cursada que ya no terminó, para siempre y en silencio.
/// </para>
///
/// <para>
/// <b>Por qué no es un flag.</b> El AC de US-015 proponía marcar la reseña con
/// <c>needs_revalidation</c> cuando el evento fallara. Eso no puede funcionar: si el evento no
/// llega, Reviews no se entera, y Reviews es justamente quien tendría que poner la marca. La
/// inconsistencia hay que <b>derivarla del dato</b> (una reseña publicada cuya cursada está en
/// curso es contradictoria por definición) en vez de depender de que alguien la haya marcado. Un
/// flag puede quedar sin escribir; el dato no puede mentir sobre sí mismo.
/// </para>
///
/// <para>
/// No lleva parámetros: es un barrido completo, y no es un command sobre un recurso puntual.
/// </para>
/// </summary>
public sealed record ReconcileEnrollmentChangesCommand();
