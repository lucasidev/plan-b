namespace Planb.Identity.Application.Features.GetMyTeacherClaims;

/// <summary>
/// Una fila del listado "mis claims docentes" (US-030). Cruza el TeacherProfile del user con el
/// docente del catálogo Academic para mostrar el nombre (en title case; el storage es lowercase) +
/// el estado de verificación. Caller: la página /teacher-claim del frontend.
///
/// <para>
/// Property-init (sin constructor positional) para que Dapper materialice el record con el
/// parameterless constructor que genera el compiler. El constructor positional falla con los
/// campos nullable (<see cref="TeacherTitle"/>) porque Dapper no resuelve nullables a través del
/// matching de signature; con property-init usa el setter por nombre de columna. Mismo criterio que
/// <c>StudentProfileResponse</c>.
/// </para>
/// </summary>
public sealed record TeacherClaimItem
{
    public Guid ClaimId { get; init; }
    public Guid TeacherId { get; init; }
    public string TeacherName { get; init; } = null!;
    public string? TeacherTitle { get; init; }
    public bool IsVerified { get; init; }

    /// <summary>
    /// Email institucional ingresado (US-031). Null = el claim está pending y todavía no arrancó la
    /// verificación; no-null + <see cref="IsVerified"/> false = email enviado, esperando el click.
    /// El frontend deriva el estado (pendiente / email enviado / verificado) de este par.
    /// </summary>
    public string? InstitutionalEmail { get; init; }

    public DateTimeOffset CreatedAt { get; init; }
}
