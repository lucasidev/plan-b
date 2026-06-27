using Planb.Identity.Domain.TeacherProfiles.Events;
using Planb.Identity.Domain.Users;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Identity.Domain.TeacherProfiles;

/// <summary>
/// Aggregate root del reclamo de identidad docente (US-030). Un <see cref="User"/> con role=Member
/// reclama ser un <c>Teacher</c> del catálogo Academic; el profile nace pending y solo desbloquea la
/// capability <c>review:respond</c> (US-040) cuando se verifica (email institucional US-031 o
/// aprobación manual del admin). El estado conceptual (pending / verified) se deriva de los campos,
/// no hay columna <c>status</c> (ver verification-flows.md).
///
/// <para>
/// Por qué aggregate propio y no child de <see cref="User"/> (a diferencia de StudentProfile): el
/// invariante <c>UNIQUE(teacher_id) WHERE verified_at IS NOT NULL</c> (un docente tiene a lo sumo un
/// profile verificado) abarca profiles de <b>distintos</b> users, así que no es enforceable dentro
/// del boundary de un solo User. Además la verificación manual (UC-066) actúa sobre el profile sin
/// cargar al User que lo reclamó.
/// </para>
///
/// <para>
/// <see cref="TeacherId"/> es un UUID crudo (cross-BC, sin FK Postgres; ADR-0017). Que apunte a un
/// docente real y activo lo valida el handler vía <c>IAcademicQueryService</c> antes de invocar el
/// factory; los invariantes de rol / verificación del User (solo members verificados pueden
/// reclamar, ADR-0008) también viven en el handler porque el User es un aggregate aparte.
/// </para>
/// </summary>
public sealed class TeacherProfile : Entity<TeacherProfileId>, IAggregateRoot
{
    public UserId UserId { get; private set; }
    public Guid TeacherId { get; private set; }
    public DateTimeOffset? VerifiedAt { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    /// <summary>
    /// El profile está verificado (habilita US-040). Estado derivado: no hay enum dedicado, el
    /// estado conceptual sale de la combinación de campos (verification-flows.md).
    /// </summary>
    public bool IsVerified => VerifiedAt is not null;

    private TeacherProfile() { }

    /// <summary>
    /// Inicia el claim (US-030): crea el profile en estado pending. El caller (handler) ya validó
    /// que el user sea un member verificado y activo, que el docente exista y esté activo en el
    /// catálogo, y que no haya un claim previo del mismo user al mismo docente.
    /// </summary>
    public static TeacherProfile InitiateClaim(UserId userId, Guid teacherId, IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

        var now = clock.UtcNow;
        var profile = new TeacherProfile
        {
            Id = TeacherProfileId.New(),
            UserId = userId,
            TeacherId = teacherId,
            VerifiedAt = null,
            CreatedAt = now,
            UpdatedAt = now,
        };

        profile.Raise(new TeacherProfileClaimInitiatedDomainEvent(profile.Id, userId, teacherId, now));
        return profile;
    }

    /// <summary>
    /// Reconstitución con Id pre-asignado, para seeder y EF rehydration. Saltea validaciones: el
    /// caller (seed cerrado o repo cargando un row) se hace responsable de datos coherentes.
    /// </summary>
    public static TeacherProfile Hydrate(
        TeacherProfileId id,
        UserId userId,
        Guid teacherId,
        DateTimeOffset? verifiedAt,
        DateTimeOffset createdAt,
        DateTimeOffset updatedAt) =>
        new()
        {
            Id = id,
            UserId = userId,
            TeacherId = teacherId,
            VerifiedAt = verifiedAt,
            CreatedAt = createdAt,
            UpdatedAt = updatedAt,
        };
}
