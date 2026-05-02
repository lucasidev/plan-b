using Planb.Academic.Domain.CareerPlans;
using Planb.Academic.Domain.Careers;
using Planb.Academic.Domain.Universities;

namespace Planb.Academic.Infrastructure.Seeding;

/// <summary>
/// Constantes determinísticas del seed de Academic. UUIDs hardcodeados en lugar de
/// <c>Guid.NewGuid()</c> para que cualquier entorno (dev local, CI, eventual prod si reusamos
/// el seeder) use los mismos IDs. Eso permite que docs, fixtures de tests y eventuales
/// referencias hardcoded en frontend mantengan consistencia entre runs.
///
/// Si estos registros se editan vía UI futura, los Ids persisten y sólo cambian los fields
/// editables.
///
/// Convención de UUIDs:
///   - Universities: 00000001-0000-4000-a000-0000000000NN
///   - Careers:      00000002-0000-4000-a000-0000000000NN
///   - CareerPlans:  00000003-0000-4000-a000-0000000000NN
/// donde NN es secuencial y agrupa por universidad cuando aplica.
/// </summary>
public static class AcademicSeedData
{
    // ====================================================================
    // Universities
    // ====================================================================

    public static readonly UniversityRecord Unsta = new(
        Id: new UniversityId(Guid.Parse("00000001-0000-4000-a000-000000000001")),
        Name: "Universidad del Norte Santo Tomás de Aquino",
        Slug: "unsta");

    public static readonly UniversityRecord Siglo21 = new(
        Id: new UniversityId(Guid.Parse("00000001-0000-4000-a000-000000000002")),
        Name: "Universidad Siglo 21",
        Slug: "siglo21");

    public static readonly UniversityRecord Unt = new(
        Id: new UniversityId(Guid.Parse("00000001-0000-4000-a000-000000000003")),
        Name: "Universidad Nacional de Tucumán",
        Slug: "unt");

    public static readonly UniversityRecord UtnFrt = new(
        Id: new UniversityId(Guid.Parse("00000001-0000-4000-a000-000000000004")),
        Name: "Universidad Tecnológica Nacional - Facultad Regional Tucumán",
        Slug: "utn-frt");

    public static IReadOnlyList<UniversityRecord> Universities { get; } = new[]
    {
        Unsta, Siglo21, Unt, UtnFrt,
    };

    // ====================================================================
    // Careers + CareerPlans (catalog IT)
    //
    // Cada CareerSeed lleva su Career + el Plan vigente actual. La curaduría de qué entra es
    // manual (carreras IT exclusivamente). USPT no tiene oferta IT: queda fuera del catálogo.
    // ====================================================================

