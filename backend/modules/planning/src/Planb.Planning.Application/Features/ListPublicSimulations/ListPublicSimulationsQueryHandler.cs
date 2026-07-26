using Planb.Identity.Application.Contracts;
using Planb.Planning.Application.Abstractions.Persistence;
using Planb.Planning.Domain.Availability;
using Planb.Planning.Domain.Drafts;
using Planb.SharedKernel.Primitives;

namespace Planb.Planning.Application.Features.ListPublicSimulations;

/// <summary>
/// Handler de US-027 (feed público). Flow:
/// <list type="number">
///   <item>Resolver el <c>StudentProfile</c> activo del user. El corpus público es para alumnos,
///         no para visitantes anónimos ni users sin profile: sin uno activo, 404 (mismo error y
///         mismo criterio que el resto del simulador).</item>
///   <item>Validar que <see cref="ListPublicSimulationsQuery.CareerPlanId"/> sea el propio plan del
///         caller. Sin este chequeo, cualquier alumno autenticado podría pedir el plan de otra
///         carrera y ver qué combinaciones comparten esos alumnos: el AC pide explícito que esto no
///         leakee cross-carrera, así que se corta con 403 antes de tocar el reader.</item>
///   <item>Decodificar el cursor opaco (si vino). Uno corrupto corta con 400 antes de pegarle a la
///         base.</item>
///   <item>Traer pageSize+1 filas del reader (Dapper cross-schema): si vuelven pageSize+1, hay más
///         página y el cursor de la siguiente se arma con el último item ya recortado a pageSize;
///         si vuelven menos, no hay next page. Evita una query de COUNT aparte.</item>
/// </list>
/// </summary>
public static class ListPublicSimulationsQueryHandler
{
    public const int PageSize = 20;

    public static async Task<Result<ListPublicSimulationsResponse>> Handle(
        ListPublicSimulationsQuery query,
        IIdentityQueryService identity,
        IPublicSimulationsReader reader,
        CancellationToken ct)
    {
        var profile = await identity.GetStudentProfileForUserAsync(query.UserId, ct);
        if (profile is null || !profile.IsActive)
        {
            return Result.Failure<ListPublicSimulationsResponse>(AvailabilityErrors.StudentProfileRequired);
        }

        if (profile.CareerPlanId != query.CareerPlanId)
        {
            return Result.Failure<ListPublicSimulationsResponse>(PublicSimulationsErrors.PlanMismatch);
        }

        DateTimeOffset? cursorSharedAt = null;
        Guid? cursorId = null;
        if (!string.IsNullOrEmpty(query.Cursor))
        {
            if (!PublicSimulationsCursor.TryDecode(query.Cursor, out var sharedAt, out var id))
            {
                return Result.Failure<ListPublicSimulationsResponse>(PublicSimulationsErrors.InvalidCursor);
            }
            cursorSharedAt = sharedAt;
            cursorId = id;
        }

        var rows = await reader.ListSharedAsync(
            query.CareerPlanId, query.TermId, cursorSharedAt, cursorId, limit: PageSize + 1, ct);

        var hasMore = rows.Count > PageSize;
        var page = hasMore ? rows.Take(PageSize).ToList() : rows;

        var items = page
            .Select(r => new PublicSimulationItem(
                r.Id, r.Label, query.TermId, r.Items, r.TotalWeeklyHours, r.AverageDifficulty))
            .ToList();

        var nextCursor = hasMore
            ? PublicSimulationsCursor.Encode(page[^1].SharedAt, page[^1].Id)
            : null;

        return new ListPublicSimulationsResponse(items, nextCursor);
    }
}
