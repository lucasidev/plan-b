namespace Planb.Academic.Application.Contracts;

/// <summary>
/// Una cátedra que un docente integra, con la materia que dicta.
///
/// <para>
/// Lleva <see cref="IsCurrent"/> porque el plantel está versionado por período: alguien puede haber
/// integrado una cátedra hasta 2024 y ya no estar. La ficha lo dice en vez de mezclarlas, para no
/// atribuirle a nadie lo que se dicta ahora sin él.
/// </para>
/// </summary>
public sealed record TeacherChairItem(
    Guid ChairId,
    string ChairName,
    Guid SubjectId,
    string SubjectName,
    string SubjectCode,
    string Role,
    bool IsCurrent);
