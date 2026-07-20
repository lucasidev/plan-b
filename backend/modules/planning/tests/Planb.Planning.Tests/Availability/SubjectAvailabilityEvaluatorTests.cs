using Planb.Planning.Domain.Availability;
using Shouldly;
using Xunit;

namespace Planb.Planning.Tests.Availability;

/// <summary>
/// La regla que decide qué puede cursar el alumno (US-016): una materia está disponible cuando todas
/// sus correlativas <c>para_cursar</c> están regularizadas o aprobadas.
/// </summary>
public class SubjectAvailabilityEvaluatorTests
{
    private readonly SubjectAvailabilityEvaluator _evaluator = new();

    // Materias del plan, nombradas para que los tests se lean solos.
    private static readonly Guid Analisis1 = Guid.NewGuid();
    private static readonly Guid Analisis2 = Guid.NewGuid();
    private static readonly Guid Algebra = Guid.NewGuid();
    private static readonly Guid Fisica = Guid.NewGuid();

    private static PrerequisiteEdge ParaCursar(Guid subject, Guid required) =>
        new(subject, required, PrerequisiteKind.ParaCursar);

    private static PrerequisiteEdge ParaRendir(Guid subject, Guid required) =>
        new(subject, required, PrerequisiteKind.ParaRendir);

    private SubjectAvailability EvaluateOne(
        Guid subjectId,
        IReadOnlyCollection<PrerequisiteEdge> prerequisites,
        IReadOnlyDictionary<Guid, SubjectProgress> progress) =>
        _evaluator.Evaluate([subjectId], prerequisites, progress).Single();

    [Fact]
    public void Materia_sin_correlativas_esta_disponible()
    {
        var result = EvaluateOne(Analisis1, [], new Dictionary<Guid, SubjectProgress>());

        result.Status.ShouldBe(AvailabilityStatus.Available);
        result.IsAvailable.ShouldBeTrue();
        result.BlockedBy.ShouldBeEmpty();
    }

    [Fact]
    public void Correlativa_aprobada_habilita_la_materia()
    {
        var result = EvaluateOne(
            Analisis2,
            [ParaCursar(Analisis2, Analisis1)],
            new Dictionary<Guid, SubjectProgress> { [Analisis1] = SubjectProgress.Approved });

        result.Status.ShouldBe(AvailabilityStatus.Available);
    }

    [Fact]
    public void Correlativa_regularizada_habilita_la_materia()
    {
        // El caso que justifica que ADR-0003 separe los dos tipos: con la cursada aprobada alcanza
        // para inscribirse a la siguiente, aunque el final siga pendiente.
        var result = EvaluateOne(
            Analisis2,
            [ParaCursar(Analisis2, Analisis1)],
            new Dictionary<Guid, SubjectProgress> { [Analisis1] = SubjectProgress.Regular });

        result.Status.ShouldBe(AvailabilityStatus.Available);
    }

    [Fact]
    public void Correlativa_nunca_cursada_bloquea_y_dice_cual_falta()
    {
        var result = EvaluateOne(
            Analisis2,
            [ParaCursar(Analisis2, Analisis1)],
            new Dictionary<Guid, SubjectProgress>());

        result.Status.ShouldBe(AvailabilityStatus.Blocked);
        result.BlockedBy.ShouldBe([Analisis1]);
    }

    [Theory]
    [InlineData(SubjectProgress.InProgress)]
    [InlineData(SubjectProgress.Failed)]
    [InlineData(SubjectProgress.Dropped)]
    public void Correlativa_sin_regularizar_bloquea(SubjectProgress progresoDeLaCorrelativa)
    {
        // Cursarla no alcanza: hasta que no la regularice, la siguiente sigue bloqueada.
        var result = EvaluateOne(
            Analisis2,
            [ParaCursar(Analisis2, Analisis1)],
            new Dictionary<Guid, SubjectProgress> { [Analisis1] = progresoDeLaCorrelativa });

        result.Status.ShouldBe(AvailabilityStatus.Blocked);
        result.BlockedBy.ShouldBe([Analisis1]);
    }

    [Fact]
    public void Con_varias_correlativas_reporta_solo_las_que_faltan()
    {
        var result = EvaluateOne(
            Fisica,
            [ParaCursar(Fisica, Analisis1), ParaCursar(Fisica, Algebra)],
            new Dictionary<Guid, SubjectProgress> { [Analisis1] = SubjectProgress.Approved });

        result.Status.ShouldBe(AvailabilityStatus.Blocked);
        result.BlockedBy.ShouldBe([Algebra]);
    }

