using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Domain.OfficialFacts;

/// <summary>
/// Aggregate root para un dato oficial: una afirmación fechada, con sujeto, campo, valor con su
/// unidad, período, fuente y estado (ADR-0090). Es un ledger de solo alta: no hay método de edición
/// porque "corregir" una afirmación es cargar una nueva con una fecha de relevamiento más reciente,
/// nunca mutar la vieja (Método muestra la historia completa). <see cref="OfficialFactCurrency"/>
/// decide, de las que conviven para el mismo sujeto y campo, cuál es la vigente.
///
/// <para>
/// El sujeto se guarda como tipo (<see cref="SubjectType"/>) más id plano (<see cref="SubjectId"/>),
/// sin FK: referencia a <c>University</c>, <c>AcademicUnit</c> o <c>Career</c> según el tipo, y el
/// application layer valida su existencia antes de crear (ADR-0017, cross-aggregate).
/// </para>
/// </summary>
public sealed class OfficialFact : Entity<OfficialFactId>, IAggregateRoot, IRelievedClaim
{
    // Mismo largo que las columnas EF (OfficialFactConfiguration). Compartida por el aggregate y el
    // validator para que ninguno acepte lo que la columna despues rechaza con un 500 de Postgres.
    public const int MaxFieldLength = 60;
    public const int MaxValueLength = 2000;
    public const int MaxUnitLength = 20;
    public const int MaxPeriodLength = 120;
    public const int MaxSourceNameLength = 200;
    public const int MaxSourceUrlLength = 2000;
    public const int MaxSourceDocumentLength = 200;
    public const int MaxDerivationRuleIdLength = 60;
    public const int MaxNoteLength = 1000;

    public OfficialFactSubjectType SubjectType { get; private set; }
    public Guid SubjectId { get; private set; }

    /// <summary>Código del vocabulario curado (<see cref="OfficialFactField"/>), en inglés.</summary>
    public string Field { get; private set; } = null!;

    /// <summary>El valor tal como se publica, como texto tipado. Null cuando el estado no trae un dato (NotPublished, Requested, o NotApplicable sin valor).</summary>
    public string? Value { get; private set; }

    /// <summary>Unidad del valor cuando es numérico (years, percent, count, currency_ars). Libre: el ADR no cierra el vocabulario de unidades como sí cierra el de campos.</summary>
    public string? Unit { get; private set; }

    /// <summary>A qué período refiere el dato (un año, un rango, una cohorte), distinto de <see cref="RelievedAt"/>.</summary>
    public string? Period { get; private set; }

    public string SourceName { get; private set; } = null!;
    public string SourceUrl { get; private set; } = null!;

    /// <summary>Documento o cuadro dentro de la fuente (ej. "Anuario 2023, cuadro 4.4").</summary>
    public string? SourceDocument { get; private set; }

    /// <summary>Fecha en que se bajó la muestra de la fuente.</summary>
    public DateTimeOffset SourceRetrievedAt { get; private set; }

    public OfficialFactStatus Status { get; private set; }

    /// <summary>El id de la regla escrita en Método con la que se calculó. Obligatorio solo cuando <see cref="Status"/> es Derived.</summary>
    public string? DerivationRuleId { get; private set; }

    /// <summary>Una frase para la ficha cuando el estado lo necesita (la razón de un NotApplicable, una aclaración de un NotPublished).</summary>
    public string? Note { get; private set; }

    /// <summary>Cuándo se relevó el dato (lo declara quien carga la afirmación).</summary>
    public DateTimeOffset RelievedAt { get; private set; }

    /// <summary>Quién lo relevó (UserId del staff, sin FK cross-módulo a identity).</summary>
    public Guid RelievedBy { get; private set; }

    public DateTimeOffset CreatedAt { get; private set; }

    private OfficialFact() { }

