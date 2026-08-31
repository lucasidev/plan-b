using Dapper;
using Planb.Identity.Application.Abstractions.Reading;
using Planb.Identity.Application.Features.GetMyTeacherClaims;
using Planb.Identity.Application.Features.GetStudentProfile;
using Planb.Identity.Domain.Users;
using Planb.SharedKernel.Abstractions.Persistence;

namespace Planb.Identity.Infrastructure.Reading;

/// <summary>
/// Dapper-backed read service para Identity (ADR-0018: writes via EF + repositorios, reads
/// complejos via Dapper que devuelven primitivos / DTOs planos sin pasar por aggregate).
///
/// Hoy expone una sola query (US-022). La abstracción acepta más reads complejos (user
/// listings con filtros, audit queries, etc.) sin acoplarse a EF.
/// </summary>
internal sealed class DapperIdentityReadService : IIdentityReadService
{
    private readonly IDbConnectionFactory _connections;

    public DapperIdentityReadService(IDbConnectionFactory connections) =>
        _connections = connections;

    public async Task<IReadOnlyList<UserId>> GetUnverifiedExpirationCandidatesAsync(
        DateTimeOffset cutoff,
        CancellationToken ct = default)
    {
        // Cualquier user creado antes del cutoff que aún no se verificó, no está disabled y no
        // está expirado todavía. El partial unique index en email garantiza que como mucho hay
        // un activo por email; si Lucia se registró 2 veces, la primera ya está expired y este
        // query la ignora correctamente.
        const string sql = @"
            SELECT id
            FROM identity.users
            WHERE email_verified_at IS NULL
              AND disabled_at IS NULL
              AND expired_at IS NULL
              AND created_at <= @Cutoff;";

        using var db = _connections.Create();
        var ids = await db.QueryAsync<Guid>(
            new CommandDefinition(sql, new { Cutoff = cutoff }, cancellationToken: ct));

        return ids.Select(id => new UserId(id)).ToList();
    }

    public async Task<StudentProfileResponse?> GetStudentProfileByUserIdAsync(
        UserId userId,
        CancellationToken ct = default)
    {
        // El modelo tiene 1 StudentProfile activo por user (UNIQUE constraint en user_id
        // filtrado por status='Active', y de hecho enforce 1-a-1 a nivel aggregate en
        // User.AddStudentProfile). Si en algún momento permitimos múltiples (cambio de carrera
        // con histórico), este endpoint cambia a devolver el "current" según un campo nuevo.
        // ORDER BY + LIMIT 1: con el invariante de arriba no debería haber más de una fila
        // activa, pero un LIMIT 1 sin ORDER BY es una bomba silenciosa (Postgres no garantiza
        // qué fila devuelve si el invariante alguna vez se rompe de nuevo, como pasó con el
        // índice viejo por carrera). DESC porque ante dos filas activas el perfil más nuevo es
        // la señal más consistente con "lo último que la cuenta declaró".
        // US-047: el SELECT trae también los nuevos campos editables del perfil + JOIN con
        // users para el header de Mi perfil (email + "miembro desde"). Filtramos por user
        // no-deactivated y profile activo (status='Active') para no devolver basura post-deactivate.
        // Cross-schema read-projection JOIN a academic para resolver los nombres de display
        // (universidad + carrera) que el chrome del alumno necesita, en vez de hardcodear
        // "UNSTA · Lic. Sistemas". Mismo patrón que el browse de reviews (que joinea
        // academic.subjects): un read service puede joinear cross-schema para display, sin pasar
        // por el contract (que es para handlers / business reads). LEFT JOIN defensivo: un
        // profile con career colgado igual devuelve el resto.
        const string sql = @"
            SELECT
                sp.id                  AS Id,
                sp.user_id             AS UserId,
                sp.career_id           AS CareerId,
                sp.career_plan_id      AS CareerPlanId,
                sp.enrollment_year     AS EnrollmentYear,
                sp.status              AS Status,
                sp.display_name        AS DisplayName,
                sp.year_of_study       AS YearOfStudy,
                sp.legajo              AS Legajo,
                sp.regular_student     AS RegularStudent,
                sp.updated_at          AS UpdatedAt,
                u.email                AS Email,
                u.created_at           AS MemberSince,
                c.name                 AS CareerName,
                un.id                  AS UniversityId,
                un.slug                AS UniversityShortName
            FROM identity.student_profiles sp
            INNER JOIN identity.users u ON u.id = sp.user_id
            LEFT JOIN academic.careers c ON c.id = sp.career_id
            LEFT JOIN academic.universities un ON un.id = c.university_id
            WHERE sp.user_id = @UserId
              AND sp.status = 'Active'
              AND u.deactivated_at IS NULL
            ORDER BY sp.created_at DESC
            LIMIT 1;";

        using var db = _connections.Create();
        return await db.QuerySingleOrDefaultAsync<StudentProfileResponse>(
            new CommandDefinition(sql, new { UserId = userId.Value }, cancellationToken: ct));
    }

    public async Task<IReadOnlyList<TeacherClaimItem>> GetTeacherClaimsByUserAsync(
        UserId userId,
        CancellationToken ct = default)
    {
        // Cross-schema read-projection JOIN a academic.teachers para resolver el nombre del docente
        // (mismo patrón que GetStudentProfileByUserIdAsync joinea academic.careers). initcap()
        // capitaliza el storage lowercase para display. LEFT JOIN defensivo: un claim cuyo docente
        // desapareciera del catálogo igual aparece (sin nombre), no se pierde la fila.
        const string sql = @"
            SELECT
                tp.id          AS ClaimId,
                tp.teacher_id  AS TeacherId,
                initcap(t.first_name || ' ' || t.last_name) AS TeacherName,
                t.title        AS TeacherTitle,
                (tp.verified_at IS NOT NULL) AS IsVerified,
                tp.institutional_email AS InstitutionalEmail,
                tp.created_at  AS CreatedAt
            FROM identity.teacher_profiles tp
            LEFT JOIN academic.teachers t ON t.id = tp.teacher_id
            WHERE tp.user_id = @UserId
            ORDER BY tp.created_at DESC;";

        using var db = _connections.Create();
        var rows = await db.QueryAsync<TeacherClaimItem>(
            new CommandDefinition(sql, new { UserId = userId.Value }, cancellationToken: ct));

        return rows.ToList();
    }
}
