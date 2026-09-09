using NSubstitute;
using Planb.Academic.Application.Contracts;
using Planb.Reviews.Application.Abstractions.Persistence;
using Planb.Reviews.Application.Features.ChairFacts;
using Planb.SharedKernel.Abstractions.Metrics;
using Planb.SharedKernel.Primitives;
using Shouldly;
using Xunit;

namespace Planb.Reviews.Tests.Features.ChairFacts;

/// <summary>
/// Handler unit tests de <see cref="GetChairFactsQueryHandler"/> acotados a lo que agregó V06
/// (recorrido de Valentina, US-134/SC-035): que <see cref="ChairDetailItem.LeadTeacherId"/> llegue
/// intacto a <see cref="GetChairFactsResponse.LeadTeacherId"/>, sin id inventado ni perdido. El
/// resto del mapeo (piso, fama, contrastes) ya lo cubre <c>ChairFactsCalculatorTests</c> como
/// dominio puro.
/// </summary>
public class GetChairFactsQueryHandlerTests
{
    private sealed record Deps(IAcademicQueryService Academic, IChairTallyQueryService Tallies);

    private static Deps NewDeps()
    {
        var academic = Substitute.For<IAcademicQueryService>();
        academic.ListChairsBySubjectAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<IReadOnlyList<ChairListItem>>([]));

        var tallies = Substitute.For<IChairTallyQueryService>();
        // Sin reseñas: el piso corta temprano (ChairFactsCalculator) y no hace falta fabricar
        // tallies para ejercitar el passthrough que este test cubre.
        tallies.GetTalliesAsync(Arg.Any<Guid>(), Arg.Any<IReadOnlyList<Guid>>(), Arg.Any<CancellationToken>())
            .Returns(new ChairTallies(
                ReviewCount: 0,
                Tallies: [],
                SiblingTallies: [],
                Completion: null,
                ItemTexts: new Dictionary<string, string>(),
                TermIds: [],
                LastReviewedAt: null));

        return new(academic, tallies);
    }

    private static Task<Result<GetChairFactsResponse>> Invoke(Deps deps, Guid chairId) =>
        GetChairFactsQueryHandler.Handle(
            new GetChairFactsQuery(chairId), deps.Academic, deps.Tallies, new NullDomainMetrics(),
            CancellationToken.None);

    private static ChairDetailItem Chair(
        Guid id, string? firstName, string? lastName, Guid? leadTeacherId) =>
        new(id, "Pérez", Guid.NewGuid(), "Fundamentos de Control de Calidad", "211",
            leadTeacherId, firstName, lastName);

    [Fact]
    public async Task Handle_ChairHasALeadTeacher_ReturnsTheTeacherId()
    {
        var deps = NewDeps();
        var chairId = Guid.NewGuid();
        var teacherId = Guid.NewGuid();
        deps.Academic.GetChairByIdAsync(chairId, Arg.Any<CancellationToken>())
            .Returns(Chair(chairId, "Martín", "Pérez", teacherId));

        var result = await Invoke(deps, chairId);

        result.IsSuccess.ShouldBeTrue();
        result.Value.LeadTeacherId.ShouldBe(teacherId);
        result.Value.LeadTeacherName.ShouldBe("Martín Pérez");
    }

    [Fact]
    public async Task Handle_ChairHasNoLeadTeacher_ReturnsNullWithoutInventingAnId()
    {
        var deps = NewDeps();
        var chairId = Guid.NewGuid();
        deps.Academic.GetChairByIdAsync(chairId, Arg.Any<CancellationToken>())
            .Returns(Chair(chairId, firstName: null, lastName: null, leadTeacherId: null));

        var result = await Invoke(deps, chairId);

        result.IsSuccess.ShouldBeTrue();
        result.Value.LeadTeacherId.ShouldBeNull();
        result.Value.LeadTeacherName.ShouldBeNull();
    }

    [Fact]
    public async Task Handle_ChairDoesNotExist_ReturnsNotFound()
    {
        var deps = NewDeps();
        var chairId = Guid.NewGuid();
        deps.Academic.GetChairByIdAsync(chairId, Arg.Any<CancellationToken>())
            .Returns((ChairDetailItem?)null);

        var result = await Invoke(deps, chairId);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(ChairFactsErrors.ChairNotFound);
    }
}
