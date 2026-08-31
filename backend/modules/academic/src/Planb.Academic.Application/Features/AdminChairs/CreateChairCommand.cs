namespace Planb.Academic.Application.Features.AdminChairs;

/// <summary>
/// Alta de una cátedra sobre una materia (US-196). Nace sin equipo: los integrantes se suman
/// después, cada uno con el período desde el que integra, porque una cátedra sin titular es un dato
/// que falta y no un dato mal (ver <c>Chair.Create</c>).
/// </summary>
public sealed record CreateChairCommand(Guid SubjectId, string Name);
