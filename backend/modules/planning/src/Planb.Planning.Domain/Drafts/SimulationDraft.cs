using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Planning.Domain.Drafts;

/// <summary>
/// Aggregate root del bounded context Planning (US-023, ADR-0029). Una simulación tentativa de
/// cuatrimestre guardada por un alumno: qué materias eligió (y, opcionalmente, en qué comisión) para
/// un AcademicTerm puntual. Primera escritura de Planning: hasta acá el módulo era 100% lectura
/// (GetAvailableSubjects / EvaluateSimulation, sin DbContext).
///
/// <para>
/// Cross-BC por Guid plano, sin FK (ADR-0017): <see cref="OwnerProfileId"/> apunta a un
/// StudentProfile de Identity, <see cref="TermId"/> a un AcademicTerm de Academic, y cada
/// <see cref="SimulationDraftItem.SubjectId"/> / <see cref="SimulationDraftItem.CommissionId"/> a un
/// Subject / Commission de Academic. El application layer valida esas referencias antes de crear o
/// actualizar (que las materias pertenezcan al plan del alumno); el aggregate solo garantiza sus
/// invariantes locales (no vacío, sin materias duplicadas, label acotado).
/// </para>
///
/// <para>
/// <see cref="Visibility"/> y <see cref="SharedAt"/> viven en el modelo desde ya (para no migrar de
/// nuevo cuando aterrice), pero US-023 no expone ningún endpoint de compartir: todo borrador nace y
/// queda <see cref="SimulationVisibility.Private"/>. Compartir es US-024.
/// </para>
/// </summary>
public sealed class SimulationDraft : Entity<SimulationDraftId>, IAggregateRoot
{
    public const int MaxLabelLength = 100;

    public Guid OwnerProfileId { get; private set; }
    public Guid TermId { get; private set; }
    public string? Label { get; private set; }
    public SimulationDraftStatus Status { get; private set; }
    public SimulationVisibility Visibility { get; private set; }

    /// <summary>Cuándo pasó a Shared (US-024, <see cref="Share"/>). Null mientras Private.</summary>
    public DateTimeOffset? SharedAt { get; private set; }

    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    private readonly List<SimulationDraftItem> _items = [];

    /// <summary>Materias (+ comisión elegida opcional), cargadas eager con el aggregate (OwnsMany + AutoInclude).</summary>
    public IReadOnlyList<SimulationDraftItem> Items => _items;

    private SimulationDraft() { }

    /// <summary>
    /// Crea un borrador nuevo, privado, en estado Draft. Valida el set de items (no vacío, sin
    /// materias duplicadas) y el label antes de construir: mismo criterio que Commission.Create.
    /// </summary>
    public static Result<SimulationDraft> Create(
        Guid ownerProfileId,
        Guid termId,
        string? label,
        IEnumerable<(Guid SubjectId, Guid? CommissionId)> items,
        IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(items);
        ArgumentNullException.ThrowIfNull(clock);

        var labelValidation = ValidateLabel(label);
        if (labelValidation.IsFailure)
        {
            return labelValidation.Error;
        }

        var itemSet = BuildItemSet(items);
        if (itemSet.IsFailure)
        {
            return itemSet.Error;
        }

        var now = clock.UtcNow;
        var draft = new SimulationDraft
        {
            Id = SimulationDraftId.New(),
            OwnerProfileId = ownerProfileId,
            TermId = termId,
            Label = TrimToNull(label),
            Status = SimulationDraftStatus.Draft,
            Visibility = SimulationVisibility.Private,
            SharedAt = null,
            CreatedAt = now,
            UpdatedAt = now,
        };
        draft._items.AddRange(itemSet.Value);
        return draft;
    }

    /// <summary>
    /// Reemplazo atómico de label + items (US-023, editar). Mismo criterio que
    /// Commission.Reconfigure: valida todo (label + el set de items completo) antes de mutar, para
    /// que un set inválido no deje el aggregate mutado a medias.
    /// </summary>
    public Result Update(
        string? label,
        IEnumerable<(Guid SubjectId, Guid? CommissionId)> items,
        IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(items);
        ArgumentNullException.ThrowIfNull(clock);

        var labelValidation = ValidateLabel(label);
        if (labelValidation.IsFailure)
        {
            return labelValidation.Error;
        }

        var itemSet = BuildItemSet(items);
        if (itemSet.IsFailure)
        {
            return itemSet.Error;
        }

        Label = TrimToNull(label);
        _items.Clear();
        _items.AddRange(itemSet.Value);
        UpdatedAt = clock.UtcNow;
        return Result.Success();
    }

