using Planb.Academic.Domain;
using Planb.Academic.Domain.AcademicTerms;
using Planb.Academic.Domain.CareerPlans;
using Planb.Academic.Domain.Careers;
using Planb.Academic.Domain.Commissions;
using Planb.Academic.Domain.Prerequisites;
using Planb.Academic.Domain.Subjects;
using Planb.Academic.Domain.Teachers;
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
        Slug: "unsta",
        InstitutionalEmailDomains: new[] { "unsta.edu.ar" });

    public static readonly UniversityRecord Siglo21 = new(
        Id: new UniversityId(Guid.Parse("00000001-0000-4000-a000-000000000002")),
        Name: "Universidad Siglo 21",
        Slug: "siglo21",
        InstitutionalEmailDomains: new[] { "ues21.edu.ar" });

    public static readonly UniversityRecord Unt = new(
        Id: new UniversityId(Guid.Parse("00000001-0000-4000-a000-000000000003")),
        Name: "Universidad Nacional de Tucumán",
        Slug: "unt",
        InstitutionalEmailDomains: new[] { "unt.edu.ar" });

    public static readonly UniversityRecord UtnFrt = new(
        Id: new UniversityId(Guid.Parse("00000001-0000-4000-a000-000000000004")),
        Name: "Universidad Tecnológica Nacional - Facultad Regional Tucumán",
        Slug: "utn-frt",
        InstitutionalEmailDomains: new[] { "frt.utn.edu.ar" });

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
    // Subjects (TUDCS UNSTA, plan de estudios real, aportado por el dueño del proyecto, que cursa
    // la carrera). 21 materias: 9 de 1er año, 8 de 2do año, 4 de 3ro.
    //
    // TermInYear: las Anuales van con null (invariante del aggregate, ver Subject.Validate). Para
    // las cuatrimestrales, el plan no discrimina 1er/2do cuatrimestre por materia: el dato se
    // infiere del código, asumiendo que el segundo dígito marca el cuatrimestre (11X/21X/31X → 1,
    // 12X/22X → 2). "102 Álgebra I" es la excepción (no encaja en X1X ni X2X): va al 1er
    // cuatrimestre porque su continuación (122 Álgebra II) ya ocupa el 2do.
    //
    // Convención de UUIDs:
    //   - Subjects: 00000004-0000-4000-a000-0000000000NN, NN secuencial en el orden del plan real
    //   (1er año 01-09, 2do año 10-17, 3er año 18-21). Reemplaza la convención anterior (bandas de
    //   a diez por año): con 21 materias reales no sobra margen para reservar huecos.
    // ====================================================================

    private static readonly CareerPlanId TudcsPlanId =
        new(Guid.Parse("00000003-0000-4000-a000-000000000003"));

    public static IReadOnlyList<SubjectRecord> Subjects { get; } = new[]
    {
        // ---------- 1er año ----------
        new SubjectRecord(
            Id: new SubjectId(Guid.Parse("00000004-0000-4000-a000-000000000001")),
            CareerPlanId: TudcsPlanId,
            Code: "101",
            Name: "Algoritmos y Paradigmas",
            YearInPlan: 1, TermInYear: null, TermKind: TermKind.Anual,
            WeeklyHours: 3, TotalHours: 84),
        new SubjectRecord(
            Id: new SubjectId(Guid.Parse("00000004-0000-4000-a000-000000000002")),
            CareerPlanId: TudcsPlanId,
            Code: "102",
            Name: "Álgebra I",
            YearInPlan: 1, TermInYear: 1, TermKind: TermKind.Cuatrimestral,
            WeeklyHours: 4, TotalHours: 56),
        new SubjectRecord(
            Id: new SubjectId(Guid.Parse("00000004-0000-4000-a000-000000000003")),
            CareerPlanId: TudcsPlanId,
            Code: "103",
            Name: "Inglés A1",
            YearInPlan: 1, TermInYear: null, TermKind: TermKind.Anual,
            WeeklyHours: 4, TotalHours: 112),
        new SubjectRecord(
            Id: new SubjectId(Guid.Parse("00000004-0000-4000-a000-000000000004")),
            CareerPlanId: TudcsPlanId,
            Code: "104",
            Name: "Formación Humanística I",
            YearInPlan: 1, TermInYear: null, TermKind: TermKind.Anual,
            WeeklyHours: 3, TotalHours: 84),
        new SubjectRecord(
            Id: new SubjectId(Guid.Parse("00000004-0000-4000-a000-000000000005")),
            CareerPlanId: TudcsPlanId,
            Code: "111",
            Name: "Desarrollo de Software",
            YearInPlan: 1, TermInYear: 1, TermKind: TermKind.Cuatrimestral,
            WeeklyHours: 3, TotalHours: 42),
        new SubjectRecord(
            Id: new SubjectId(Guid.Parse("00000004-0000-4000-a000-000000000006")),
            CareerPlanId: TudcsPlanId,
            Code: "113",
            Name: "Gestión de RR.HH",
            YearInPlan: 1, TermInYear: 1, TermKind: TermKind.Cuatrimestral,
            WeeklyHours: 3, TotalHours: 42),
        new SubjectRecord(
            Id: new SubjectId(Guid.Parse("00000004-0000-4000-a000-000000000007")),
            CareerPlanId: TudcsPlanId,
            Code: "121",
            Name: "Base de datos",
            YearInPlan: 1, TermInYear: 2, TermKind: TermKind.Cuatrimestral,
            WeeklyHours: 3, TotalHours: 42),
        new SubjectRecord(
            Id: new SubjectId(Guid.Parse("00000004-0000-4000-a000-000000000008")),
            CareerPlanId: TudcsPlanId,
            Code: "122",
            Name: "Álgebra II",
            YearInPlan: 1, TermInYear: 2, TermKind: TermKind.Cuatrimestral,
            WeeklyHours: 4, TotalHours: 56),
        new SubjectRecord(
            Id: new SubjectId(Guid.Parse("00000004-0000-4000-a000-000000000009")),
            CareerPlanId: TudcsPlanId,
            Code: "123",
            Name: "Seminario Informático I",
            YearInPlan: 1, TermInYear: 2, TermKind: TermKind.Cuatrimestral,
            WeeklyHours: 3, TotalHours: 42),

        // ---------- 2do año ----------
        new SubjectRecord(
            Id: new SubjectId(Guid.Parse("00000004-0000-4000-a000-000000000010")),
            CareerPlanId: TudcsPlanId,
            Code: "201",
            Name: "Inglés A2",
            YearInPlan: 2, TermInYear: null, TermKind: TermKind.Anual,
            WeeklyHours: 4, TotalHours: 112),
        new SubjectRecord(
            Id: new SubjectId(Guid.Parse("00000004-0000-4000-a000-000000000011")),
            CareerPlanId: TudcsPlanId,
            Code: "202",
            Name: "Formación Humanística II",
            YearInPlan: 2, TermInYear: null, TermKind: TermKind.Anual,
            WeeklyHours: 4, TotalHours: 112),
        new SubjectRecord(
            Id: new SubjectId(Guid.Parse("00000004-0000-4000-a000-000000000012")),
            CareerPlanId: TudcsPlanId,
            Code: "211",
            Name: "Fundamentos de Control de Calidad",
            YearInPlan: 2, TermInYear: 1, TermKind: TermKind.Cuatrimestral,
            WeeklyHours: 4, TotalHours: 56),
        new SubjectRecord(
            Id: new SubjectId(Guid.Parse("00000004-0000-4000-a000-000000000013")),
            CareerPlanId: TudcsPlanId,
            Code: "212",
            Name: "Seminario Informático II",
            YearInPlan: 2, TermInYear: 1, TermKind: TermKind.Cuatrimestral,
            WeeklyHours: 3, TotalHours: 42),
        new SubjectRecord(
            Id: new SubjectId(Guid.Parse("00000004-0000-4000-a000-000000000014")),
            CareerPlanId: TudcsPlanId,
            Code: "213",
            Name: "Desarrollo Front End",
            YearInPlan: 2, TermInYear: 1, TermKind: TermKind.Cuatrimestral,
            WeeklyHours: 6, TotalHours: 84),
        new SubjectRecord(
            Id: new SubjectId(Guid.Parse("00000004-0000-4000-a000-000000000015")),
            CareerPlanId: TudcsPlanId,
            Code: "221",
            Name: "Control de Calidad Avanzado",
            YearInPlan: 2, TermInYear: 2, TermKind: TermKind.Cuatrimestral,
            WeeklyHours: 4, TotalHours: 56),
        new SubjectRecord(
            Id: new SubjectId(Guid.Parse("00000004-0000-4000-a000-000000000016")),
            CareerPlanId: TudcsPlanId,
            Code: "222",
            Name: "Seminario Informático III",
            YearInPlan: 2, TermInYear: 2, TermKind: TermKind.Cuatrimestral,
            WeeklyHours: 3, TotalHours: 42),
        new SubjectRecord(
            Id: new SubjectId(Guid.Parse("00000004-0000-4000-a000-000000000017")),
            CareerPlanId: TudcsPlanId,
            Code: "223",
            Name: "Desarrollo Back End",
            YearInPlan: 2, TermInYear: 2, TermKind: TermKind.Cuatrimestral,
            WeeklyHours: 6, TotalHours: 84),

        // ---------- 3er año ----------
        new SubjectRecord(
            Id: new SubjectId(Guid.Parse("00000004-0000-4000-a000-000000000018")),
            CareerPlanId: TudcsPlanId,
            Code: "311",
            Name: "Desarrollo de Aplicaciones Web",
            YearInPlan: 3, TermInYear: 1, TermKind: TermKind.Cuatrimestral,
            WeeklyHours: 5, TotalHours: 70),
        new SubjectRecord(
            Id: new SubjectId(Guid.Parse("00000004-0000-4000-a000-000000000019")),
            CareerPlanId: TudcsPlanId,
            Code: "312",
            Name: "Testeo Automatizado",
            YearInPlan: 3, TermInYear: 1, TermKind: TermKind.Cuatrimestral,
            WeeklyHours: 3, TotalHours: 42),
        new SubjectRecord(
            Id: new SubjectId(Guid.Parse("00000004-0000-4000-a000-000000000020")),
            CareerPlanId: TudcsPlanId,
            Code: "313",
            Name: "Inglés B1:1",
            YearInPlan: 3, TermInYear: 1, TermKind: TermKind.Cuatrimestral,
            WeeklyHours: 3, TotalHours: 42),
        new SubjectRecord(
            Id: new SubjectId(Guid.Parse("00000004-0000-4000-a000-000000000021")),
            CareerPlanId: TudcsPlanId,
            Code: "314",
            Name: "Proyecto Final",
            YearInPlan: 3, TermInYear: 1, TermKind: TermKind.Cuatrimestral,
            // 0 hs semanales es correcto (no es una cursada con horario fijo, ver
            // Subject.Validate): no lo "corrijas" a 1. 350 hs totales.
            WeeklyHours: 0, TotalHours: 350),
    };

    // ====================================================================
    // Prerequisites (correlativas, ADR-0003). 16 parejas reales cargadas dos veces, una por type:
    // ParaCursar (para inscribirte a cursar necesitás la previa regularizada) y ParaRendir (para
    // rendir el final necesitás la previa aprobada). No es redundante: son dos grafos separados
    // sobre los mismos subjects, y la PK (subject_id, required_subject_id, type) permite
    // justamente que la misma pareja aparezca en los dos.
    //
    // Procedencia del dato: las primeras 7 parejas salen de la nomenclatura del plan (I, II, III
    // son entregas sucesivas de la misma materia). Las 9 restantes son inferidas por dependencia
    // técnica (una requiere lo que la otra enseña), no un régimen de correlatividades oficial: el
    // plan aportado no incluye ese detalle.
    // ====================================================================

    private static IReadOnlyList<(string SubjectNn, string RequiredNn)> PrerequisitePairs { get; } = new[]
    {
        // Nomenclatura del plan (I, II, III).
        ("08", "02"), // 122 Álgebra II ← 102 Álgebra I
        ("10", "03"), // 201 Inglés A2 ← 103 Inglés A1
        ("20", "10"), // 313 Inglés B1:1 ← 201 Inglés A2
        ("11", "04"), // 202 Formación Humanística II ← 104 Formación Humanística I
        ("13", "09"), // 212 Seminario Informático II ← 123 Seminario Informático I
        ("16", "13"), // 222 Seminario Informático III ← 212 Seminario Informático II
        ("15", "12"), // 221 Control de Calidad Avanzado ← 211 Fundamentos de Control de Calidad

        // Inferidas por dependencia técnica (no vienen de la nomenclatura del plan).
        ("05", "01"), // 111 Desarrollo de Software ← 101 Algoritmos y Paradigmas
        ("14", "05"), // 213 Desarrollo Front End ← 111 Desarrollo de Software
        ("17", "05"), // 223 Desarrollo Back End ← 111 Desarrollo de Software
        ("17", "07"), // 223 Desarrollo Back End ← 121 Base de datos
        ("18", "14"), // 311 Desarrollo de Aplicaciones Web ← 213 Desarrollo Front End
        ("18", "17"), // 311 Desarrollo de Aplicaciones Web ← 223 Desarrollo Back End
        ("19", "12"), // 312 Testeo Automatizado ← 211 Fundamentos de Control de Calidad
        ("21", "18"), // 314 Proyecto Final ← 311 Desarrollo de Aplicaciones Web
        ("21", "15"), // 314 Proyecto Final ← 221 Control de Calidad Avanzado
    };

    public static IReadOnlyList<PrerequisiteRecord> Prerequisites { get; } = BuildPrerequisites();

    private static IReadOnlyList<PrerequisiteRecord> BuildPrerequisites()
    {
        var records = new List<PrerequisiteRecord>();
        foreach (var (subjectNn, requiredNn) in PrerequisitePairs)
        {
            var subjectId = Sid(subjectNn);
            var requiredId = Sid(requiredNn);
            records.Add(new PrerequisiteRecord(subjectId, requiredId, PrerequisiteType.ParaCursar));
            records.Add(new PrerequisiteRecord(subjectId, requiredId, PrerequisiteType.ParaRendir));
        }

        return records;
    }

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

    // ====================================================================
    // Teachers (UNSTA): catálogo docente demo (US-063). Nombres en lowercase
    // (storage); el display los pasa a title case. Sin claim/verificación: son
    // del catálogo, no perfiles reclamados (eso es US-030/031, otro vertical).
    //
    // Convención de UUIDs:
    //   - Teachers: 00000006-0000-4000-a000-0000000000NN
    // ====================================================================
    public static IReadOnlyList<TeacherRecord> Teachers { get; } = new[]
    {
        new TeacherRecord(Tid("01"), Unsta.Id, "carlos", "brandt", "Profesor Titular"),
        new TeacherRecord(Tid("02"), Unsta.Id, "ana", "iturralde", "Profesora Adjunta"),
        new TeacherRecord(Tid("03"), Unsta.Id, "marta", "reynoso", "Profesora Titular"),
        new TeacherRecord(Tid("04"), Unsta.Id, "diego", "sosa", "Jefe de Trabajos Prácticos"),
        new TeacherRecord(Tid("05"), Unsta.Id, "laura", "castellanos", "Profesora Adjunta"),
        new TeacherRecord(Tid("06"), Unsta.Id, "jorge", "castro", "Profesor Titular"),
        new TeacherRecord(Tid("07"), Unsta.Id, "silvia", "méndez", "Profesora Adjunta"),
        new TeacherRecord(Tid("08"), Unsta.Id, "roberto", "páez", "Jefe de Trabajos Prácticos"),
        new TeacherRecord(Tid("09"), Unsta.Id, "verónica", "ledesma", "Profesora Titular"),
        new TeacherRecord(Tid("0a"), Unsta.Id, "hernán", "quiroga", "Profesor Adjunto"),
    };

    private static TeacherId Tid(string nn) =>
        new(Guid.Parse($"00000006-0000-4000-a000-0000000000{nn}"));

    // ====================================================================
    // Commissions + CommissionTeachers (UNSTA): oferta demo (US-065). Cada comisión cuelga de un
    // Subject TUDCS + un AcademicTerm UNSTA, con docentes del catálogo asignados por rol. Todo
    // UNSTA, así la coherencia universitaria total y term_kind (Cuatrimestral) se sostienen.
    // Habilita "docente real por reseña": las reseñas demo van a anclar su docente a uno de estos.
    //
    // Convención de UUIDs:
    //   - Commissions: 00000007-0000-4000-a000-0000000000NN
    //   - CommissionTeachers: sin id propio (PK compuesta commission_id + teacher_id).
    // ====================================================================
    public static IReadOnlyList<CommissionRecord> Commissions { get; } = new[]
    {
        // Desarrollo de Software (111) · 2026·1c: dos comisiones, distinta modalidad.
        new CommissionRecord(Cid("01"), Sid("05"), Atid("05"), "A", CommissionModality.Presencial, 40, null,
            new[]
            {
                new CommissionTeacherRecord(Tid("01"), CommissionTeacherRole.Titular), // brandt
                new CommissionTeacherRecord(Tid("04"), CommissionTeacherRole.Jtp),     // sosa
            }),
        new CommissionRecord(Cid("02"), Sid("05"), Atid("05"), "B (Virtual)", CommissionModality.Virtual, 60, null,
            new[]
            {
                new CommissionTeacherRecord(Tid("03"), CommissionTeacherRole.Titular),  // reynoso
                new CommissionTeacherRecord(Tid("0a"), CommissionTeacherRole.Ayudante), // quiroga
            }),

        // Algoritmos y Paradigmas (101) · 2026·1c.
        new CommissionRecord(Cid("03"), Sid("01"), Atid("05"), "Mañana", CommissionModality.Presencial, 35, null,
            new[]
            {
                new CommissionTeacherRecord(Tid("02"), CommissionTeacherRole.Titular), // iturralde
            }),

        // Desarrollo Back End (223) · 2025·2c.
        new CommissionRecord(Cid("04"), Sid("17"), Atid("04"), "Noche", CommissionModality.Hibrida, null, null,
            new[]
            {
                new CommissionTeacherRecord(Tid("06"), CommissionTeacherRole.Titular), // castro
                new CommissionTeacherRecord(Tid("05"), CommissionTeacherRole.Adjunto), // castellanos
            }),

        // Base de datos (121) · 2025·2c.
        new CommissionRecord(Cid("05"), Sid("07"), Atid("04"), "U1", CommissionModality.Presencial, 30, null,
            new[]
            {
                new CommissionTeacherRecord(Tid("07"), CommissionTeacherRole.Titular), // méndez
                new CommissionTeacherRecord(Tid("08"), CommissionTeacherRole.Jtp),     // páez
            }),

        // Inglés B1:1 (313) · 2026·1c. brandt acá es adjunto (mismo docente, otra comisión).
        new CommissionRecord(Cid("06"), Sid("20"), Atid("05"), "A", CommissionModality.Presencial, 25, null,
            new[]
            {
                new CommissionTeacherRecord(Tid("09"), CommissionTeacherRole.Titular), // ledesma
                new CommissionTeacherRecord(Tid("01"), CommissionTeacherRole.Adjunto), // brandt
            }),

        // Comisiones adicionales (una por materia) en 2026·1c, coherentes con el mapeo docente del
        // demo corpus. Amplían la oferta reseñable: cada (materia, term) con comisión es una cursada
        // que un alumno puede reseñar (docente real por reseña), y dan headroom a los E2E.
        new CommissionRecord(Cid("07"), Sid("02"), Atid("05"), "A", CommissionModality.Presencial, 40, null,
            new[] { new CommissionTeacherRecord(Tid("03"), CommissionTeacherRole.Titular) }), // álgebra I (102): reynoso
        new CommissionRecord(Cid("08"), Sid("09"), Atid("05"), "A", CommissionModality.Presencial, 40, null,
            new[] { new CommissionTeacherRecord(Tid("09"), CommissionTeacherRole.Titular) }), // seminario informático I (123): ledesma
        new CommissionRecord(Cid("09"), Sid("14"), Atid("05"), "A", CommissionModality.Presencial, 35, null,
            new[] { new CommissionTeacherRecord(Tid("08"), CommissionTeacherRole.Titular) }), // desarrollo front end (213): páez
        new CommissionRecord(Cid("0a"), Sid("11"), Atid("05"), "A", CommissionModality.Presencial, 35, null,
            new[] { new CommissionTeacherRecord(Tid("0a"), CommissionTeacherRole.Titular) }), // formación humanística II (202): quiroga
    };

    private static SubjectId Sid(string nn) =>
        new(Guid.Parse($"00000004-0000-4000-a000-0000000000{nn}"));

    private static AcademicTermId Atid(string nn) =>
        new(Guid.Parse($"00000005-0000-4000-a000-0000000000{nn}"));

    private static CommissionId Cid(string nn) =>
        new(Guid.Parse($"00000007-0000-4000-a000-0000000000{nn}"));
}