    [Fact]
    public void Correlativa_para_rendir_no_bloquea_la_inscripcion()
    {
        // Corazón de ADR-0003: para_rendir condiciona el final, no la inscripcion. Si esto bloqueara,
        // el simulador le esconderia al alumno materias que si puede cursar.
        var result = EvaluateOne(
            Analisis2,
            [ParaRendir(Analisis2, Analisis1)],
            new Dictionary<Guid, SubjectProgress>());

        result.Status.ShouldBe(AvailabilityStatus.Available);
        result.BlockedBy.ShouldBeEmpty();
    }

    [Fact]
    public void Materia_ya_aprobada_no_se_ofrece()
    {
        var result = EvaluateOne(
            Analisis1,
            [],
            new Dictionary<Guid, SubjectProgress> { [Analisis1] = SubjectProgress.Approved });

        result.Status.ShouldBe(AvailabilityStatus.AlreadyPassed);
        result.IsAvailable.ShouldBeFalse();
    }

    [Fact]
    public void Materia_regularizada_no_se_ofrece_para_cursar_de_nuevo()
    {
        // Le falta rendir el final, no volver a cursarla: por eso no es "disponible" ni "bloqueada".
        var result = EvaluateOne(
            Analisis1,
            [],
            new Dictionary<Guid, SubjectProgress> { [Analisis1] = SubjectProgress.Regular });

        result.Status.ShouldBe(AvailabilityStatus.AlreadyRegularized);
    }

    [Fact]
    public void Materia_que_esta_cursando_no_se_ofrece()
    {
        var result = EvaluateOne(
            Analisis1,
            [],
            new Dictionary<Guid, SubjectProgress> { [Analisis1] = SubjectProgress.InProgress });

        result.Status.ShouldBe(AvailabilityStatus.InProgress);
    }

    [Theory]
    [InlineData(SubjectProgress.Failed)]
    [InlineData(SubjectProgress.Dropped)]
    public void Materia_desaprobada_o_abandonada_se_puede_recursar(SubjectProgress progreso)
    {
        var result = EvaluateOne(
            Analisis1,
            [],
            new Dictionary<Guid, SubjectProgress> { [Analisis1] = progreso });

        result.Status.ShouldBe(AvailabilityStatus.Available);
    }

    [Fact]
    public void Alumno_sin_historial_solo_ve_disponibles_las_materias_sin_correlativas()
    {
        // El caso del ingresante: arranca sin nada cursado, asi que solo puede anotarse a las que no
        // dependen de ninguna otra (tipicamente las de primer año).
        var results = _evaluator.Evaluate(
            [Analisis1, Analisis2, Algebra],
            [ParaCursar(Analisis2, Analisis1)],
            new Dictionary<Guid, SubjectProgress>());

        results.Single(r => r.SubjectId == Analisis1).Status.ShouldBe(AvailabilityStatus.Available);
        results.Single(r => r.SubjectId == Algebra).Status.ShouldBe(AvailabilityStatus.Available);
        results.Single(r => r.SubjectId == Analisis2).Status.ShouldBe(AvailabilityStatus.Blocked);
    }

    [Fact]
    public void Cadena_de_correlativas_se_habilita_de_a_una()
    {
        // A -> B -> C. Con A aprobada, B se habilita pero C sigue bloqueada por B: el evaluador no
        // propaga el cumplimiento de forma transitiva, y esta bien que no lo haga (el alumno tiene
        // que cursar B antes de C).
        var results = _evaluator.Evaluate(
            [Analisis1, Analisis2, Fisica],
            [ParaCursar(Analisis2, Analisis1), ParaCursar(Fisica, Analisis2)],
            new Dictionary<Guid, SubjectProgress> { [Analisis1] = SubjectProgress.Approved });

        results.Single(r => r.SubjectId == Analisis2).Status.ShouldBe(AvailabilityStatus.Available);

        var fisica = results.Single(r => r.SubjectId == Fisica);
        fisica.Status.ShouldBe(AvailabilityStatus.Blocked);
        fisica.BlockedBy.ShouldBe([Analisis2]);
    }
}