    /// <summary>
    /// Promueve el borrador a Active (US-023, publicar): pasa a ser el plan vigente del alumno para
    /// su término. Solo válido desde Draft. El flip del Active anterior del mismo (owner, term) es
    /// responsabilidad del handler (necesita ver otro aggregate), no de este método.
    /// </summary>
    public Result Promote(IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

        if (Status != SimulationDraftStatus.Draft)
        {
            return SimulationDraftErrors.CannotPromote;
        }

        Status = SimulationDraftStatus.Active;
        UpdatedAt = clock.UtcNow;
        return Result.Success();
    }

    /// <summary>
    /// Archiva un borrador Active (US-023): lo usa el handler de promote para reemplazar el Active
    /// anterior del mismo término por el que se está promoviendo. Solo válido desde Active.
    /// </summary>
    public Result Archive(IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

        if (Status != SimulationDraftStatus.Active)
        {
            return SimulationDraftErrors.CannotArchive;
        }

        Status = SimulationDraftStatus.Archived;
        UpdatedAt = clock.UtcNow;
        return Result.Success();
    }

    /// <summary>
    /// Comparte el borrador al corpus público (US-024): pasa <see cref="Visibility"/> a
    /// <see cref="SimulationVisibility.Shared"/> y estampa <see cref="SharedAt"/>. Los dos campos se
    /// mueven siempre juntos (constraint del data-model: shared implica SharedAt no nulo).
    ///
    /// <para>
    /// Idempotente: si ya estaba Shared, es un no-op exitoso que no vuelve a estampar
    /// <see cref="SharedAt"/> (mismo criterio que <see cref="Promote"/> sobre un draft ya Active,
    /// para no romper ante un doble-click del alumno). No reestampar importa además para el orden
    /// del feed público (US-027, <c>shared_at DESC</c>): un share repetido no debe "revivir" la
    /// posición del borrador como si se hubiese compartido recién.
    /// </para>
    /// </summary>
    public Result Share(IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

        if (Visibility == SimulationVisibility.Shared)
        {
            return Result.Success();
        }

        Visibility = SimulationVisibility.Shared;
        SharedAt = clock.UtcNow;
        UpdatedAt = clock.UtcNow;
        return Result.Success();
    }

    /// <summary>
    /// Deja de compartir el borrador (US-024): vuelve a <see cref="SimulationVisibility.Private"/> y
    /// limpia <see cref="SharedAt"/>. Idempotente: si ya estaba Private, es un no-op exitoso.
    /// </summary>
    public Result Unshare(IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

        if (Visibility == SimulationVisibility.Private)
        {
            return Result.Success();
        }

        Visibility = SimulationVisibility.Private;
        SharedAt = null;
        UpdatedAt = clock.UtcNow;
        return Result.Success();
    }

    private static Result ValidateLabel(string? label)
    {
        if (label is not null && label.Trim().Length > MaxLabelLength)
        {
            return SimulationDraftErrors.LabelTooLong;
        }
        return Result.Success();
    }

    /// <summary>Arma el set de items validando (no vacío, sin materias duplicadas) sin mutar.</summary>
    private static Result<List<SimulationDraftItem>> BuildItemSet(
        IEnumerable<(Guid SubjectId, Guid? CommissionId)> items)
    {
        var list = items.ToList();
        if (list.Count == 0)
        {
            return SimulationDraftErrors.ItemsRequired;
        }

        var result = new List<SimulationDraftItem>();
        foreach (var (subjectId, commissionId) in list)
        {
            if (result.Any(i => i.SubjectId == subjectId))
            {
                return SimulationDraftErrors.DuplicateSubject;
            }
            result.Add(new SimulationDraftItem(subjectId, commissionId));
        }
        return result;
    }

    private static string? TrimToNull(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
