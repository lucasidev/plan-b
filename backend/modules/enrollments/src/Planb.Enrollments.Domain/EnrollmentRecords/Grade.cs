using System.Globalization;
using Planb.SharedKernel.Primitives;

namespace Planb.Enrollments.Domain.EnrollmentRecords;

/// <summary>
/// Nota final de una cursada. Sistema argentino: 0..10 con 1 decimal de resolución.
///
/// Es value object para que el rango se valide en el constructor, no en cada handler que
/// reciba un decimal raw. La equality es por valor (record struct).
/// </summary>
public readonly record struct Grade : IValueObject
{
    public decimal Value { get; private init; }

    public Grade(decimal value)
    {
        if (value < 0m || value > 10m)
        {
            throw new ArgumentOutOfRangeException(
                nameof(value), value, "Grade must be between 0 and 10 (Argentine scale).");
        }
        // Truncamos a 2 decimales por compatibilidad con NUMERIC(4,2) en DB. El dominio
        // acepta 7.5, 7.75; un 7.123 se queda como 7.12.
        Value = Math.Round(value, 2, MidpointRounding.AwayFromZero);
    }

    // InvariantCulture: el JSON serializer, los CHECK constraints y los tests asumen separador
    // decimal '.'. El locale del host (es-AR usaría ',') no debe filtrarse al wire.
    public override string ToString() => Value.ToString("0.##", CultureInfo.InvariantCulture);
}
