namespace Planb.Planning.Domain.Availability;

/// <summary>
/// Estado del alumno en una materia, traducido desde su historial (Enrollments).
///
/// <para>
/// Es un tipo propio de Planning y no el enum de Enrollments a propósito: Planning no referencia el
/// dominio de otros módulos (ADR-0017), y además acá solo importa lo que cambia la decisión de "puedo
/// cursar esto", no todos los matices del historial. La traducción desde
/// <c>EnrollmentStatus</c> la hace el read model.
/// </para>
/// </summary>
public enum SubjectProgress
{
    /// <summary>Sin registro en el historial: nunca la cursó.</summary>
    NotStarted = 0,

    /// <summary>La está cursando ahora (<c>Cursando</c>).</summary>
    InProgress = 1,

    /// <summary>Cursada aprobada, final pendiente (<c>Regular</c>). Ya habilita correlativas para cursar.</summary>
    Regular = 2,

    /// <summary>Final aprobado o equivalencia (<c>Aprobada</c>).</summary>
    Approved = 3,

    /// <summary>La cursó y no la aprobó (<c>Reprobada</c>). Puede recursarla.</summary>
    Failed = 4,

    /// <summary>La abandonó (<c>Abandonada</c>). Puede recursarla.</summary>
    Dropped = 5,
}
