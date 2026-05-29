using Planb.SharedKernel.Primitives;

namespace Planb.Reviews.Domain.Reviews;

/// <summary>
/// Texto libre de una reseña, ya sea sobre la materia o el docente. Opcional individualmente
/// (cualquiera de los dos puede ser null), con la invariante a nivel agregado de que al menos
/// uno debe estar presente (CHECK del data-model).
///
/// Longitud entre <see cref="MinLength"/> (50) y <see cref="MaxLength"/> (2000). El minimum
/// existe para forzar contenido sustancioso, no una sola palabra. El maximum es defensivo
/// contra payloads abusivos.
///
/// Trimmeamos al construir para que validaciones de longitud refieran al contenido real, no
/// a whitespace. <c>null</c> se acepta y representa "campo no provisto".
/// </summary>
public readonly record struct ReviewText : IValueObject
{
    public const int MinLength = 50;
    public const int MaxLength = 2000;

    public string Value { get; private init; }

    private ReviewText(string value)
    {
        Value = value;
    }

    public static Result<ReviewText?> CreateOptional(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            return Result.Success<ReviewText?>(null);
        }

        var trimmed = raw.Trim();
        if (trimmed.Length < MinLength)
        {
            return Result.Failure<ReviewText?>(ReviewErrors.ReviewTextTooShort);
        }
        if (trimmed.Length > MaxLength)
        {
            return Result.Failure<ReviewText?>(ReviewErrors.ReviewTextTooLong);
        }

        return Result.Success<ReviewText?>(new ReviewText(trimmed));
    }

    public override string ToString() => Value;
}
