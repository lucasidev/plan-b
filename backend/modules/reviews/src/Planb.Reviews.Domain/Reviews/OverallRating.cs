using Planb.SharedKernel.Primitives;

namespace Planb.Reviews.Domain.Reviews;

/// <summary>
/// Calificación general que el alumno le da a la cursada (materia + docente + comisión + cuatri
/// como un todo). Rango 1 (mala) a 5 (excelente). Distinto semánticamente de
/// <see cref="DifficultyRating"/>: el rango es idéntico (1-5) pero "qué tan buena fue" no es "qué
/// tan difícil fue". Se modela como value object aparte para que el lector no confunda los dos
/// ejes, aunque comparta forma.
/// </summary>
public readonly record struct OverallRating : IValueObject
{
    public const int Min = 1;
    public const int Max = 5;

    public int Value { get; private init; }

    private OverallRating(int value)
    {
        Value = value;
    }

    public static Result<OverallRating> Create(int value)
    {
        if (value < Min || value > Max)
        {
            return Result.Failure<OverallRating>(ReviewErrors.OverallRatingOutOfRange);
        }
        return Result.Success(new OverallRating(value));
    }

    public override string ToString() => Value.ToString();
}
