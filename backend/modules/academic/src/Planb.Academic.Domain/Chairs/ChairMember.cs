using Planb.Academic.Domain.AcademicTerms;
using Planb.Academic.Domain.Teachers;

namespace Planb.Academic.Domain.Chairs;

/// <summary>
/// Child entity de <see cref="Chair"/>: un docente en el equipo, con su rol y el tramo en el que
/// estuvo. Vive dentro del aggregate boundary de la cátedra y se carga eager con ella. El ctor es
/// internal: solo <see cref="Chair"/> crea instancias, que es lo que mantiene los invariantes
/// (un docente vigente por vez, un solo titular vigente) adentro del aggregate.
///
/// <para>
/// El tramo existe porque la ficha de cátedra publica reseñas de varios años y el equipo cambia:
/// sin <see cref="SinceTermId"/> y <see cref="UntilTermId"/>, la ficha le atribuiría al titular de
/// hoy lo que se dictó hace tres años. <see cref="UntilTermId"/> en null significa que sigue.
/// </para>
/// </summary>
public sealed class ChairMember
{
    public TeacherId TeacherId { get; private set; }
    public ChairMemberRole Role { get; private set; }
    public AcademicTermId SinceTermId { get; private set; }
    public AcademicTermId? UntilTermId { get; private set; }

    /// <summary>Sigue en el equipo: es el que la ficha nombra y el único que cuenta para el invariante del titular.</summary>
    public bool IsCurrent => UntilTermId is null;

    private ChairMember() { }

    internal ChairMember(
        TeacherId teacherId,
        ChairMemberRole role,
        AcademicTermId sinceTermId,
        AcademicTermId? untilTermId = null)
    {
        TeacherId = teacherId;
        Role = role;
        SinceTermId = sinceTermId;
        UntilTermId = untilTermId;
    }

    /// <summary>Cierra el tramo en el período dado. Lo llama <see cref="Chair"/> al dar de baja a alguien.</summary>
    internal void CloseAt(AcademicTermId untilTermId) => UntilTermId = untilTermId;
}
