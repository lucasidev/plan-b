namespace Planb.SharedKernel.Primitives;

public enum ErrorType
{
    None,
    Validation,
    Conflict,
    NotFound,
    Unauthorized,
    Forbidden,
    Problem,
}

/// <summary>
/// Represents a business error with a stable code, human-readable message, and a categorical type.
/// The HTTP layer maps <see cref="ErrorType"/> to a status code without parsing <see cref="Code"/>.
/// Use exceptions only for programmer errors.
/// </summary>
public sealed record Error(string Code, string Message, ErrorType Type)
{
    public static readonly Error None = new(string.Empty, string.Empty, ErrorType.None);

    public static Error Validation(string code, string message) =>
        new(code, message, ErrorType.Validation);

    public static Error Conflict(string code, string message) =>
        new(code, message, ErrorType.Conflict);

    public static Error NotFound(string code, string message) =>
        new(code, message, ErrorType.NotFound);

    public static Error Unauthorized(string code, string message) =>
        new(code, message, ErrorType.Unauthorized);

    public static Error Forbidden(string code, string message) =>
        new(code, message, ErrorType.Forbidden);

    public static Error Problem(string code, string message) =>
        new(code, message, ErrorType.Problem);

    public override string ToString() => $"{Code}: {Message}";
}
