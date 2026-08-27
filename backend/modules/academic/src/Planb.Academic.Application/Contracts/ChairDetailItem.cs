namespace Planb.Academic.Application.Contracts;

/// <summary>
/// Una cátedra con lo que su ficha necesita para presentarse: quién es y de qué materia.
///
/// <para>
/// Trae la materia porque la ficha se lee sola, sin haber pasado por la materia: quien llega por un
/// link tiene que saber de qué cursada se le está hablando. Y porque la comparación contra las
/// hermanas (ADR-0083) se define como "las otras cátedras de esta materia": sin la materia acá, el
/// módulo de reseñas no tiene cómo pedirlas sin espiar el schema de academic (ADR-0017).
/// </para>
/// </summary>
public sealed record ChairDetailItem(
    Guid Id,
    string Name,
    Guid SubjectId,
    string SubjectName,
    string SubjectCode,
    Guid? LeadTeacherId,
    string? LeadFirstName,
    string? LeadLastName);
