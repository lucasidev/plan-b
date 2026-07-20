using Planb.Academic.Domain.Prerequisites;
using Planb.Academic.Domain.Subjects;
using Shouldly;
using Xunit;

namespace Planb.Academic.Tests.Prerequisites;

/// <summary>
/// La arista S → R se lee "S requiere a R". El validator rechaza la arista nueva cuando desde R ya
/// se llega a S, que es exactamente cuando se cerraría el ciclo (ADR-0003).
/// </summary>
public class PrerequisiteGraphValidatorTests
{
    private static readonly DateTimeOffset Now =
        new(2026, 3, 1, 12, 0, 0, TimeSpan.Zero);

    private readonly PrerequisiteGraphValidator _validator = new();

    // Materias del plan, nombradas como los nodos del grafo para que los tests se lean solos.
    private static readonly SubjectId A = SubjectId.New();
    private static readonly SubjectId B = SubjectId.New();
    private static readonly SubjectId C = SubjectId.New();
    private static readonly SubjectId D = SubjectId.New();

    private static Prerequisite Edge(SubjectId subject, SubjectId required, PrerequisiteType type) =>
        Prerequisite.Hydrate(subject, required, type, Now);

    [Fact]
    public void ValidateNewEdge_EmptyGraph_Succeeds()
    {
        var result = _validator.ValidateNewEdge(A, B, PrerequisiteType.ParaCursar, []);

        result.IsSuccess.ShouldBeTrue();
    }

    [Fact]
    public void ValidateNewEdge_SelfReference_Fails()
    {
        var result = _validator.ValidateNewEdge(A, A, PrerequisiteType.ParaCursar, []);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(PrerequisiteErrors.SelfReference);
    }

    [Fact]
    public void ValidateNewEdge_DirectCycle_Fails()
    {
        // Ya existe "A requiere B"; agregar "B requiere A" cierra el ciclo más corto posible.
        Prerequisite[] existing = [Edge(A, B, PrerequisiteType.ParaCursar)];

        var result = _validator.ValidateNewEdge(B, A, PrerequisiteType.ParaCursar, existing);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(PrerequisiteErrors.CycleDetected);
    }

    [Fact]
    public void ValidateNewEdge_IndirectCycle_Fails()
    {
        // A → B → C ya existe; "C requiere A" cierra el triángulo. Es el caso que la FK no puede
        // atajar y que motiva el DFS.
        Prerequisite[] existing =
        [
            Edge(A, B, PrerequisiteType.ParaCursar),
            Edge(B, C, PrerequisiteType.ParaCursar),
        ];

        var result = _validator.ValidateNewEdge(C, A, PrerequisiteType.ParaCursar, existing);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(PrerequisiteErrors.CycleDetected);
    }

    [Fact]
    public void ValidateNewEdge_LongChainCycle_Fails()
    {
        // Cadena de 4 saltos: el ciclo se detecta igual con el nodo de cierre lejos del arranque.
        Prerequisite[] existing =
        [
            Edge(A, B, PrerequisiteType.ParaCursar),
            Edge(B, C, PrerequisiteType.ParaCursar),
            Edge(C, D, PrerequisiteType.ParaCursar),
        ];

        var result = _validator.ValidateNewEdge(D, A, PrerequisiteType.ParaCursar, existing);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(PrerequisiteErrors.CycleDetected);
    }

    [Fact]
    public void ValidateNewEdge_SamePairInOtherType_Succeeds()
    {
        // El corazón de ADR-0003: para_cursar y para_rendir son grafos separados. Que A requiera a B
        // para cursar no impide que B requiera a A para rendir; no es un ciclo, son dos grafos.
        Prerequisite[] existing = [Edge(A, B, PrerequisiteType.ParaCursar)];

        var result = _validator.ValidateNewEdge(B, A, PrerequisiteType.ParaRendir, existing);

        result.IsSuccess.ShouldBeTrue();
    }

    [Fact]
    public void ValidateNewEdge_CycleOnlyInOtherType_Succeeds()
    {
        // Espejo del anterior: el ciclo existe entero en para_rendir, y no contamina para_cursar.
        Prerequisite[] existing =
        [
            Edge(A, B, PrerequisiteType.ParaRendir),
            Edge(B, C, PrerequisiteType.ParaRendir),
        ];

        var result = _validator.ValidateNewEdge(C, A, PrerequisiteType.ParaCursar, existing);

        result.IsSuccess.ShouldBeTrue();
    }

    [Fact]
    public void ValidateNewEdge_DiamondShape_Succeeds()
    {
        // A → B, A → C, B → D. Sumar C → D cierra el rombo: hay dos caminos de A a D, pero ninguno
        // vuelve sobre sí mismo. Un rombo es un DAG perfectamente válido.
        Prerequisite[] existing =
        [
            Edge(A, B, PrerequisiteType.ParaCursar),
            Edge(A, C, PrerequisiteType.ParaCursar),
            Edge(B, D, PrerequisiteType.ParaCursar),
        ];

        var result = _validator.ValidateNewEdge(C, D, PrerequisiteType.ParaCursar, existing);

        result.IsSuccess.ShouldBeTrue();
    }

    [Fact]
    public void ValidateNewEdge_SharedDependency_Succeeds()
    {
        // Dos materias distintas pueden requerir la misma correlativa (caso común: varias materias
        // de 2do año piden Análisis I).
        Prerequisite[] existing = [Edge(A, C, PrerequisiteType.ParaCursar)];

        var result = _validator.ValidateNewEdge(B, C, PrerequisiteType.ParaCursar, existing);

        result.IsSuccess.ShouldBeTrue();
    }

    [Fact]
    public void ValidateNewEdge_DisconnectedSubgraph_Succeeds()
    {
        // Una arista entre nodos que no tocan el componente existente no puede cerrar nada.
        Prerequisite[] existing = [Edge(A, B, PrerequisiteType.ParaCursar)];

        var result = _validator.ValidateNewEdge(C, D, PrerequisiteType.ParaCursar, existing);

        result.IsSuccess.ShouldBeTrue();
    }

    [Fact]
    public void ValidateNewEdge_DeepeningExistingChain_Succeeds()
    {
        // Extender la cadena hacia adelante (D requiere a C, que ya cuelga de A → B → C) es el uso
        // normal al cargar un plan; solo el sentido inverso cierra ciclo.
        Prerequisite[] existing =
        [
            Edge(A, B, PrerequisiteType.ParaCursar),
            Edge(B, C, PrerequisiteType.ParaCursar),
        ];

        var result = _validator.ValidateNewEdge(D, C, PrerequisiteType.ParaCursar, existing);

        result.IsSuccess.ShouldBeTrue();
    }
}
