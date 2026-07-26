namespace Planb.Planning.Domain.Schedule;

/// <summary>
/// Detecta choques de horario entre las comisiones que el alumno eligió en el simulador (US-096):
/// lógica de dominio pura, sin I/O, para que el handler no la reimplemente en memoria ni en SQL.
///
/// <para>
/// Es la misma regla que <c>CommissionSchedule.OverlapsWith</c> en Academic (mismo día + intervalo
/// semiabierto <c>[start, end)</c>, así que dos franjas contiguas como 18-20 y 20-22 NO chocan): se
/// duplica a propósito acá porque Planning no referencia el dominio de Academic (ADR-0017,
/// boundaries del monolito modular), así que no hay forma de compartir el método entre los dos
/// módulos.
/// </para>
/// </summary>
public static class ScheduleClashDetector
{
    /// <summary>
    /// Compara cada par de <paramref name="blocks"/>: dos bloques chocan si son de comisiones
    /// DISTINTAS, el mismo día, y sus rangos se intersectan. Bloques de la misma comisión se
    /// saltean (nunca cuentan como choque entre sí, aunque se solapen). O(n²) sobre la cantidad de
    /// bloques de la combinación elegida, que es chica (unas pocas materias por cuatrimestre): no
    /// justifica nada más sofisticado.
    /// </summary>
    public static IReadOnlyList<ScheduleClash> Detect(IReadOnlyList<ScheduledBlock> blocks)
    {
        ArgumentNullException.ThrowIfNull(blocks);

        var clashes = new List<ScheduleClash>();

        for (var i = 0; i < blocks.Count; i++)
        {
            for (var j = i + 1; j < blocks.Count; j++)
            {
                var a = blocks[i];
                var b = blocks[j];

                if (a.CommissionId == b.CommissionId) continue;

                // Misma regla que CommissionSchedule.OverlapsWith (Academic): mismo día + intervalo
                // semiabierto [start, end). Contiguos (18-20 y 20-22) no chocan.
                var overlaps = a.Day == b.Day && a.Start < b.End && b.Start < a.End;
                if (!overlaps) continue;

                var overlapStart = a.Start > b.Start ? a.Start : b.Start;
                var overlapEnd = a.End < b.End ? a.End : b.End;
                clashes.Add(new ScheduleClash(a.SubjectId, b.SubjectId, a.Day, overlapStart, overlapEnd));
            }
        }

        return clashes;
    }
}
