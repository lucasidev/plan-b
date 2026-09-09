using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Academic.Application.Features.OfficialFacts;
using Planb.Academic.Domain.Careers;
using Planb.Academic.Domain.OfficialFacts;

namespace Planb.Academic.Application.Features.CanonicalCareerComparison;

/// <summary>
/// GET /api/academic/career-comparison?careerId={id}: Dónde estudiarla (SC-008, US-128, ADR-0090,
/// R6 tarea 5). La misma carrera canónica que <c>careerId</c>, en las instituciones de su misma
/// aglomeración, los mismos datos oficiales con la misma forma por tarjeta, sin compuesto ni
/// ganador. Pública, sin cuenta, igual que el resto del catálogo.
///
/// <para>
/// Query, no Command (mismo criterio que <see cref="GetOfficialFactsForSubjectEndpoint"/>): el
/// reader junta el grupo entero (todas las ciudades), el filtro por la ciudad de
/// <c>careerId</c> corre acá vía <see cref="CanonicalCareerComparisonPolicy"/> (dominio), y los
/// datos oficiales de cada tarjeta reusan <see cref="OfficialFactResponseMapper"/>: la misma
/// selección de "vigente por campo" que la ficha de carrera, para que ninguna tarjeta muestre un
/// dato con una regla distinta a la de su propia ficha.
/// </para>
/// </summary>
public sealed class GetCanonicalCareerComparisonEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/academic/career-comparison", async (
            Guid? careerId,
            ICanonicalCareerComparisonReader groupReader,
            IOfficialFactReader factReader,
            CancellationToken ct) =>
        {
            if (careerId is null || careerId == Guid.Empty)
            {
                return Results.Problem(
                    title: "academic.career_comparison.missing_career_id",
                    detail: "careerId query parameter is required.",
                    statusCode: StatusCodes.Status400BadRequest);
            }

            var group = await groupReader.GetGroupAsync(careerId.Value, ct);
            if (group is null)
            {
                return Results.NotFound();
            }

            var city = CanonicalCareerComparisonPolicy.GroupBySeedCity(group.Offerings, careerId.Value);

            var offerings = new List<CareerComparisonOfferingResponse>(city.Offerings.Count);
            foreach (var offering in city.Offerings)
            {
                var facts = await factReader.ListBySubjectAsync(
                    OfficialFactSubjectType.Offering, offering.CareerId, ct);
                var institutionFacts = await factReader.ListBySubjectAsync(
                    OfficialFactSubjectType.Institution, offering.UniversityId, ct);

                offerings.Add(new CareerComparisonOfferingResponse(
                    offering.CareerId,
                    offering.CareerName,
                    offering.UniversityId,
                    offering.UniversityName,
                    offering.AcademicUnitName,
                    offering.LocalityName,
                    InstitutionKind(institutionFacts),
                    OfficialFactResponseMapper.SelectCurrentByField(facts)));
            }

            // Alfabético por institución (US-128, E2): el orden por voces necesita el conteo de
            // reseñas por oferta, que no es parte de esta tarea; "no hay recomendado" no depende
            // de cuál de los dos criterios sea el default.
            offerings = [.. offerings.OrderBy(o => o.UniversityName, StringComparer.Ordinal)];

            return Results.Ok(new GetCanonicalCareerComparisonResponse(
                group.GroupName, city.CityLabel, city.IsProvinceFallback, offerings));
        })
        .WithName("Academic_GetCanonicalCareerComparison")
        .WithTags("Academic")
        .AllowAnonymous()
        .Produces<GetCanonicalCareerComparisonResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .Produces(StatusCodes.Status404NotFound);
    }

    /// <summary>
    /// "Pública" o "Privada" (US-128, "si es pública o privada"): el primer segmento de
    /// <c>institution_type</c>, que junto con el resto del anuario SPU viaja en un solo texto
    /// (<see cref="OfficialFactField.InstitutionType"/>). Null cuando el estado no trae un valor
    /// publicado (todavía no se relevó, o se pidió y no llegó): la tarjeta lo dice, no lo inventa.
    /// </summary>
    private static string? InstitutionKind(IReadOnlyList<OfficialFactListItem> institutionFacts)
    {
        var candidates = institutionFacts
            .Where(f => f.Field == OfficialFactField.InstitutionType)
            .ToList();

        if (candidates.Count == 0)
        {
            return null;
        }

        var current = OfficialFactCurrency.SelectCurrent(candidates);
        if (current.Status != nameof(OfficialFactStatus.Published) || current.Value is null)
        {
            return null;
        }

        return current.Value.Split(';')[0].Trim();
    }
}
