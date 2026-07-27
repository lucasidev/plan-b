using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Npgsql;

namespace Planb.Api.Infrastructure;

/// <summary>
/// Traduce una violación de UNIQUE de Postgres (SQLSTATE 23505) a un 409 con ProblemDetails.
///
/// <para>
/// Los índices únicos del proyecto están puestos como red de seguridad para las carreras que el
/// chequeo previo del handler no puede cerrar: el handler lee "¿ya existe?" y después escribe, y dos
/// requests concurrentes pasan los dos ese chequeo antes de que cualquiera commitee. Dos
/// configuraciones lo documentaban como "belt + suspenders" prometiendo que el caller recibía un 409,
/// pero no había nada que tradujera la excepción: el resultado real era un 500 con stack en el log.
/// Un doble click en el botón de "útil" alcanzaba para provocarlo.
/// </para>
///
/// <para>
/// Esto NO reemplaza el chequeo del handler, que sigue siendo el que da el error específico y
/// accionable ("ya reportaste esta reseña"). Es el piso para cuando la carrera gana.
/// </para>
///
/// <para>
/// El nombre del constraint va al log y no al body: al cliente no le sirve y expone nombres internos
/// del schema. Al que debuggea sí le sirve, y ahí lo tiene.
/// </para>
/// </summary>
internal sealed class UniqueViolationExceptionHandler : IExceptionHandler
{
    private const string UniqueViolation = "23505";

    private readonly IProblemDetailsService _problemDetails;
    private readonly ILogger<UniqueViolationExceptionHandler> _log;

    public UniqueViolationExceptionHandler(
        IProblemDetailsService problemDetails,
        ILogger<UniqueViolationExceptionHandler> log)
    {
        _problemDetails = problemDetails;
        _log = log;
    }

    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext, Exception exception, CancellationToken ct)
    {
        if (FindUniqueViolation(exception) is not { } postgres)
        {
            return false;
        }

        _log.LogWarning(
            postgres,
            "Unique violation surfaced as 409. Constraint={Constraint} Path={Path}",
            postgres.ConstraintName,
            httpContext.Request.Path);

        httpContext.Response.StatusCode = StatusCodes.Status409Conflict;

        return await _problemDetails.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = httpContext,
            Exception = exception,
            ProblemDetails = new ProblemDetails
            {
                Status = StatusCodes.Status409Conflict,
                Title = "conflict.duplicate",
                Detail = "The resource already exists. It may have been created by a concurrent request.",
            },
        });
    }

    /// <summary>
    /// Busca la <see cref="PostgresException"/> con SQLSTATE 23505 en la cadena de inner exceptions.
    /// EF la envuelve en <c>DbUpdateException</c>, y Wolverine puede envolver esa a su vez, así que
    /// no alcanza con mirar un solo nivel.
    /// </summary>
    private static PostgresException? FindUniqueViolation(Exception? exception)
    {
        for (var current = exception; current is not null; current = current.InnerException)
        {
            if (current is PostgresException { SqlState: UniqueViolation } postgres)
            {
                return postgres;
            }
        }

        return null;
    }
}