    public static IReadOnlyList<CareerSeed> Careers { get; } = new[]
    {
        // ---------- UNSTA ----------
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000001")),
                UniversityId: Unsta.Id,
                Name: "Ingeniería en Informática",
                Slug: "ingenieria-en-informatica"),
            Plan: new CareerPlanRecord(
                Id: new CareerPlanId(Guid.Parse("00000003-0000-4000-a000-000000000001")),
                Year: 2019)),

        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000002")),
                UniversityId: Unsta.Id,
                Name: "Ingeniería en Inteligencia Artificial",
                Slug: "ingenieria-en-inteligencia-artificial"),
            Plan: new CareerPlanRecord(
                Id: new CareerPlanId(Guid.Parse("00000003-0000-4000-a000-000000000002")),
                Year: 2022)),

        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000003")),
                UniversityId: Unsta.Id,
                Name: "Tecnicatura Universitaria en Desarrollo y Calidad de Software",
                Slug: "tecnicatura-universitaria-en-desarrollo-y-calidad-de-software"),
            Plan: new CareerPlanRecord(
                Id: new CareerPlanId(Guid.Parse("00000003-0000-4000-a000-000000000003")),
                Year: 2018)),

        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000004")),
                UniversityId: Unsta.Id,
                Name: "Tecnicatura Universitaria en Automatización y Robótica",
                Slug: "tecnicatura-universitaria-en-automatizacion-y-robotica"),
            Plan: new CareerPlanRecord(
                Id: new CareerPlanId(Guid.Parse("00000003-0000-4000-a000-000000000004")),
                Year: 2022)),

        // ---------- SIGLO 21 ----------
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000010")),
                UniversityId: Siglo21.Id,
                Name: "Ingeniería en Software",
                Slug: "ingenieria-en-software"),
            Plan: new CareerPlanRecord(
                Id: new CareerPlanId(Guid.Parse("00000003-0000-4000-a000-000000000010")),
                Year: 2005)),

        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000011")),
                UniversityId: Siglo21.Id,
                Name: "Licenciatura en Informática",
                Slug: "licenciatura-en-informatica"),
            Plan: new CareerPlanRecord(
                Id: new CareerPlanId(Guid.Parse("00000003-0000-4000-a000-000000000011")),
                Year: 2025)),

        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000012")),
                UniversityId: Siglo21.Id,
                Name: "Licenciatura en Ciencia de Datos",
                Slug: "licenciatura-en-ciencia-de-datos"),
            Plan: new CareerPlanRecord(
                Id: new CareerPlanId(Guid.Parse("00000003-0000-4000-a000-000000000012")),
                Year: 2021)),

        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000013")),
                UniversityId: Siglo21.Id,
                Name: "Licenciatura en Seguridad Informática",
                Slug: "licenciatura-en-seguridad-informatica"),
            Plan: new CareerPlanRecord(
                Id: new CareerPlanId(Guid.Parse("00000003-0000-4000-a000-000000000013")),
                Year: 2021)),

        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000014")),
                UniversityId: Siglo21.Id,
                Name: "Licenciatura en Inteligencia Artificial y Robótica",
                Slug: "licenciatura-en-inteligencia-artificial-y-robotica"),
            Plan: new CareerPlanRecord(
                Id: new CareerPlanId(Guid.Parse("00000003-0000-4000-a000-000000000014")),
                Year: 2021)),

        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000015")),
                UniversityId: Siglo21.Id,
                Name: "Licenciatura en Administración de Infraestructura Tecnológica",
                Slug: "licenciatura-en-administracion-de-infraestructura-tecnologica"),
            Plan: new CareerPlanRecord(
                Id: new CareerPlanId(Guid.Parse("00000003-0000-4000-a000-000000000015")),
                Year: 2021)),

        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000016")),
                UniversityId: Siglo21.Id,
                Name: "Tecnicatura Universitaria en Redes Informáticas y Telecomunicaciones",
                Slug: "tecnicatura-universitaria-en-redes-informaticas-y-telecomunicaciones"),
            Plan: new CareerPlanRecord(
                Id: new CareerPlanId(Guid.Parse("00000003-0000-4000-a000-000000000016")),
                Year: 2024)),

        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000017")),
                UniversityId: Siglo21.Id,
                Name: "Tecnicatura Universitaria en Diseño y Desarrollo de Videojuegos",
                Slug: "tecnicatura-universitaria-en-diseno-y-desarrollo-de-videojuegos"),
            Plan: new CareerPlanRecord(
                Id: new CareerPlanId(Guid.Parse("00000003-0000-4000-a000-000000000017")),
                Year: 2023)),

        // ---------- UNT ----------
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000020")),
                UniversityId: Unt.Id,
                Name: "Ingeniería en Informática",
                Slug: "ingenieria-en-informatica"),
            Plan: new CareerPlanRecord(
                Id: new CareerPlanId(Guid.Parse("00000003-0000-4000-a000-000000000020")),
                Year: 2019)),

        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000021")),
                UniversityId: Unt.Id,
                Name: "Ingeniería en Computación",
                Slug: "ingenieria-en-computacion"),
            Plan: new CareerPlanRecord(
                Id: new CareerPlanId(Guid.Parse("00000003-0000-4000-a000-000000000021")),
                Year: 2005)),

        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000022")),
                UniversityId: Unt.Id,
                Name: "Licenciatura en Informática",
                Slug: "licenciatura-en-informatica"),
            Plan: new CareerPlanRecord(
                Id: new CareerPlanId(Guid.Parse("00000003-0000-4000-a000-000000000022")),
                Year: 2009)),

        // ---------- UTN-FRT ----------
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000030")),
                UniversityId: UtnFrt.Id,
                Name: "Ingeniería en Sistemas de Información",
                Slug: "ingenieria-en-sistemas-de-informacion"),
            Plan: new CareerPlanRecord(
                Id: new CareerPlanId(Guid.Parse("00000003-0000-4000-a000-000000000030")),
                Year: 2023)),

        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000031")),
                UniversityId: UtnFrt.Id,
                Name: "Tecnicatura Universitaria en Programación",
                Slug: "tecnicatura-universitaria-en-programacion"),
            Plan: new CareerPlanRecord(
                Id: new CareerPlanId(Guid.Parse("00000003-0000-4000-a000-000000000031")),
                Year: 2023)),

        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000032")),
                UniversityId: UtnFrt.Id,
                Name: "Tecnicatura Universitaria en Desarrollo y Producción de Videojuegos",
                Slug: "tecnicatura-universitaria-en-desarrollo-y-produccion-de-videojuegos"),
            Plan: new CareerPlanRecord(
                Id: new CareerPlanId(Guid.Parse("00000003-0000-4000-a000-000000000032")),
                Year: 2023)),
    };
}

/// <summary>Datos planos de una University del seed.</summary>
public sealed record UniversityRecord(UniversityId Id, string Name, string Slug);

/// <summary>Datos planos de una Career del seed.</summary>
public sealed record CareerRecord(CareerId Id, UniversityId UniversityId, string Name, string Slug);

/// <summary>Datos planos de un CareerPlan del seed (Career inferido por contexto).</summary>
public sealed record CareerPlanRecord(CareerPlanId Id, int Year);

/// <summary>Par Career + CareerPlan vigente. Cada entrada del catálogo IT.</summary>
public sealed record CareerSeed(CareerRecord Career, CareerPlanRecord Plan);
