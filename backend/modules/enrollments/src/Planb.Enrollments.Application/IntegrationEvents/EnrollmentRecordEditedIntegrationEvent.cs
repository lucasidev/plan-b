using Planb.SharedKernel.Abstractions.Messaging;

namespace Planb.Enrollments.Application.IntegrationEvents;

/// <summary>
/// El alumno editó una cursada de forma que invalida lo que una reseña anclada a ella afirmaba
/// (US-015, ADR-0032). Hoy eso significa un único caso: la cursada volvió a <c>Cursando</c>, así
/// que la reseña habla de algo que todavía no terminó.
///
/// <para>
/// <b>Vive en el publisher, y eso se aparta de ADR-0045 con razón.</b> Aquel ADR fija que el tipo
/// del evento vive en el bounded context que <em>recibe</em> la acción, y su restricción declarada
/// es que el grafo de assemblies quede acíclico. Acá esa regla no se puede aplicar: como una reseña
/// se ancla a una cursada, <c>Planb.Reviews.Application</c> ya referencia a
/// <c>Planb.Enrollments.Application</c>, y poner el tipo del lado de Reviews obligaría a Enrollments
/// a referenciar a Reviews, cerrando el ciclo que ADR-0045 existe para evitar.
/// </para>
///
/// <para>
/// La diferencia también es semántica, no solo de grafo. Los eventos de ADR-0045 son <em>pedidos</em>
/// ("cuarentená esta reseña"), y por eso el contrato le pertenece a quien puede cumplirlos. Este es
/// un <em>hecho</em> del dominio de Enrollments: la cursada cambió. Que Reviews reaccione es
/// decisión de Reviews, y mañana puede reaccionar otro módulo sin tocar este tipo.
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
