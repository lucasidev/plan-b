namespace Planb.SharedKernel.Primitives;

/// <summary>
/// Represents a business error with a stable code and human-readable message.
/// Use for expected failure cases (validation, business rules). Exceptions only for programmer errors.
/// </summary>
public sealed record Error(string Code, string Message)
{
    public static readonly Error None = new(string.Empty, string.Empty);

    public static Error NotFound(string code, string message) => new(code, message);
    public static Error Conflict(string code, string message) => new(code, message);
    public static Error Validation(string code, string message) => new(code, message);
    public static Error Forbidden(string code, string message) => new(code, message);
    public static Error Unauthorized(string code, string message) => new(code, message);

    public override string ToString() => $"{Code}: {Message}";
}
