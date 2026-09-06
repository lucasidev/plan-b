namespace Planb.Academic.Application.Contracts;

/// <summary>
/// Nombre de un docente del catálogo, por id. A diferencia de <see cref="TeacherDetailItem"/>, no
/// trae más que lo que hace falta para reconocerlo nombrado en un texto (ver
/// <see cref="IAcademicQueryService.ListTeacherNamesForCareerAsync"/>).
/// </summary>
public sealed record TeacherNameItem(Guid Id, string FirstName, string LastName);
