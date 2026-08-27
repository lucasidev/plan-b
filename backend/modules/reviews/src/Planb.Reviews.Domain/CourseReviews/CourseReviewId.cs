using Planb.SharedKernel.Primitives;

namespace Planb.Reviews.Domain.CourseReviews;

/// <summary>
/// Strongly-typed identifier para <see cref="CourseReview"/> (ADR-0082). Nunca sale publicado: lo
/// que la ficha muestra son conteos, jamás una reseña individual. Existe para que el autor pueda
/// editar o borrar la suya.
/// </summary>
public readonly record struct CourseReviewId : IValueObject
{
    public Guid Value { get; private init; }

    public CourseReviewId(Guid value)
    {
        if (value == Guid.Empty)
        {
            throw new ArgumentException("CourseReviewId cannot be empty.", nameof(value));
        }
        Value = value;
    }

    public static CourseReviewId New() => new(Guid.NewGuid());

    public override string ToString() => Value.ToString();
}
