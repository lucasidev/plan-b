namespace Planb.Academic.Application.Contracts;

/// <summary>
/// Cómo se llaman las cosas del catálogo que otro módulo referencia por id.
///
/// <para>
/// Existe para que un módulo no tenga que leer las tablas de academic solo para mostrar un nombre.
/// Se pide <b>en lote</b>, con la lista de ids que la pantalla ya sabe que necesita: pedir de a uno
/// sería un N+1, y ese era el argumento con el que los reads de reviews justificaban el JOIN
/// cross-schema. El lote lo desarma.
/// </para>
///
/// <para>
/// Un id que no está en el catálogo simplemente no aparece en el diccionario. El caller decide qué
/// hacer con esa ausencia, que no es lo mismo en toda pantalla.
/// </para>
/// </summary>
public sealed record CatalogLabels(
    IReadOnlyDictionary<Guid, SubjectLabel> Subjects,
    IReadOnlyDictionary<Guid, string> Terms,
    IReadOnlyDictionary<Guid, string> Chairs)
{
    public static readonly CatalogLabels Empty = new(
        new Dictionary<Guid, SubjectLabel>(),
        new Dictionary<Guid, string>(),
        new Dictionary<Guid, string>());
}

/// <summary>
/// El nombre de una materia y su código. Van juntos porque toda pantalla que muestra uno muestra
/// el otro: el código es lo que el alumno reconoce del plan y el nombre lo que lee.
/// </summary>
public sealed record SubjectLabel(string Name, string Code);
