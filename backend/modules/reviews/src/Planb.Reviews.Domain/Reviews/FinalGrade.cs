using Planb.SharedKernel.Primitives;

namespace Planb.Reviews.Domain.Reviews;

/// <summary>
/// Nota final declarada por el alumno en la reseña. Opcional (puede ser null si el alumno
/// no quiere compartir). Rango [0, 10] con dos decimales, invariante del data-model.
/// Almacenamos en <see cref="decimal"/> para no perder precisión (DB es NUMERIC(4,2)).
/// </summary>
public readonly record struct FinalGrade : IValueObject
{
    public const decimal Min = 0m;
    public const decimal Max = 10m;

    public decimal Value { get; private init; }

    private FinalGrade(decimal value)
    {
        Value = value;
    }

    public static Result<FinalGrade> Create(decimal value)
    {
        if (value < Min || value > Max)
        {
            return Result.Failure<FinalGrade>(ReviewErrors.FinalGradeOutOfRange);
        }
        // Truncar a 2 decimales para alinear con la columna NUMERIC(4,2) y que un Round del
        // dominio no quede atrás del Round implícito de la DB.
        var truncated = Math.Round(value, 2, MidpointRounding.AwayFromZero);
        return Result.Success(new FinalGrade(truncated));
    }

    public override string ToString() => Value.ToString("0.00");
}
