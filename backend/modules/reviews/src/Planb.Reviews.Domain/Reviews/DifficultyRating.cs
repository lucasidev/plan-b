using Planb.SharedKernel.Primitives;

namespace Planb.Reviews.Domain.Reviews;

/// <summary>
/// Calificación de dificultad de una cursada. Rango 1 (muy fácil) a 5 (muy difícil),
/// invariante del data-model: <c>CHECK difficulty_rating BETWEEN 1 AND 5</c>. Lo expresamos
/// como value object para que el rango se valide al construir, no al persistir.
/// </summary>
public readonly record struct DifficultyRating : IValueObject
{
    public const int Min = 1;
    public const int Max = 5;

    public int Value { get; private init; }

    private DifficultyRating(int value)
    {
        Value = value;
    }

    public static Result<DifficultyRating> Create(int value)
    {
        if (value < Min || value > Max)
        {
            return Result.Failure<DifficultyRating>(ReviewErrors.DifficultyRatingOutOfRange);
        }
        return Result.Success(new DifficultyRating(value));
    }

    public override string ToString() => Value.ToString();
}