/// <summary>Datos planos de una University del seed.</summary>
public sealed record UniversityRecord(
    UniversityId Id, string Name, string Slug, IReadOnlyList<string> InstitutionalEmailDomains);

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
/// Correlativa del seed: <see cref="SubjectId"/> requiere a <see cref="RequiredSubjectId"/> según
/// <see cref="Type"/> (ADR-0003). Análogo de <see cref="Prerequisites.Prerequisite"/> pero sin
/// <c>CreatedAt</c>: el seeder le pone la fecha al hidratar, igual que con el resto de los records.
/// </summary>
public sealed record PrerequisiteRecord(SubjectId SubjectId, SubjectId RequiredSubjectId, PrerequisiteType Type);

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

/// <summary>
/// Docente del seed. Nombres en lowercase (storage). UUIDs determinísticos para referencias
/// estables (las reseñas demo van a apuntar a estos ids cuando aterrice "docente real por reseña").
/// </summary>
public sealed record TeacherRecord(
    TeacherId Id, UniversityId UniversityId, string FirstName, string LastName, string? Title);

/// <summary>
/// Comisión del seed con sus docentes embebidos. UUIDs determinísticos. <see cref="SubjectId"/> y
/// <see cref="TermId"/> son las refs cross-aggregate (el aggregate las guarda como Guid plano).
/// </summary>
public sealed record CommissionRecord(
    CommissionId Id,
    SubjectId SubjectId,
    AcademicTermId TermId,
    string Name,
    CommissionModality Modality,
    int? Capacity,
    string? Notes,
    IReadOnlyList<CommissionTeacherRecord> Teachers);

/// <summary>Asignación docente del seed (par teacher + rol dentro de una comisión).</summary>
public sealed record CommissionTeacherRecord(TeacherId TeacherId, CommissionTeacherRole Role);
