using Planb.Academic.Domain;
using Planb.Academic.Domain.AcademicTerms;
using Planb.Academic.Domain.CareerPlans;
using Planb.Academic.Domain.Careers;
using Planb.Academic.Domain.Subjects;
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

    // ====================================================================
    // Subjects (TUDCS UNSTA — Plan 2018)
    //
    // Subset curado para que el form de US-013 tenga un catálogo coherente con el mock del
    // tab Historial (canvas v2). Cuando el backoffice admin (US-062) aterrice, esto se reemplaza
    // por carga vía UI o CSV importer. Mientras tanto, alcanza para validar el flow end-to-end.
    //
    // Convención de UUIDs:
    //   - Subjects: 00000004-0000-4000-a000-0000000000NN
    //   donde NN agrupa por año del plan (01-09 → 1º, 10-19 → 2º, 20-29 → 3º).
    // ====================================================================

    private static readonly CareerPlanId TudcsPlanId =
        new(Guid.Parse("00000003-0000-4000-a000-000000000003"));

    public static IReadOnlyList<SubjectRecord> Subjects { get; } = new[]
    {
        // 1er año
        new SubjectRecord(
            Id: new SubjectId(Guid.Parse("00000004-0000-4000-a000-000000000001")),
            CareerPlanId: TudcsPlanId,
            Code: "MAT102",
            Name: "Análisis Matemático I",
            YearInPlan: 1, TermInYear: 1, TermKind: TermKind.Cuatrimestral,
            WeeklyHours: 6, TotalHours: 96),
        new SubjectRecord(
            Id: new SubjectId(Guid.Parse("00000004-0000-4000-a000-000000000002")),
            CareerPlanId: TudcsPlanId,
            Code: "ALG101",
            Name: "Álgebra",
            YearInPlan: 1, TermInYear: 1, TermKind: TermKind.Cuatrimestral,
            WeeklyHours: 5, TotalHours: 80),
        new SubjectRecord(
            Id: new SubjectId(Guid.Parse("00000004-0000-4000-a000-000000000003")),
            CareerPlanId: TudcsPlanId,
            Code: "INT101",
            Name: "Introducción a Sistemas",
            YearInPlan: 1, TermInYear: 1, TermKind: TermKind.Cuatrimestral,
            WeeklyHours: 4, TotalHours: 64),
        new SubjectRecord(
            Id: new SubjectId(Guid.Parse("00000004-0000-4000-a000-000000000004")),
            CareerPlanId: TudcsPlanId,
            Code: "PRG101",
            Name: "Programación I",
            YearInPlan: 1, TermInYear: 1, TermKind: TermKind.Cuatrimestral,
            WeeklyHours: 6, TotalHours: 96),
        new SubjectRecord(
            Id: new SubjectId(Guid.Parse("00000004-0000-4000-a000-000000000005")),
            CareerPlanId: TudcsPlanId,
            Code: "ING101",
            Name: "Inglés Técnico I",
            YearInPlan: 1, TermInYear: 2, TermKind: TermKind.Cuatrimestral,
            WeeklyHours: 3, TotalHours: 48),

        // 2do año
        new SubjectRecord(
            Id: new SubjectId(Guid.Parse("00000004-0000-4000-a000-000000000010")),
            CareerPlanId: TudcsPlanId,
            Code: "PRG201",
            Name: "Programación II",
            YearInPlan: 2, TermInYear: 1, TermKind: TermKind.Cuatrimestral,
            WeeklyHours: 6, TotalHours: 96),
        new SubjectRecord(
            Id: new SubjectId(Guid.Parse("00000004-0000-4000-a000-000000000011")),
            CareerPlanId: TudcsPlanId,
            Code: "MAT201",
            Name: "Análisis Matemático II",
            YearInPlan: 2, TermInYear: 1, TermKind: TermKind.Cuatrimestral,
            WeeklyHours: 6, TotalHours: 96),
        new SubjectRecord(
            Id: new SubjectId(Guid.Parse("00000004-0000-4000-a000-000000000012")),
            CareerPlanId: TudcsPlanId,
            Code: "ISW201",
            Name: "Ingeniería de Software I (intro)",
            YearInPlan: 2, TermInYear: 2, TermKind: TermKind.Cuatrimestral,
            WeeklyHours: 5, TotalHours: 80),
        new SubjectRecord(
            Id: new SubjectId(Guid.Parse("00000004-0000-4000-a000-000000000013")),
            CareerPlanId: TudcsPlanId,
            Code: "BD201",
            Name: "Bases de Datos I",
            YearInPlan: 2, TermInYear: 2, TermKind: TermKind.Cuatrimestral,
            WeeklyHours: 5, TotalHours: 80),
        new SubjectRecord(
            Id: new SubjectId(Guid.Parse("00000004-0000-4000-a000-000000000014")),
            CareerPlanId: TudcsPlanId,
            Code: "SO201",
            Name: "Sistemas Operativos",
            YearInPlan: 2, TermInYear: 2, TermKind: TermKind.Cuatrimestral,
            WeeklyHours: 5, TotalHours: 80),

        // 3er año
        new SubjectRecord(
            Id: new SubjectId(Guid.Parse("00000004-0000-4000-a000-000000000020")),
            CareerPlanId: TudcsPlanId,
            Code: "ISW301",
            Name: "Ingeniería de Software I",
            YearInPlan: 3, TermInYear: 1, TermKind: TermKind.Cuatrimestral,
            WeeklyHours: 6, TotalHours: 96),
        new SubjectRecord(
            Id: new SubjectId(Guid.Parse("00000004-0000-4000-a000-000000000021")),
            CareerPlanId: TudcsPlanId,
            Code: "BD301",
            Name: "Bases de Datos II",
            YearInPlan: 3, TermInYear: 1, TermKind: TermKind.Cuatrimestral,
            WeeklyHours: 5, TotalHours: 80),
        new SubjectRecord(
            Id: new SubjectId(Guid.Parse("00000004-0000-4000-a000-000000000022")),
            CareerPlanId: TudcsPlanId,
            Code: "ARQ301",
            Name: "Arquitectura de Computadoras",
            YearInPlan: 3, TermInYear: 1, TermKind: TermKind.Cuatrimestral,
            WeeklyHours: 5, TotalHours: 80),
        new SubjectRecord(
            Id: new SubjectId(Guid.Parse("00000004-0000-4000-a000-000000000023")),
            CareerPlanId: TudcsPlanId,
            Code: "REDES301",
            Name: "Redes de Computadoras",
            YearInPlan: 3, TermInYear: 2, TermKind: TermKind.Cuatrimestral,
            WeeklyHours: 5, TotalHours: 80),
        new SubjectRecord(
            Id: new SubjectId(Guid.Parse("00000004-0000-4000-a000-000000000024")),
            CareerPlanId: TudcsPlanId,
            Code: "ISW302",
            Name: "Ingeniería de Software II",
            YearInPlan: 3, TermInYear: 2, TermKind: TermKind.Cuatrimestral,
            WeeklyHours: 6, TotalHours: 96),
    };

    // ====================================================================
    // AcademicTerms (UNSTA cuatrimestrales 2024-2026)
    //
    // Cobertura: 6 cuatrimestres consecutivos (2024-1c hasta 2026-2c). Cubre los EnrollmentRecord
    // mockeados en el tab Historial + el cuatrimestre actual donde se cargaría una materia nueva.
    // Las fechas son aproximaciones del calendario académico UNSTA típico.
    //
    // Convención de UUIDs:
    //   - AcademicTerms: 00000005-0000-4000-a000-YYYYNNQQ00 donde YYYY=año, NN=número (01/02), QQ=cero
    //   simplificada: ...0000NN donde NN = year_offset*2 + number (2024-1c=01, 2024-2c=02, ...).
    // ====================================================================

    public static IReadOnlyList<AcademicTermRecord> AcademicTerms { get; } = new[]
    {
        new AcademicTermRecord(
            Id: new AcademicTermId(Guid.Parse("00000005-0000-4000-a000-000000000001")),
            UniversityId: Unsta.Id,
            Year: 2024, Number: 1, Kind: TermKind.Cuatrimestral,
            StartDate: new DateOnly(2024, 3, 11),
            EndDate: new DateOnly(2024, 7, 6),
            EnrollmentOpens: new DateTimeOffset(2024, 2, 19, 0, 0, 0, TimeSpan.Zero),
            EnrollmentCloses: new DateTimeOffset(2024, 3, 8, 23, 59, 59, TimeSpan.Zero),
            Label: "2024·1c"),
        new AcademicTermRecord(
            Id: new AcademicTermId(Guid.Parse("00000005-0000-4000-a000-000000000002")),
            UniversityId: Unsta.Id,
            Year: 2024, Number: 2, Kind: TermKind.Cuatrimestral,
            StartDate: new DateOnly(2024, 8, 5),
            EndDate: new DateOnly(2024, 11, 30),
            EnrollmentOpens: new DateTimeOffset(2024, 7, 15, 0, 0, 0, TimeSpan.Zero),
            EnrollmentCloses: new DateTimeOffset(2024, 8, 2, 23, 59, 59, TimeSpan.Zero),
            Label: "2024·2c"),
        new AcademicTermRecord(
            Id: new AcademicTermId(Guid.Parse("00000005-0000-4000-a000-000000000003")),
            UniversityId: Unsta.Id,
            Year: 2025, Number: 1, Kind: TermKind.Cuatrimestral,
            StartDate: new DateOnly(2025, 3, 10),
            EndDate: new DateOnly(2025, 7, 5),
            EnrollmentOpens: new DateTimeOffset(2025, 2, 17, 0, 0, 0, TimeSpan.Zero),
            EnrollmentCloses: new DateTimeOffset(2025, 3, 7, 23, 59, 59, TimeSpan.Zero),
            Label: "2025·1c"),
        new AcademicTermRecord(
            Id: new AcademicTermId(Guid.Parse("00000005-0000-4000-a000-000000000004")),
            UniversityId: Unsta.Id,
            Year: 2025, Number: 2, Kind: TermKind.Cuatrimestral,
            StartDate: new DateOnly(2025, 8, 4),
            EndDate: new DateOnly(2025, 11, 29),
            EnrollmentOpens: new DateTimeOffset(2025, 7, 14, 0, 0, 0, TimeSpan.Zero),
            EnrollmentCloses: new DateTimeOffset(2025, 8, 1, 23, 59, 59, TimeSpan.Zero),
            Label: "2025·2c"),
        new AcademicTermRecord(
            Id: new AcademicTermId(Guid.Parse("00000005-0000-4000-a000-000000000005")),
            UniversityId: Unsta.Id,
            Year: 2026, Number: 1, Kind: TermKind.Cuatrimestral,
            StartDate: new DateOnly(2026, 3, 9),
            EndDate: new DateOnly(2026, 7, 4),
            EnrollmentOpens: new DateTimeOffset(2026, 2, 16, 0, 0, 0, TimeSpan.Zero),
            EnrollmentCloses: new DateTimeOffset(2026, 3, 6, 23, 59, 59, TimeSpan.Zero),
            Label: "2026·1c"),
        new AcademicTermRecord(
            Id: new AcademicTermId(Guid.Parse("00000005-0000-4000-a000-000000000006")),
            UniversityId: Unsta.Id,
            Year: 2026, Number: 2, Kind: TermKind.Cuatrimestral,
            StartDate: new DateOnly(2026, 8, 3),
            EndDate: new DateOnly(2026, 11, 28),
            EnrollmentOpens: new DateTimeOffset(2026, 7, 13, 0, 0, 0, TimeSpan.Zero),
            EnrollmentCloses: new DateTimeOffset(2026, 7, 31, 23, 59, 59, TimeSpan.Zero),
            Label: "2026·2c"),
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

/// <summary>
/// Materia del seed. <see cref="CareerPlanId"/> apunta al plan al que pertenece (típicamente
/// uno solo en MVP: la TUDCS UNSTA, ya que es el caso de uso piloto US-013).
/// </summary>
public sealed record SubjectRecord(
    SubjectId Id,
    CareerPlanId CareerPlanId,
    string Code,
    string Name,
    int YearInPlan,
    int? TermInYear,
    TermKind TermKind,
    int WeeklyHours,
    int TotalHours);

/// <summary>
/// Período lectivo del seed. UUIDs determinísticos para consistencia entre runs y referencias
/// estables desde fixtures de tests. Convención de label per uni: UNSTA usa "YYYY·Nc" para
/// cuatrimestres (ej. "2026·1c").
/// </summary>
public sealed record AcademicTermRecord(
    AcademicTermId Id,
    UniversityId UniversityId,
    int Year,
    int Number,
    TermKind Kind,
    DateOnly StartDate,
    DateOnly EndDate,
    DateTimeOffset EnrollmentOpens,
    DateTimeOffset EnrollmentCloses,
    string Label);
