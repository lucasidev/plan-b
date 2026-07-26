using Planb.Planning.Domain.Schedule;
using Shouldly;
using Xunit;

namespace Planb.Planning.Tests.Schedule;

/// <summary>
/// La regla que detecta choques de horario entre comisiones elegidas (US-096): mismo día, comisiones
/// distintas, rangos que se intersectan en un intervalo semiabierto <c>[start, end)</c>.
/// </summary>
public class ScheduleClashDetectorTests
{
    private static readonly Guid DesarrolloSoftware = Guid.NewGuid();
    private static readonly Guid AlgebraI = Guid.NewGuid();

    private static readonly Guid ComisionA = Guid.NewGuid();
    private static readonly Guid ComisionB = Guid.NewGuid();

    private static ScheduledBlock Block(Guid subject, Guid commission, DayOfWeek day, int fromHour, int toHour) =>
        new(subject, commission, day, new TimeOnly(fromHour, 0), new TimeOnly(toHour, 0));

    [Fact]
    public void Lista_vacia_no_devuelve_choques()
    {
        var result = ScheduleClashDetector.Detect([]);

        result.ShouldBeEmpty();
    }

    [Fact]
    public void Solape_parcial_entre_comisiones_distintas_choca()
    {
        // Desarrollo de Software lunes 18-22, Álgebra I lunes 20-23: se pisan de 20 a 22.
        var a = Block(DesarrolloSoftware, ComisionA, DayOfWeek.Monday, 18, 22);
        var b = Block(AlgebraI, ComisionB, DayOfWeek.Monday, 20, 23);

        var result = ScheduleClashDetector.Detect([a, b]);

        result.ShouldHaveSingleItem();
        var clash = result[0];
        clash.FirstSubjectId.ShouldBe(DesarrolloSoftware);
        clash.SecondSubjectId.ShouldBe(AlgebraI);
        clash.Day.ShouldBe(DayOfWeek.Monday);
        clash.OverlapStart.ShouldBe(new TimeOnly(20, 0));
        clash.OverlapEnd.ShouldBe(new TimeOnly(22, 0));
    }

    [Fact]
    public void Contencion_total_de_un_bloque_dentro_de_otro_choca()
    {
        // Un bloque largo (8-22) contiene por completo a uno corto (10-12) de otra comisión.
        var largo = Block(DesarrolloSoftware, ComisionA, DayOfWeek.Monday, 8, 22);
        var corto = Block(AlgebraI, ComisionB, DayOfWeek.Monday, 10, 12);

        var result = ScheduleClashDetector.Detect([largo, corto]);

        result.ShouldHaveSingleItem();
        result[0].OverlapStart.ShouldBe(new TimeOnly(10, 0));
        result[0].OverlapEnd.ShouldBe(new TimeOnly(12, 0));
    }

    [Fact]
    public void Bloques_contiguos_no_chocan()
    {
        // 18-20 y 20-22 el mismo día: intervalo semiabierto [start, end), no se solapan.
        var a = Block(DesarrolloSoftware, ComisionA, DayOfWeek.Monday, 18, 20);
        var b = Block(AlgebraI, ComisionB, DayOfWeek.Monday, 20, 22);

        var result = ScheduleClashDetector.Detect([a, b]);

        result.ShouldBeEmpty();
    }

    [Fact]
    public void Mismo_horario_en_dias_distintos_no_choca()
    {
        var lunes = Block(DesarrolloSoftware, ComisionA, DayOfWeek.Monday, 18, 22);
        var martes = Block(AlgebraI, ComisionB, DayOfWeek.Tuesday, 18, 22);

        var result = ScheduleClashDetector.Detect([lunes, martes]);

        result.ShouldBeEmpty();
    }

    [Fact]
    public void Bloques_de_la_misma_comision_nunca_cuentan_como_choque_entre_si()
    {
        // Dos bloques de la MISMA comisión que se solapan (no debería pasar en la práctica, el
        // aggregate Commission lo impide, pero el detector tiene que ser robusto igual): no cuentan
        // como choque entre ellos.
        var a = Block(DesarrolloSoftware, ComisionA, DayOfWeek.Monday, 18, 22);
        var b = Block(DesarrolloSoftware, ComisionA, DayOfWeek.Monday, 19, 21);

        var result = ScheduleClashDetector.Detect([a, b]);

        result.ShouldBeEmpty();
    }

    [Fact]
    public void Tres_bloques_reportan_todos_los_pares_que_chocan()
    {
        // A y B chocan, A y C no (distinto día), B y C no (comisiones... en este caso mismo test
        // valida que el detector evalúa TODOS los pares, no solo el primero.
        var a = Block(DesarrolloSoftware, ComisionA, DayOfWeek.Monday, 18, 22);
        var b = Block(AlgebraI, ComisionB, DayOfWeek.Monday, 20, 23);
        var tercero = Guid.NewGuid();
        var comisionC = Guid.NewGuid();
        var c = Block(tercero, comisionC, DayOfWeek.Tuesday, 18, 22);

        var result = ScheduleClashDetector.Detect([a, b, c]);

        result.ShouldHaveSingleItem();
        result[0].FirstSubjectId.ShouldBe(DesarrolloSoftware);
        result[0].SecondSubjectId.ShouldBe(AlgebraI);
    }
}
