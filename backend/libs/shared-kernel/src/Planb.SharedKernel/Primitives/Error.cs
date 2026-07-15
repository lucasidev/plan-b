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
/// Representa un error de negocio con un code estable, un mensaje legible, y un tipo categórico.
/// La capa HTTP mapea <see cref="ErrorType"/> a un status sin parsear <see cref="Code"/>.
/// Las excepciones se reservan para errores de programación.
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