    public static Result<OfficialFact> Create(
        OfficialFactSubjectType subjectType,
        Guid subjectId,
        string field,
        OfficialFactStatus status,
        string? value,
        string? unit,
        string? period,
        string sourceName,
        string sourceUrl,
        string? sourceDocument,
        DateTimeOffset sourceRetrievedAt,
        string? derivationRuleId,
        string? note,
        DateTimeOffset relievedAt,
        Guid relievedBy,
        IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

        if (subjectId == Guid.Empty)
        {
            return OfficialFactErrors.SubjectRequired;
        }

        if (string.IsNullOrWhiteSpace(field))
        {
            return OfficialFactErrors.FieldRequired;
        }

        if (!OfficialFactField.IsKnown(field))
        {
            return OfficialFactErrors.UnknownField;
        }

        // La fuente es obligatoria siempre, incluso cuando el estado es NotPublished: ahí la fuente
        // es dónde se buscó (ADR-0090).
        if (string.IsNullOrWhiteSpace(sourceName))
        {
            return OfficialFactErrors.SourceNameRequired;
        }

        if (string.IsNullOrWhiteSpace(sourceUrl))
        {
            return OfficialFactErrors.SourceUrlRequired;
        }

        if (sourceRetrievedAt == default)
        {
            return OfficialFactErrors.SourceRetrievedAtRequired;
        }

        if (relievedAt == default)
        {
            return OfficialFactErrors.RelievedAtRequired;
        }

        if (relievedBy == Guid.Empty)
        {
            return OfficialFactErrors.RelievedByRequired;
        }

        // Published ("el valor está tal cual en la fuente") y Derived (un cálculo) prometen un dato;
        // los otros tres estados son formas de decir que no hay uno.
        if (status is OfficialFactStatus.Published or OfficialFactStatus.Derived
            && string.IsNullOrWhiteSpace(value))
        {
            return OfficialFactErrors.ValueRequired;
        }

        if (status == OfficialFactStatus.Derived && string.IsNullOrWhiteSpace(derivationRuleId))
        {
            return OfficialFactErrors.DerivationRuleRequired;
        }

        if (status == OfficialFactStatus.NotApplicable && string.IsNullOrWhiteSpace(note))
        {
            return OfficialFactErrors.ReasonRequired;
        }

        var now = clock.UtcNow;
        return new OfficialFact
        {
            Id = OfficialFactId.New(),
            SubjectType = subjectType,
            SubjectId = subjectId,
            Field = field.Trim(),
            Value = NormalizeOptional(value),
            Unit = NormalizeOptional(unit),
            Period = NormalizeOptional(period),
            SourceName = sourceName.Trim(),
            SourceUrl = sourceUrl.Trim(),
            SourceDocument = NormalizeOptional(sourceDocument),
            SourceRetrievedAt = sourceRetrievedAt,
            Status = status,
            DerivationRuleId = NormalizeOptional(derivationRuleId),
            Note = NormalizeOptional(note),
            RelievedAt = relievedAt,
            RelievedBy = relievedBy,
            CreatedAt = now,
        };
    }

    /// <summary>Reconstitución con un Id pre-asignado, para EF rehydration y seeder.</summary>
    public static OfficialFact Hydrate(
        OfficialFactId id,
        OfficialFactSubjectType subjectType,
        Guid subjectId,
        string field,
        string? value,
        string? unit,
        string? period,
        string sourceName,
        string sourceUrl,
        string? sourceDocument,
        DateTimeOffset sourceRetrievedAt,
        OfficialFactStatus status,
        string? derivationRuleId,
        string? note,
        DateTimeOffset relievedAt,
        Guid relievedBy,
        DateTimeOffset createdAt) =>
        new()
        {
            Id = id,
            SubjectType = subjectType,
            SubjectId = subjectId,
            Field = field,
            Value = value,
            Unit = unit,
            Period = period,
            SourceName = sourceName,
            SourceUrl = sourceUrl,
            SourceDocument = sourceDocument,
            SourceRetrievedAt = sourceRetrievedAt,
            Status = status,
            DerivationRuleId = derivationRuleId,
            Note = note,
            RelievedAt = relievedAt,
            RelievedBy = relievedBy,
            CreatedAt = createdAt,
        };

    private static string? NormalizeOptional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
