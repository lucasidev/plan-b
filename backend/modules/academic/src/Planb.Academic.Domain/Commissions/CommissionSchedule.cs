namespace Planb.Academic.Domain.Commissions;

/// <summary>
/// Child entity de <see cref="Commission"/> (US-093): una franja de cursada semanal de la comisión,
/// como "martes de 18:00 a 22:00". Identidad compuesta <c>(commission_id, day, start_time)</c>, sin
/// id sintético, igual que <see cref="CommissionTeacher"/>. Vive dentro del aggregate boundary y se
/// carga eager con él (OwnsMany + AutoInclude). El ctor es internal: solo <see cref="Commission"/>
/// crea instancias, manteniendo los invariantes (rango válido, sin solape) dentro del aggregate.
///
/// <para>
/// Los horarios son el insumo de los choques del planificador (US-096): dos comisiones distintas
/// "chocan" si alguna de sus franjas se solapa. La detección cross-comisión vive en el módulo
/// planning; acá solo garantizamos que una comisión no se pise a sí misma.
/// </para>
/// </summary>
public sealed class CommissionSchedule
{
    public DayOfWeek Day { get; private set; }
    public TimeOnly StartTime { get; private set; }
    public TimeOnly EndTime { get; private set; }

    private CommissionSchedule() { }

    internal CommissionSchedule(DayOfWeek day, TimeOnly startTime, TimeOnly endTime)
    {
        Day = day;
        StartTime = startTime;
        EndTime = endTime;
    }

    /// <summary>
    /// Reconstituye una franja ya persistida. Existe porque las franjas se guardan como documento
    /// embebido (ADR-0053) y el value converter que las deserializa vive en Infrastructure, que no
    /// alcanza al ctor <c>internal</c>.
    ///
    /// <para>
    /// No valida: el dato ya pasó por el aggregate cuando se escribió. Es el mismo contrato que el
    /// resto de los <c>Hydrate</c> del proyecto.
    /// </para>
    /// </summary>
    public static CommissionSchedule Hydrate(DayOfWeek day, TimeOnly startTime, TimeOnly endTime) =>
        new(day, startTime, endTime);

    /// <summary>
    /// True si esta franja se solapa con <paramref name="other"/>: mismo día y rangos que
    /// intersectan. El intervalo es semiabierto <c>[start, end)</c>, así que dos franjas contiguas
    /// (una termina justo cuando la otra empieza) NO se solapan: 18-20 y 20-22 conviven.
    /// </summary>
    internal bool OverlapsWith(CommissionSchedule other) =>
        Day == other.Day && StartTime < other.EndTime && other.StartTime < EndTime;
}
