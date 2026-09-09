using Planb.Academic.Domain.Careers;

namespace Planb.Academic.Infrastructure.Seeding;

/// <summary>
/// Propuesta de carrera canónica (R6, US-195): qué ofertas de instituciones distintas son la
/// misma carrera, para que "Dónde estudiarla" las compare lado a lado en vez de nunca cruzarlas.
/// El agrupamiento lo decide el equipo, no el parecido del nombre
/// (<c>docs/product/language.md</c>, entrada "Carrera canónica"): esto es una <b>propuesta</b>
/// a partir del título normalizado, correcta hasta que alguien la corrija a mano, no la
/// implementación de US-195. Esa story entra con su propia pantalla (Catálogo, SC-027) y su
/// registro de quién ató cada oferta y cuándo; hasta que exista, este archivo es el insumo que
/// esa pantalla va a formalizar, y no está conectado a ninguna tabla ni a ningún read.
///
/// <para>
/// Cada <see cref="Group"/> es una lista de <see cref="CareerId"/> que hoy en <see
/// cref="AcademicSeedData.Careers"/> comparten título (con variantes de género) y tipo de título;
/// cuando el tipo o la duración difieren de forma que un dato en la ficha se vea distinto entre
/// instituciones (ej. Abogacía dura 6 años en la UNT y 5 en las privadas), el grupo se mantiene
/// igual: esa diferencia es justo lo que "Dónde estudiarla" existe para mostrar.
/// </para>
///
/// <para>
/// Lo que quedó fuera a propósito, por dudoso (no forzado): "Procurador" se repite en UNSTA, USPT
/// y UNT con el mismo título pero tipo de título distinto (Técnico Instrumental, Otros Pregrados y
/// Grado), señal de que no es la misma credential. "Psicología" tiene "Licenciado en Psicología"
/// en UNSTA y "Psicólogo" en UNT: mismo campo, título literal distinto, necesita juicio humano
/// para confirmar que son la misma carrera. Ninguno de los dos entra acá.
/// </para>
/// </summary>
public static class CanonicalCareerGroupings
{
    public sealed record Group(string Name, IReadOnlyList<CareerId> CareerIds);

    private static CareerId Cid(string hex12) => new(Guid.Parse($"00000002-0000-4000-a000-{hex12}"));

    public static IReadOnlyList<Group> All { get; } = new[]
    {
        // La comparación central de R6: la Tecnicatura de UNSTA contra las ofertas de programación
        // de UNT y UTN. Tres títulos distintos (Tecnicatura Universitaria en Desarrollo y Calidad
        // de Software, Programador Universitario, Tecnicatura Universitaria en Programación), tres
        // duraciones distintas (2,5 / 3 / 2 años): la story #485 (Dónde estudiarla) depende de que
        // este grupo exista.
        new Group("Tecnicatura o técnico en programación", new[]
        {
            Cid("000000000003"), // UNSTA, Tecnicatura Universitaria en Desarrollo y Calidad de Software
            Cid("000000000023"), // UNT, Programador Universitario
            Cid("000000000031"), // UTN-FRT, Tecnicatura Universitaria en Programación
        }),

        new Group("Abogacía", new[]
        {
            Cid("000000000100"), // UNSTA, Abogado
            Cid("00000000023e"), // UNT, Abogado
            Cid("000000000307"), // USPT, Abogado
        }),

        new Group("Contador Público", new[]
        {
            Cid("000000000101"), // UNSTA, Contador Público
            Cid("000000000224"), // UNT, Contador Público
        }),

        new Group("Ingeniería en Informática", new[]
        {
            Cid("000000000001"), // UNSTA, Ingeniería en Informática
            Cid("000000000020"), // UNT, Ingeniería en Informática
        }),

        new Group("Ingeniería Industrial", new[]
        {
            Cid("000000000102"), // UNSTA, Ingeniero Industrial
            Cid("000000000230"), // UNT, Ingeniero Industrial
        }),

        new Group("Medicina", new[]
        {
            Cid("000000000112"), // UNSTA, Médico
            Cid("00000000025c"), // UNT, Médico
            Cid("000000000313"), // USPT, Médico
        }),

        new Group("Licenciatura en Filosofía", new[]
        {
            Cid("00000000011f"), // UNSTA, Licenciado en Filosofía
            Cid("000000000248"), // UNT, Licenciado en Filosofía
        }),

        new Group("Profesorado en Filosofía", new[]
        {
            Cid("000000000122"), // UNSTA, Profesor en Filosofía
            Cid("000000000252"), // UNT, Profesor en Filosofía
        }),

        new Group("Ingeniería Civil", new[]
        {
            Cid("00000000022d"), // UNT, Ingeniero Civil
            Cid("000000000502"), // UTN-FRT, Ingeniero Civil
        }),

        new Group("Ingeniería Electrónica", new[]
        {
            Cid("00000000022f"), // UNT, Ingeniero Electrónico
            Cid("000000000503"), // UTN-FRT, Ingeniero Electrónico
        }),

        new Group("Ingeniería Mecánica", new[]
        {
            Cid("000000000231"), // UNT, Ingeniero Mecánico
            Cid("000000000504"), // UTN-FRT, Ingeniero Mecánico
        }),
    };
}
