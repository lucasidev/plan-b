using Planb.SharedKernel.Abstractions.Messaging;

namespace Planb.Enrollments.Application.IntegrationEvents;

/// <summary>
/// El alumno editó una cursada de forma que invalida lo que una reseña anclada a ella afirmaba
/// (US-015, ADR-0063). Hoy eso significa un único caso: la cursada volvió a <c>Cursando</c>, así
/// que la reseña habla de algo que todavía no terminó.
///
/// <para>
/// <b>Vive en el publisher y no en el consumer, por ADR-0062.</b> Es un <em>hecho</em> del dominio
/// de Enrollments (la cursada cambió), no un <em>pedido</em> de los que gobierna ADR-0045
/// ("cuarentená esta reseña"). Que Reviews reaccione es decisión de Reviews, y mañana puede
/// reaccionar otro módulo sin tocar este tipo. Además, ubicarlo del lado de Reviews cerraría un
/// ciclo de assemblies: como una reseña se ancla a una cursada (ADR-0082),
/// <c>Planb.Reviews.Application</c> ya referencia a <c>Planb.Enrollments.Application</c>.
/// </para>
/// </summary>
/// <param name="PreviousStatus">
/// Cómo estaba la cursada antes de la edición, para que el consumer decida sin tener que
/// reconstruir el historial. Viaja como string por el mismo motivo que el resto de los eventos del
/// proyecto: el enum es un detalle interno de Enrollments.
/// </param>
public sealed record EnrollmentRecordEditedIntegrationEvent(
    Guid EventId,
    Guid EnrollmentRecordId,
    Guid StudentProfileId,
    string PreviousStatus,
    string NewStatus,
    DateTimeOffset OccurredAt) : IIntegrationEvent;
