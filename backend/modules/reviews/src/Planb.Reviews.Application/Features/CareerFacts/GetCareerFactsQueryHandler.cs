using Planb.Academic.Application.Contracts;
using Planb.Reviews.Application.Abstractions.Persistence;
using Planb.Reviews.Domain.Reviews;
using Planb.SharedKernel.Primitives;

namespace Planb.Reviews.Application.Features.CareerFacts;

/// <summary>
/// Arma la ficha de una carrera (US-134, ADR-0085): identidad más cobertura.
///
/// <para>
/// La identidad se le pide a academic por contrato, igual que en <c>SubjectFacts</c>/
/// <c>ChairFacts</c>. La cobertura no: academic no sabe de reseñas y reviews no repite el catálogo
/// de materias/cátedras solo para contar, así que sale de <see cref="ICareerCoverageQueryService"/>,
/// que cruza ambos schemas en un solo viaje (ADR-0017 lo permite para esta analítica).
/// </para>
/// </summary>
public static class GetCareerFactsQueryHandler
{
    public static async Task<Result<GetCareerFactsResponse>> Handle(
        GetCareerFactsQuery query,
        IAcademicQueryService academic,
        ICareerCoverageQueryService coverage,
        CancellationToken ct)
    {
        var career = await academic.GetCareerByIdAsync(query.CareerId, ct);
        if (career is null)
        {
            return CareerFactsErrors.CareerNotFound;
        }

        var counted = await coverage.GetCoverageAsync(
            career.Id, PublishingRules.ChairMinimumReviews, ct);

        return new GetCareerFactsResponse(
            CareerId: career.Id,
            CareerName: career.Name,
            UniversityName: career.UniversityName,
            DurationYears: career.DurationYears,
            TotalSubjects: counted.TotalSubjects,
            CoveredSubjects: counted.CoveredSubjects,
            CoveragePercent: Percent(counted.CoveredSubjects, counted.TotalSubjects));
    }

    private static int Percent(int count, int total) =>
        total <= 0 ? 0 : (int)Math.Round(100d * count / total, MidpointRounding.AwayFromZero);
}

/// <summary>Los errores de leer una ficha de carrera. Es lectura pública: el único caso es que no exista.</summary>
public static class CareerFactsErrors
{
    public static readonly Error CareerNotFound =
        Error.NotFound(
            "reviews.career_facts.career_not_found",
            "That career does not exist.");
}
