using Planb.Academic.Domain;
using Planb.Academic.Domain.AcademicTerms;
using Planb.Academic.Domain.AcademicUnits;
using Planb.Academic.Domain.CareerPlans;
using Planb.Academic.Domain.Careers;
using Planb.Academic.Domain.Chairs;
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
///   - Universities:   00000001-0000-4000-a000-0000000000NN
///   - Careers:        00000002-0000-4000-a000-0000000000NN (o 0000000NNN para el bulk de R6,
///     ver el comentario de la sección Careers)
///   - CareerPlans:    00000003-0000-4000-a000-0000000000NN (mismo NN que su Career)
///   - AcademicUnits:  00000007-0000-4000-a000-0000000000NN (R6, tarea 19), NN secuencial
///     agrupado por universidad en el mismo orden que Universities
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

    // Universidad Siglo 21 salió (R6): la Guía SIU no le lista sede en Tucumán, solo un centro de
    // aprendizaje a distancia, y R6 dejó la oferta a distancia fuera de alcance (ver el
    // relevamiento, docs/history/reviews/2026-09-07-official-data-survey.md). El id
    // 00000001-...-000000000002 queda retirado, no reasignado.

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

    /// <summary>
    /// Universidad de San Pablo-T (R6): la Guía SIU la lista con 20 ofertas en la provincia, sin
    /// programación (su tecnicatura en Ciencia de Datos es a distancia y queda fuera). Dominio de
    /// mail institucional tomado de las columnas "mail" del CSV (gbravo@, eflores@, wcorrea@uspt.edu.ar).
    /// </summary>
    public static readonly UniversityRecord UspT = new(
        Id: new UniversityId(Guid.Parse("00000001-0000-4000-a000-000000000005")),
        Name: "Universidad de San Pablo-T",
        Slug: "uspt",
        InstitutionalEmailDomains: new[] { "uspt.edu.ar" });

    /// <summary>
    /// Universidad Nacional de Santiago del Estero (R6): no estaba sembrada (K02). La Guía SIU le
    /// lista 7 ofertas en la provincia, ninguna informática, repartidas en tres sedes/facultades
    /// distintas (Centro de Estudios del Tucumán, Instituto de Educación Superior Sisaiani, y la
    /// sede de Villa Quinteros); cada una cuelga de su propia AcademicUnit (tarea 19).
    /// </summary>
    public static readonly UniversityRecord Unse = new(
        Id: new UniversityId(Guid.Parse("00000001-0000-4000-a000-000000000006")),
        Name: "Universidad Nacional de Santiago del Estero",
        Slug: "unse",
        InstitutionalEmailDomains: new[] { "unse.edu.ar" });

    public static IReadOnlyList<UniversityRecord> Universities { get; } = new[]
    {
        Unsta, Unt, UtnFrt, UspT, Unse,
    };

    // ====================================================================
    // AcademicUnits: una por (universidad, facultad) de la Guia SIU (R6, tarea 19). El
    // domicilio se guarda tal como lo publica la fuente; la localidad normalizada la completa
    // el resolvedor de Georef al sembrar (ver AcademicSeeder), no se hardcodea aca.
    // ====================================================================

    // ---------- UNSTA ----------
    public static readonly AcademicUnitRecord AuCentroUniversitarioConcepcion = new(
        Id: new AcademicUnitId(Guid.Parse("00000007-0000-4000-a000-000000000001")),
        UniversityId: Unsta.Id,
        Name: "Centro Universitario Concepción",
        Slug: "centro-universitario-concepcion",
        Address: "Roca 37 - Concepcion - Tucumán");

    public static readonly AcademicUnitRecord AuFacultadDeCienciasDeLaSalud = new(
        Id: new AcademicUnitId(Guid.Parse("00000007-0000-4000-a000-000000000002")),
        UniversityId: Unsta.Id,
        Name: "Facultad de Ciencias de la Salud",
        Slug: "facultad-de-ciencias-de-la-salud",
        Address: "Av. Perón 2085 - Yerba Buena - Tucumán");

    public static readonly AcademicUnitRecord AuFacultadDeCienciasJuridicasPoliticasYSociales = new(
        Id: new AcademicUnitId(Guid.Parse("00000007-0000-4000-a000-000000000003")),
        UniversityId: Unsta.Id,
        Name: "Facultad de Ciencias Juridicas, Politicas y Sociales",
        Slug: "facultad-de-ciencias-juridicas-politicas-y-sociales",
        Address: "9 de Julio 165 - San Miguel De Tucuman - Tucumán");

    public static readonly AcademicUnitRecord AuFacultadDeEconomiaYAdministracion = new(
        Id: new AcademicUnitId(Guid.Parse("00000007-0000-4000-a000-000000000004")),
        UniversityId: Unsta.Id,
        Name: "Facultad de Economía y Administración",
        Slug: "facultad-de-economia-y-administracion",
        Address: "9 de Julio 165 - San Miguel De Tucuman - Tucumán");

    public static readonly AcademicUnitRecord AuFacultadDeHumanidades = new(
        Id: new AcademicUnitId(Guid.Parse("00000007-0000-4000-a000-000000000005")),
        UniversityId: Unsta.Id,
        Name: "Facultad de Humanidades",
        Slug: "facultad-de-humanidades",
        Address: "9 de Julio 165 - San Miguel De Tucuman - Tucumán");

    public static readonly AcademicUnitRecord AuFacultadDeIngenieria = new(
        Id: new AcademicUnitId(Guid.Parse("00000007-0000-4000-a000-000000000006")),
        UniversityId: Unsta.Id,
        Name: "Facultad de Ingeniería",
        Slug: "facultad-de-ingenieria",
        Address: "Av. Perón 2085 - Yerba Buena - Tucumán");

    // ---------- UNT ----------
    public static readonly AcademicUnitRecord AuCarreraDeKinesiologiaSedeMonteros = new(
        Id: new AcademicUnitId(Guid.Parse("00000007-0000-4000-a000-000000000007")),
        UniversityId: Unt.Id,
        Name: "Carrera de Kinesiología - Sede Monteros",
        Slug: "carrera-de-kinesiologia-sede-monteros",
        Address: "Sarmiento y Pje. Día SN - Cap. Caceres - Tucumán");

    public static readonly AcademicUnitRecord AuEscuelaDeEnfermeria = new(
        Id: new AcademicUnitId(Guid.Parse("00000007-0000-4000-a000-000000000008")),
        UniversityId: Unt.Id,
        Name: "Escuela de Enfermería",
        Slug: "escuela-de-enfermeria",
        Address: "General Paz 875 - San Miguel De Tucuman - Tucumán");

    public static readonly AcademicUnitRecord AuEscuelaDeEnfermeriaConvenioBellaVista = new(
        Id: new AcademicUnitId(Guid.Parse("00000007-0000-4000-a000-000000000009")),
        UniversityId: Unt.Id,
        Name: "Escuela de Enfermería Convenio Bella Vista",
        Slug: "escuela-de-enfermeria-convenio-bella-vista",
        Address: "General Paz 884 - San Miguel De Tucuman - Tucumán");

    public static readonly AcademicUnitRecord AuEscuelaDeEnfermeriaConvenioFamailla = new(
        Id: new AcademicUnitId(Guid.Parse("00000007-0000-4000-a000-00000000000a")),
        UniversityId: Unt.Id,
        Name: "Escuela de Enfermería Convenio Famaillá",
        Slug: "escuela-de-enfermeria-convenio-famailla",
        Address: "General Paz 884 - San Miguel De Tucuman - Tucumán");

    public static readonly AcademicUnitRecord AuEscuelaUniversitariaDeCineVideoYTelevision = new(
        Id: new AcademicUnitId(Guid.Parse("00000007-0000-4000-a000-00000000000b")),
        UniversityId: Unt.Id,
        Name: "Escuela Universitaria de Cine, Video y Televisión",
        Slug: "escuela-universitaria-de-cine-video-y-television",
        Address: "Avda. Aconquija 729 - Yerba Buena - Tucumán");

    public static readonly AcademicUnitRecord AuFacultadDeAgronomiaYZootecniaConcepcion = new(
        Id: new AcademicUnitId(Guid.Parse("00000007-0000-4000-a000-00000000000c")),
        UniversityId: Unt.Id,
        Name: "Facultad de Agronomía y Zootecnia - Concepción",
        Slug: "facultad-de-agronomia-y-zootecnia-concepcion",
        Address: "Avenida Roca 1900 - San Miguel De Tucuman - Tucumán");

    public static readonly AcademicUnitRecord AuFacultadDeAgronomiaZootecniaYVeterinaria = new(
        Id: new AcademicUnitId(Guid.Parse("00000007-0000-4000-a000-00000000000d")),
        UniversityId: Unt.Id,
        Name: "Facultad de Agronomía, Zootecnia y Veterinaria",
        Slug: "facultad-de-agronomia-zootecnia-y-veterinaria",
        Address: "Avda Pte. Nestor Kirchner 1900 - San Miguel De Tucuman - Tucumán");

    public static readonly AcademicUnitRecord AuFacultadDeArquitecturaYUrbanismo = new(
        Id: new AcademicUnitId(Guid.Parse("00000007-0000-4000-a000-00000000000e")),
        UniversityId: Unt.Id,
        Name: "Facultad de Arquitectura y Urbanismo",
        Slug: "facultad-de-arquitectura-y-urbanismo",
        Address: "Av. Roca 1800 - San Miguel De Tucuman - Tucumán");

    public static readonly AcademicUnitRecord AuFacultadDeArtes = new(
        Id: new AcademicUnitId(Guid.Parse("00000007-0000-4000-a000-00000000000f")),
        UniversityId: Unt.Id,
        Name: "Facultad de Artes",
        Slug: "facultad-de-artes",
        Address: "Bolivar 700 - San Miguel De Tucuman - Tucumán");

    public static readonly AcademicUnitRecord AuFacultadDeBioquimicaQuimicaYFarmacia = new(
        Id: new AcademicUnitId(Guid.Parse("00000007-0000-4000-a000-000000000010")),
        UniversityId: Unt.Id,
        Name: "Facultad de Bioquímica, Química y Farmacia",
        Slug: "facultad-de-bioquimica-quimica-y-farmacia",
        Address: "Ayacucho 491 - San Miguel De Tucuman - Tucumán");

    public static readonly AcademicUnitRecord AuFacultadDeCienciasEconomicas = new(
        Id: new AcademicUnitId(Guid.Parse("00000007-0000-4000-a000-000000000011")),
        UniversityId: Unt.Id,
        Name: "Facultad de Ciencias Económicas",
        Slug: "facultad-de-ciencias-economicas",
        Address: "Av Independencia 1900 - San Miguel De Tucuman - Tucumán");

    public static readonly AcademicUnitRecord AuFacultadDeCienciasExactasYTecnologia = new(
        Id: new AcademicUnitId(Guid.Parse("00000007-0000-4000-a000-000000000012")),
        UniversityId: Unt.Id,
        Name: "Facultad de Ciencias Exactas y Tecnología",
        Slug: "facultad-de-ciencias-exactas-y-tecnologia",
        Address: "Av. Independencia 1800 - San Miguel De Tucuman - Tucumán");

    public static readonly AcademicUnitRecord AuFacultadDeCienciasNaturalesEInstitutoMiguelLillo = new(
        Id: new AcademicUnitId(Guid.Parse("00000007-0000-4000-a000-000000000013")),
        UniversityId: Unt.Id,
        Name: "Facultad de Ciencias Naturales e Instituto Miguel Lillo",
        Slug: "facultad-de-ciencias-naturales-e-instituto-miguel-lillo",
        Address: "Miguel Lillo 209 - San Miguel De Tucuman - Tucumán");

    public static readonly AcademicUnitRecord AuFacultadDeDerechoYCienciasSociales = new(
        Id: new AcademicUnitId(Guid.Parse("00000007-0000-4000-a000-000000000014")),
        UniversityId: Unt.Id,
        Name: "Facultad de Derecho y Ciencias Sociales",
        Slug: "facultad-de-derecho-y-ciencias-sociales",
        Address: "25 de Mayo 471 - San Miguel De Tucuman - Tucumán");

    public static readonly AcademicUnitRecord AuFacultadDeDerechoYCienciasSocialesConvenioBellaVista = new(
        Id: new AcademicUnitId(Guid.Parse("00000007-0000-4000-a000-000000000015")),
        UniversityId: Unt.Id,
        Name: "Facultad de Derecho y Ciencias Sociales Convenio Bella Vista",
        Slug: "facultad-de-derecho-y-ciencias-sociales-convenio-bella-vista",
        Address: "Sarmiento y Marconi -Bella Vista - Amaicha Del Llano - Tucumán");

    public static readonly AcademicUnitRecord AuFacultadDeDerechoYCienciasSocialesConvenioConcepcion = new(
        Id: new AcademicUnitId(Guid.Parse("00000007-0000-4000-a000-000000000016")),
        UniversityId: Unt.Id,
        Name: "Facultad de Derecho y Ciencias Sociales Convenio Concepción",
        Slug: "facultad-de-derecho-y-ciencias-sociales-convenio-concepcion",
        Address: "9 de Julio 112 - Concepcion - Tucumán");

    public static readonly AcademicUnitRecord AuFacultadDeDerechoYCienciasSocialesConvenioMonteros = new(
        Id: new AcademicUnitId(Guid.Parse("00000007-0000-4000-a000-000000000017")),
        UniversityId: Unt.Id,
        Name: "Facultad de Derecho y Ciencias Sociales Convenio Monteros",
        Slug: "facultad-de-derecho-y-ciencias-sociales-convenio-monteros",
        Address: "25 de Mayo 261 - Cap. Caceres - Tucumán");

    public static readonly AcademicUnitRecord AuFacultadDeDerechoYCienciasSocialesConvenioTrancas = new(
        Id: new AcademicUnitId(Guid.Parse("00000007-0000-4000-a000-000000000018")),
        UniversityId: Unt.Id,
        Name: "Facultad de Derecho y Ciencias Sociales Convenio Trancas",
        Slug: "facultad-de-derecho-y-ciencias-sociales-convenio-trancas",
        Address: "Avenida Irigoyen 126 - Leocadio Paz - Tucumán");

    public static readonly AcademicUnitRecord AuFacultadDeEducacionFisica = new(
        Id: new AcademicUnitId(Guid.Parse("00000007-0000-4000-a000-000000000019")),
        UniversityId: Unt.Id,
        Name: "Facultad de Educación Física",
        Slug: "facultad-de-educacion-fisica",
        Address: "Av. Benjamin Araoz 751 - San Miguel De Tucuman - Tucumán");

    public static readonly AcademicUnitRecord AuFacultadDeFilosofiaYLetras = new(
        Id: new AcademicUnitId(Guid.Parse("00000007-0000-4000-a000-00000000001a")),
        UniversityId: Unt.Id,
        Name: "Facultad de Filosofía y Letras",
        Slug: "facultad-de-filosofia-y-letras",
        Address: "Av. Benjamin Araoz 800 - San Miguel De Tucuman - Tucumán");

    public static readonly AcademicUnitRecord AuFacultadDeMedicina = new(
        Id: new AcademicUnitId(Guid.Parse("00000007-0000-4000-a000-00000000001b")),
        UniversityId: Unt.Id,
        Name: "Facultad de Medicina",
        Slug: "facultad-de-medicina",
        Address: "Lamadrid 875 - San Miguel De Tucuman - Tucumán");

    public static readonly AcademicUnitRecord AuFacultadDeOdontologia = new(
        Id: new AcademicUnitId(Guid.Parse("00000007-0000-4000-a000-00000000001c")),
        UniversityId: Unt.Id,
        Name: "Facultad de Odontología",
        Slug: "facultad-de-odontologia",
        Address: "Av. Benjamin Araoz 800 - San Miguel De Tucuman - Tucumán");

    public static readonly AcademicUnitRecord AuFacultadDePsicologia = new(
        Id: new AcademicUnitId(Guid.Parse("00000007-0000-4000-a000-00000000001d")),
        UniversityId: Unt.Id,
        Name: "Facultad de Psicología",
        Slug: "facultad-de-psicologia",
        Address: "Av. Benjamin Araoz 800 - San Miguel De Tucuman - Tucumán");

    public static readonly AcademicUnitRecord AuFacultadDePsicologiaConvenioBellaVista = new(
        Id: new AcademicUnitId(Guid.Parse("00000007-0000-4000-a000-00000000001e")),
        UniversityId: Unt.Id,
        Name: "Facultad de Psicología Convenio Bella Vista",
        Slug: "facultad-de-psicologia-convenio-bella-vista",
        Address: "Sarmiento y Marconi-Bella Vista s/n - Amaicha Del Llano - Tucumán");

    public static readonly AcademicUnitRecord AuInstitutoUniversitarioMultidisciplinarioDeAguilaresArtes = new(
        Id: new AcademicUnitId(Guid.Parse("00000007-0000-4000-a000-00000000001f")),
        UniversityId: Unt.Id,
        Name: "Instituto Universitario Multidisciplinario de Aguilares (Artes)",
        Slug: "instituto-universitario-multidisciplinario-de-aguilares-artes",
        Address: "General Savio S/N - Aguilares - Tucumán");

    public static readonly AcademicUnitRecord AuInstitutoUniversitarioMultidisciplinarioDeAguilaresEnfermeria = new(
        Id: new AcademicUnitId(Guid.Parse("00000007-0000-4000-a000-000000000020")),
        UniversityId: Unt.Id,
        Name: "Instituto Universitario Multidisciplinario de Aguilares (Enfermería)",
        Slug: "instituto-universitario-multidisciplinario-de-aguilares-enfermeria",
        Address: "General Savio S/N - Aguilares - Tucumán");

    public static readonly AcademicUnitRecord AuRectorado = new(
        Id: new AcademicUnitId(Guid.Parse("00000007-0000-4000-a000-000000000021")),
        UniversityId: Unt.Id,
        Name: "Rectorado",
        Slug: "rectorado",
        Address: "Ayacucho 491 - San Miguel De Tucuman - Tucumán");

    // ---------- UTN-FRT ----------
    public static readonly AcademicUnitRecord AuFacultadRegionalTucuman = new(
        Id: new AcademicUnitId(Guid.Parse("00000007-0000-4000-a000-000000000022")),
        UniversityId: UtnFrt.Id,
        Name: "Facultad Regional Tucumán",
        Slug: "facultad-regional-tucuman",
        Address: "Rivadavia 1050 - San Miguel De Tucuman - Tucumán");

    // ---------- USPT ----------
    public static readonly AcademicUnitRecord AuInstitutoDeDesarrolloTecnologicoParaLaCompetitividadTerritorial = new(
        Id: new AcademicUnitId(Guid.Parse("00000007-0000-4000-a000-000000000023")),
        UniversityId: UspT.Id,
        Name: "Instituto de Desarrollo Tecnológico para la Competitividad Territorial",
        Slug: "instituto-de-desarrollo-tecnologico-para-la-competitividad-territorial",
        Address: "24 de Septiembre 476 - San Miguel De Tucuman - Tucumán");

    public static readonly AcademicUnitRecord AuInstitutoDeEstudiosSocialesPoliticaYCultura = new(
        Id: new AcademicUnitId(Guid.Parse("00000007-0000-4000-a000-000000000024")),
        UniversityId: UspT.Id,
        Name: "Instituto de Estudios Sociales, Politica y Cultura",
        Slug: "instituto-de-estudios-sociales-politica-y-cultura",
        Address: "24 de Septiembre 476 - San Miguel De Tucuman - Tucumán");

    public static readonly AcademicUnitRecord AuInstitutoDeSaludYCalidadDeVida = new(
        Id: new AcademicUnitId(Guid.Parse("00000007-0000-4000-a000-000000000025")),
        UniversityId: UspT.Id,
        Name: "Instituto de Salud y Calidad de Vida",
        Slug: "instituto-de-salud-y-calidad-de-vida",
        Address: "24 de Septiembre 476 - San Miguel De Tucuman - Tucumán");

    // ---------- UNSE ----------
    public static readonly AcademicUnitRecord AuCentroDeEstudiosDelTucumanCetucTucuman = new(
        Id: new AcademicUnitId(Guid.Parse("00000007-0000-4000-a000-000000000026")),
        UniversityId: Unse.Id,
        Name: "Centro de Estudios del Tucumán - CETUC - Tucumán",
        Slug: "centro-de-estudios-del-tucuman-cetuc-tucuman",
        Address: "Av. Salta 431 - San Miguel De Tucuman - Tucumán");

    public static readonly AcademicUnitRecord AuInstitutoDeEducacionSuperiorSisaiani = new(
        Id: new AcademicUnitId(Guid.Parse("00000007-0000-4000-a000-000000000027")),
        UniversityId: Unse.Id,
        Name: "Instituto de Educacion Superior Sisaiani",
        Slug: "instituto-de-educacion-superior-sisaiani",
        Address: "Reconquista 1215 - Tafi Viejo - Tucumán");

    public static readonly AcademicUnitRecord AuTucumanVillaQuinteros = new(
        Id: new AcademicUnitId(Guid.Parse("00000007-0000-4000-a000-000000000028")),
        UniversityId: Unse.Id,
        Name: "Tucuman - Villa Quinteros",
        Slug: "tucuman-villa-quinteros",
        Address: "9 de Julio y Florida S/N - Rio Seco - Tucumán");

    public static IReadOnlyList<AcademicUnitRecord> AcademicUnits { get; } = new[]
    {
        AuCentroUniversitarioConcepcion,
        AuFacultadDeCienciasDeLaSalud,
        AuFacultadDeCienciasJuridicasPoliticasYSociales,
        AuFacultadDeEconomiaYAdministracion,
        AuFacultadDeHumanidades,
        AuFacultadDeIngenieria,
        AuCarreraDeKinesiologiaSedeMonteros,
        AuEscuelaDeEnfermeria,
        AuEscuelaDeEnfermeriaConvenioBellaVista,
        AuEscuelaDeEnfermeriaConvenioFamailla,
        AuEscuelaUniversitariaDeCineVideoYTelevision,
        AuFacultadDeAgronomiaYZootecniaConcepcion,
        AuFacultadDeAgronomiaZootecniaYVeterinaria,
        AuFacultadDeArquitecturaYUrbanismo,
        AuFacultadDeArtes,
        AuFacultadDeBioquimicaQuimicaYFarmacia,
        AuFacultadDeCienciasEconomicas,
        AuFacultadDeCienciasExactasYTecnologia,
        AuFacultadDeCienciasNaturalesEInstitutoMiguelLillo,
        AuFacultadDeDerechoYCienciasSociales,
        AuFacultadDeDerechoYCienciasSocialesConvenioBellaVista,
        AuFacultadDeDerechoYCienciasSocialesConvenioConcepcion,
        AuFacultadDeDerechoYCienciasSocialesConvenioMonteros,
        AuFacultadDeDerechoYCienciasSocialesConvenioTrancas,
        AuFacultadDeEducacionFisica,
        AuFacultadDeFilosofiaYLetras,
        AuFacultadDeMedicina,
        AuFacultadDeOdontologia,
        AuFacultadDePsicologia,
        AuFacultadDePsicologiaConvenioBellaVista,
        AuInstitutoUniversitarioMultidisciplinarioDeAguilaresArtes,
        AuInstitutoUniversitarioMultidisciplinarioDeAguilaresEnfermeria,
        AuRectorado,
        AuFacultadRegionalTucuman,
        AuInstitutoDeDesarrolloTecnologicoParaLaCompetitividadTerritorial,
        AuInstitutoDeEstudiosSocialesPoliticaYCultura,
        AuInstitutoDeSaludYCalidadDeVida,
        AuCentroDeEstudiosDelTucumanCetucTucuman,
        AuInstitutoDeEducacionSuperiorSisaiani,
        AuTucumanVillaQuinteros,
    };

    // ====================================================================
    // Careers + CareerPlans: el catálogo real de Tucumán (R6). Universidad, facultad, título,
    // tipo y duración salen de la Guía SIU (docs/history/reviews/assets/2026-09-07-official-data/
    // guia-siu-tucuman-pregrado-y-grado.csv, 229 ofertas de pregrado y grado, consultada el
    // 2026-09-08); nada inventado, así que lo que la Guía no da (toda "duración real" u otra
    // afirmación con fuente y fecha) no está acá: eso es OfficialFact (ADR-0090), entidad de otra
    // tarea. Cuatro ofertas llevan CareerPlan real (UNSTA TUDCS con sus 21 materias, UTN
    // Programación, UNT Programador, y las dos ya existentes de UTN e UNT); el resto entra sin
    // plan detallado (Plan: null): relevar 229 planes no es esta tarea (K01, K02, K05, US-195).
    //
    // Cada Career cuelga de su AcademicUnit (tarea 19): cuando el mismo título aparece en más de
    // una facultad o sede de la misma universidad (ej. "Abogado" en UNSTA Concepción y en
    // Ciencias Jurídicas, "Enfermero" en UNT en cinco convenios), son ofertas distintas y el
    // catálogo carga una Career por cada (universidad, facultad, título). Slug único por
    // (university, slug): la primera oferta de cada título conserva el slug simple; las
    // adicionales le agregan el slug de su AcademicUnit para no colisionar
    // (ej. "abogado-facultad-de-ciencias-juridicas-politicas-y-sociales").
    //
    // Bloques de Id para lo nuevo del bulk load (evitan el rango 00-ff que ya usa lo curado a
    // mano): Unsta 0x100+, Unt 0x200+, UspT 0x300+, Unse 0x400+, UtnFrt 0x500+. Las ofertas que
    // esta tarea abrió por repetirse en varias sedes continúan la numeración del mismo bloque.
    // ====================================================================

    public static IReadOnlyList<CareerSeed> Careers { get; } = new[]
    {
        // ---------- UNSTA ----------
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000001")),
                UniversityId: Unsta.Id,
                AcademicUnitId: AuFacultadDeIngenieria.Id,
                Name: "Ingeniería en Informática",
                Slug: "ingenieria-en-informatica"),
            Plan: new CareerPlanRecord(
                Id: new CareerPlanId(Guid.Parse("00000003-0000-4000-a000-000000000001")),
                Year: 2019)),

        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-00000000012a")),
                UniversityId: Unsta.Id,
                AcademicUnitId: AuCentroUniversitarioConcepcion.Id,
                Name: "Ingeniería en Informática",
                Slug: "ingenieria-en-informatica-centro-universitario-concepcion",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),

        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000002")),
                UniversityId: Unsta.Id,
                AcademicUnitId: AuFacultadDeIngenieria.Id,
                Name: "Ingeniería en Inteligencia Artificial",
                Slug: "ingenieria-en-inteligencia-artificial"),
            Plan: new CareerPlanRecord(
                Id: new CareerPlanId(Guid.Parse("00000003-0000-4000-a000-000000000002")),
                Year: 2022)),

        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000003")),
                UniversityId: Unsta.Id,
                AcademicUnitId: AuFacultadDeIngenieria.Id,
                Name: "Tecnicatura Universitaria en Desarrollo y Calidad de Software",
                Slug: "tecnicatura-universitaria-en-desarrollo-y-calidad-de-software"),
            Plan: new CareerPlanRecord(
                Id: new CareerPlanId(Guid.Parse("00000003-0000-4000-a000-000000000003")),
                Year: 2018)),

        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000004")),
                UniversityId: Unsta.Id,
                AcademicUnitId: AuFacultadDeIngenieria.Id,
                Name: "Tecnicatura Universitaria en Automatización y Robótica",
                Slug: "tecnicatura-universitaria-en-automatizacion-y-robotica"),
            Plan: new CareerPlanRecord(
                Id: new CareerPlanId(Guid.Parse("00000003-0000-4000-a000-000000000004")),
                Year: 2022)),

        // ---------- UNT ----------
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000020")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeCienciasExactasYTecnologia.Id,
                Name: "Ingeniería en Informática",
                Slug: "ingenieria-en-informatica"),
            Plan: new CareerPlanRecord(
                Id: new CareerPlanId(Guid.Parse("00000003-0000-4000-a000-000000000020")),
                Year: 2019)),

        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000021")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeCienciasExactasYTecnologia.Id,
                Name: "Ingeniería en Computación",
                Slug: "ingenieria-en-computacion"),
            Plan: new CareerPlanRecord(
                Id: new CareerPlanId(Guid.Parse("00000003-0000-4000-a000-000000000021")),
                Year: 2005)),

        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000022")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeCienciasExactasYTecnologia.Id,
                Name: "Licenciatura en Informática",
                Slug: "licenciatura-en-informatica"),
            Plan: new CareerPlanRecord(
                Id: new CareerPlanId(Guid.Parse("00000003-0000-4000-a000-000000000022")),
                Year: 2009)),

        // Programador Universitario (R6, US-195): la misma carrera canónica que la Tecnicatura
        // de UNSTA y la de UTN, del lado de UNT. Plan aprobado por Res. HCS 1926/96, modificado
        // por Res. HCS 307/04 (23 materias más Proyecto Final en dos módulos, sitio de la FACET);
        // SIPES cita la RM 2013/2020 para el mismo título y esa resolución no aparece en la
        // página del plan (K04): el modelo hoy no guarda dos fuentes que no cierran, así que
        // queda solo la del plan.
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000023")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeCienciasExactasYTecnologia.Id,
                Name: "Programador Universitario",
                Slug: "programador-universitario",
                DegreeType: CareerDegreeType.Tecnicatura,
                DurationYears: 3),
            Plan: new CareerPlanRecord(
                Id: new CareerPlanId(Guid.Parse("00000003-0000-4000-a000-000000000023")),
                Year: 1996,
                Label: "Plan 1996 (mod. Res. HCS 307/04)")),

        // ---------- UTN-FRT ----------
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000030")),
                UniversityId: UtnFrt.Id,
                AcademicUnitId: AuFacultadRegionalTucuman.Id,
                Name: "Ingeniería en Sistemas de Información",
                Slug: "ingenieria-en-sistemas-de-informacion"),
            Plan: new CareerPlanRecord(
                Id: new CareerPlanId(Guid.Parse("00000003-0000-4000-a000-000000000030")),
                Year: 2023)),

        // Tecnicatura Universitaria en Programación (R6, hallazgo K01): reemplaza a la carrera
        // ficticia que este seed inventaba antes en UTN-FRT. Plan 2024 vigente, en transición
        // desde el plan 2003 (Ordenanza CS 987): la ordenanza del plan 2024 (Ordenanzas CS 2018
        // y 2019, diciembre de 2023) no se pudo bajar (el sitio del Consejo Superior de UTN
        // rechazó la conexión) y el plan 2003 sí está documentado, pero por otra regional (PDF
        // del Centro Universitario Chivilcoy), no por Tucumán: ninguno de los dos queda cargado
        // como plan detallado (hallazgo K05). Duración y condición de ingreso vienen de la Guía SIU.
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000031")),
                UniversityId: UtnFrt.Id,
                AcademicUnitId: AuFacultadRegionalTucuman.Id,
                Name: "Tecnicatura Universitaria en Programación",
                Slug: "tecnicatura-universitaria-en-programacion",
                DegreeType: CareerDegreeType.Tecnicatura,
                DurationYears: 2),
            Plan: new CareerPlanRecord(
                Id: new CareerPlanId(Guid.Parse("00000003-0000-4000-a000-000000000031")),
                Year: 2024,
                Label: "Plan 2024 (en transición desde 2003, no verificado)")),

        // ---------- UNSTA: resto de la oferta de pregrado y grado de la Guía SIU
        // (42), sin plan detallado (relevar 42 planes no es esta tarea). ----------
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000100")),
                UniversityId: Unsta.Id,
                AcademicUnitId: AuCentroUniversitarioConcepcion.Id,
                Name: "Abogado",
                Slug: "abogado",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),

        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-00000000012b")),
                UniversityId: Unsta.Id,
                AcademicUnitId: AuFacultadDeCienciasJuridicasPoliticasYSociales.Id,
                Name: "Abogado",
                Slug: "abogado-facultad-de-ciencias-juridicas-politicas-y-sociales",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000101")),
                UniversityId: Unsta.Id,
                AcademicUnitId: AuCentroUniversitarioConcepcion.Id,
                Name: "Contador Público",
                Slug: "contador-publico",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 4),
            Plan: null),

        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-00000000012c")),
                UniversityId: Unsta.Id,
                AcademicUnitId: AuFacultadDeEconomiaYAdministracion.Id,
                Name: "Contador Público",
                Slug: "contador-publico-facultad-de-economia-y-administracion",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 4),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000102")),
                UniversityId: Unsta.Id,
                AcademicUnitId: AuCentroUniversitarioConcepcion.Id,
                Name: "Ingeniero Industrial",
                Slug: "ingeniero-industrial",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),

        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-00000000012d")),
                UniversityId: Unsta.Id,
                AcademicUnitId: AuFacultadDeIngenieria.Id,
                Name: "Ingeniero Industrial",
                Slug: "ingeniero-industrial-facultad-de-ingenieria",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000103")),
                UniversityId: Unsta.Id,
                AcademicUnitId: AuCentroUniversitarioConcepcion.Id,
                Name: "Licenciado en Administración de Empresas",
                Slug: "licenciado-en-administracion-de-empresas",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 4),
            Plan: null),

        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-00000000012e")),
                UniversityId: Unsta.Id,
                AcademicUnitId: AuFacultadDeEconomiaYAdministracion.Id,
                Name: "Licenciado en Administración de Empresas",
                Slug: "licenciado-en-administracion-de-empresas-facultad-de-economia-y-administracion",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 4),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000104")),
                UniversityId: Unsta.Id,
                AcademicUnitId: AuCentroUniversitarioConcepcion.Id,
                Name: "Licenciado en Gestión Ambiental y Ecología",
                Slug: "licenciado-en-gestion-ambiental-y-ecologia",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 4),
            Plan: null),

        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-00000000012f")),
                UniversityId: Unsta.Id,
                AcademicUnitId: AuFacultadDeIngenieria.Id,
                Name: "Licenciado en Gestión Ambiental y Ecología",
                Slug: "licenciado-en-gestion-ambiental-y-ecologia-facultad-de-ingenieria",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 4),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000105")),
                UniversityId: Unsta.Id,
                AcademicUnitId: AuCentroUniversitarioConcepcion.Id,
                Name: "Licenciado en Higiene y Seguridad Laboral",
                Slug: "licenciado-en-higiene-y-seguridad-laboral",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),

        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000130")),
                UniversityId: Unsta.Id,
                AcademicUnitId: AuFacultadDeIngenieria.Id,
                Name: "Licenciado en Higiene y Seguridad Laboral",
                Slug: "licenciado-en-higiene-y-seguridad-laboral-facultad-de-ingenieria",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000106")),
                UniversityId: Unsta.Id,
                AcademicUnitId: AuCentroUniversitarioConcepcion.Id,
                Name: "Licenciado en Logística y Gestión de Transportes",
                Slug: "licenciado-en-logistica-y-gestion-de-transportes",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 4),
            Plan: null),

        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000131")),
                UniversityId: Unsta.Id,
                AcademicUnitId: AuFacultadDeIngenieria.Id,
                Name: "Licenciado en Logística y Gestión de Transportes",
                Slug: "licenciado-en-logistica-y-gestion-de-transportes-facultad-de-ingenieria",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 4),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000107")),
                UniversityId: Unsta.Id,
                AcademicUnitId: AuCentroUniversitarioConcepcion.Id,
                Name: "Licenciado en Nutrición",
                Slug: "licenciado-en-nutricion",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 4),
            Plan: null),

        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000132")),
                UniversityId: Unsta.Id,
                AcademicUnitId: AuFacultadDeCienciasDeLaSalud.Id,
                Name: "Licenciado en Nutrición",
                Slug: "licenciado-en-nutricion-facultad-de-ciencias-de-la-salud",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 4),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000108")),
                UniversityId: Unsta.Id,
                AcademicUnitId: AuCentroUniversitarioConcepcion.Id,
                Name: "Licenciado en Psicología",
                Slug: "licenciado-en-psicologia",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),

        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000133")),
                UniversityId: Unsta.Id,
                AcademicUnitId: AuFacultadDeCienciasDeLaSalud.Id,
                Name: "Licenciado en Psicología",
                Slug: "licenciado-en-psicologia-facultad-de-ciencias-de-la-salud",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000109")),
                UniversityId: Unsta.Id,
                AcademicUnitId: AuCentroUniversitarioConcepcion.Id,
                Name: "Licenciado en Recursos Humanos",
                Slug: "licenciado-en-recursos-humanos",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 4),
            Plan: null),

        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000134")),
                UniversityId: Unsta.Id,
                AcademicUnitId: AuFacultadDeEconomiaYAdministracion.Id,
                Name: "Licenciado en Recursos Humanos",
                Slug: "licenciado-en-recursos-humanos-facultad-de-economia-y-administracion",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 4),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-00000000010a")),
                UniversityId: Unsta.Id,
                AcademicUnitId: AuCentroUniversitarioConcepcion.Id,
                Name: "Licenciado en Terapia Ocupacional",
                Slug: "licenciado-en-terapia-ocupacional",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 4),
            Plan: null),

        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000135")),
                UniversityId: Unsta.Id,
                AcademicUnitId: AuFacultadDeCienciasDeLaSalud.Id,
                Name: "Licenciado en Terapia Ocupacional",
                Slug: "licenciado-en-terapia-ocupacional-facultad-de-ciencias-de-la-salud",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 4),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-00000000010b")),
                UniversityId: Unsta.Id,
                AcademicUnitId: AuCentroUniversitarioConcepcion.Id,
                Name: "Licenciado en Turismo",
                Slug: "licenciado-en-turismo",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 4),
            Plan: null),

        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000136")),
                UniversityId: Unsta.Id,
                AcademicUnitId: AuFacultadDeEconomiaYAdministracion.Id,
                Name: "Licenciado en Turismo",
                Slug: "licenciado-en-turismo-facultad-de-economia-y-administracion",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 4),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-00000000010c")),
                UniversityId: Unsta.Id,
                AcademicUnitId: AuCentroUniversitarioConcepcion.Id,
                Name: "Notario",
                Slug: "notario",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 4),
            Plan: null),

        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000137")),
                UniversityId: Unsta.Id,
                AcademicUnitId: AuFacultadDeCienciasJuridicasPoliticasYSociales.Id,
                Name: "Notario",
                Slug: "notario-facultad-de-ciencias-juridicas-politicas-y-sociales",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 4),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-00000000010d")),
                UniversityId: Unsta.Id,
                AcademicUnitId: AuCentroUniversitarioConcepcion.Id,
                Name: "Procurador",
                Slug: "procurador",
                DegreeType: CareerDegreeType.Tecnicatura,
                DurationYears: 3),
            Plan: null),

        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000138")),
                UniversityId: Unsta.Id,
                AcademicUnitId: AuFacultadDeCienciasJuridicasPoliticasYSociales.Id,
                Name: "Procurador",
                Slug: "procurador-facultad-de-ciencias-juridicas-politicas-y-sociales",
                DegreeType: CareerDegreeType.Tecnicatura,
                DurationYears: 3),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-00000000010e")),
                UniversityId: Unsta.Id,
                AcademicUnitId: AuCentroUniversitarioConcepcion.Id,
                Name: "Técnico en Higiene y Seguridad Laboral",
                Slug: "tecnico-en-higiene-y-seguridad-laboral",
                DegreeType: CareerDegreeType.Tecnicatura,
                DurationYears: 3),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-00000000010f")),
                UniversityId: Unsta.Id,
                AcademicUnitId: AuFacultadDeCienciasDeLaSalud.Id,
                Name: "Licenciado en Diagnóstico por Imágenes",
                Slug: "licenciado-en-diagnostico-por-imagenes",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000110")),
                UniversityId: Unsta.Id,
                AcademicUnitId: AuFacultadDeCienciasDeLaSalud.Id,
                Name: "Licenciado en Gastronomía",
                Slug: "licenciado-en-gastronomia",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 4),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000111")),
                UniversityId: Unsta.Id,
                AcademicUnitId: AuFacultadDeCienciasDeLaSalud.Id,
                Name: "Licenciado en Trabajo Social - Ciclo de Complementación Curricular",
                Slug: "licenciado-en-trabajo-social-ciclo-de-complementacion-curricular",
                DurationYears: 2),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000112")),
                UniversityId: Unsta.Id,
                AcademicUnitId: AuFacultadDeCienciasDeLaSalud.Id,
                Name: "Médico",
                Slug: "medico",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 6),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000113")),
                UniversityId: Unsta.Id,
                AcademicUnitId: AuFacultadDeCienciasDeLaSalud.Id,
                Name: "Técnico Universitario en Diagnóstico por Imágenes",
                Slug: "tecnico-universitario-en-diagnostico-por-imagenes",
                DegreeType: CareerDegreeType.Tecnicatura,
                DurationYears: 3),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000114")),
                UniversityId: Unsta.Id,
                AcademicUnitId: AuFacultadDeCienciasJuridicasPoliticasYSociales.Id,
                Name: "Licenciado en Ciencias Políticas",
                Slug: "licenciado-en-ciencias-politicas",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 4),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000115")),
                UniversityId: Unsta.Id,
                AcademicUnitId: AuFacultadDeCienciasJuridicasPoliticasYSociales.Id,
                Name: "Licenciado en Comunicación Social",
                Slug: "licenciado-en-comunicacion-social",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000116")),
                UniversityId: Unsta.Id,
                AcademicUnitId: AuFacultadDeCienciasJuridicasPoliticasYSociales.Id,
                Name: "Licenciado en Seguridad y Protección Ciudadana - Ciclo de Complementación Curricular",
                Slug: "licenciado-en-seguridad-y-proteccion-ciudadana-ciclo-de-complementacion-curricular",
                DurationYears: 2),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000117")),
                UniversityId: Unsta.Id,
                AcademicUnitId: AuFacultadDeCienciasJuridicasPoliticasYSociales.Id,
                Name: "Locutor Nacional",
                Slug: "locutor-nacional",
                DegreeType: CareerDegreeType.Tecnicatura,
                DurationYears: 3),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000118")),
                UniversityId: Unsta.Id,
                AcademicUnitId: AuFacultadDeCienciasJuridicasPoliticasYSociales.Id,
                Name: "Técnico Universitario en Periodismo",
                Slug: "tecnico-universitario-en-periodismo",
                DegreeType: CareerDegreeType.Tecnicatura,
                DurationYears: 3),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000119")),
                UniversityId: Unsta.Id,
                AcademicUnitId: AuFacultadDeEconomiaYAdministracion.Id,
                Name: "Licenciado/a en Marketing",
                Slug: "licenciado-a-en-marketing",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 4),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-00000000011a")),
                UniversityId: Unsta.Id,
                AcademicUnitId: AuFacultadDeEconomiaYAdministracion.Id,
                Name: "Licenciado en Comercialización",
                Slug: "licenciado-en-comercializacion",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 4),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-00000000011b")),
                UniversityId: Unsta.Id,
                AcademicUnitId: AuFacultadDeEconomiaYAdministracion.Id,
                Name: "Técnico en Empresas Turísticas",
                Slug: "tecnico-en-empresas-turisticas",
                DegreeType: CareerDegreeType.Tecnicatura,
                DurationYears: 3),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-00000000011c")),
                UniversityId: Unsta.Id,
                AcademicUnitId: AuFacultadDeHumanidades.Id,
                Name: "Licenciado/a en Ciencias Sociales",
                Slug: "licenciado-a-en-ciencias-sociales",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 4),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-00000000011d")),
                UniversityId: Unsta.Id,
                AcademicUnitId: AuFacultadDeHumanidades.Id,
                Name: "Licenciado/a en Gestión Cultural- MD",
                Slug: "licenciado-a-en-gestion-cultural-md",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 4),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-00000000011e")),
                UniversityId: Unsta.Id,
                AcademicUnitId: AuFacultadDeHumanidades.Id,
                Name: "Licenciado/a en Teoría y Gestión de las Organizaciones - MD",
                Slug: "licenciado-a-en-teoria-y-gestion-de-las-organizaciones-md",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 4),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-00000000011f")),
                UniversityId: Unsta.Id,
                AcademicUnitId: AuFacultadDeHumanidades.Id,
                Name: "Licenciado en Filosofía",
                Slug: "licenciado-en-filosofia",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000120")),
                UniversityId: Unsta.Id,
                AcademicUnitId: AuFacultadDeHumanidades.Id,
                Name: "Profesor/a de Ciencias Políticas - Ciclo de Complementación Curricular",
                Slug: "profesor-a-de-ciencias-politicas-ciclo-de-complementacion-curricular",
                DurationYears: 2),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000121")),
                UniversityId: Unsta.Id,
                AcademicUnitId: AuFacultadDeHumanidades.Id,
                Name: "Profesor/a de Derecho - Ciclo de Complementación Curricular",
                Slug: "profesor-a-de-derecho-ciclo-de-complementacion-curricular",
                DurationYears: 2),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000122")),
                UniversityId: Unsta.Id,
                AcademicUnitId: AuFacultadDeHumanidades.Id,
                Name: "Profesor en Filosofía",
                Slug: "profesor-en-filosofia",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000123")),
                UniversityId: Unsta.Id,
                AcademicUnitId: AuFacultadDeHumanidades.Id,
                Name: "Técnico/a en Gestión Universitaria- MD",
                Slug: "tecnico-a-en-gestion-universitaria-md",
                DegreeType: CareerDegreeType.Tecnicatura,
                DurationYears: 3),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000124")),
                UniversityId: Unsta.Id,
                AcademicUnitId: AuFacultadDeIngenieria.Id,
                Name: "Bioingeniero/a",
                Slug: "bioingeniero-a",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000125")),
                UniversityId: Unsta.Id,
                AcademicUnitId: AuFacultadDeIngenieria.Id,
                Name: "Ingeniero/a Ambiental",
                Slug: "ingeniero-a-ambiental",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000126")),
                UniversityId: Unsta.Id,
                AcademicUnitId: AuFacultadDeIngenieria.Id,
                Name: "Licenciado/a en Diseño de Interiores",
                Slug: "licenciado-a-en-diseno-de-interiores",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 4),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000127")),
                UniversityId: Unsta.Id,
                AcademicUnitId: AuFacultadDeIngenieria.Id,
                Name: "Licenciado en Diseño Gráfico",
                Slug: "licenciado-en-diseno-grafico",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 4),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000128")),
                UniversityId: Unsta.Id,
                AcademicUnitId: AuFacultadDeIngenieria.Id,
                Name: "Licenciado en Diseño Multimedial",
                Slug: "licenciado-en-diseno-multimedial",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 4),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000129")),
                UniversityId: Unsta.Id,
                AcademicUnitId: AuFacultadDeIngenieria.Id,
                Name: "Técnico en Diseño Multimedial",
                Slug: "tecnico-en-diseno-multimedial",
                DegreeType: CareerDegreeType.Tecnicatura,
                DurationYears: 3),
            Plan: null),

        // ---------- UNT: resto de la oferta de pregrado y grado de la Guía SIU
        // (105), sin plan detallado (relevar 105 planes no es esta tarea). ----------
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000200")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuCarreraDeKinesiologiaSedeMonteros.Id,
                Name: "Kinesiólogo",
                Slug: "kinesiologo",
                DegreeType: CareerDegreeType.Tecnicatura,
                DurationYears: 4),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000201")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuCarreraDeKinesiologiaSedeMonteros.Id,
                Name: "Licenciado en Kinesiología",
                Slug: "licenciado-en-kinesiologia",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000202")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuEscuelaDeEnfermeria.Id,
                Name: "Enfermero",
                Slug: "enfermero",
                DegreeType: CareerDegreeType.Tecnicatura,
                DurationYears: 3),
            Plan: null),

        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000269")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuInstitutoUniversitarioMultidisciplinarioDeAguilaresEnfermeria.Id,
                Name: "Enfermero",
                Slug: "enfermero-instituto-universitario-multidisciplinario-de-aguilares-enfermeria",
                DegreeType: CareerDegreeType.Tecnicatura,
                DurationYears: 3),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000203")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuEscuelaDeEnfermeria.Id,
                Name: "Enfermero/a Universitario/a",
                Slug: "enfermero-a-universitario-a",
                DegreeType: CareerDegreeType.Tecnicatura,
                DurationYears: 3),
            Plan: null),

        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-00000000026a")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeMedicina.Id,
                Name: "Enfermero/a Universitario/a",
                Slug: "enfermero-a-universitario-a-facultad-de-medicina",
                DegreeType: CareerDegreeType.Tecnicatura,
                DurationYears: 3),
            Plan: null),

        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-00000000026b")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuInstitutoUniversitarioMultidisciplinarioDeAguilaresEnfermeria.Id,
                Name: "Enfermero/a Universitario/a",
                Slug: "enfermero-a-universitario-a-instituto-universitario-multidisciplinario-de-aguilares-enfermeria",
                DegreeType: CareerDegreeType.Tecnicatura,
                DurationYears: 3),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000204")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuEscuelaDeEnfermeria.Id,
                Name: "Licenciado/a en Enfermería",
                Slug: "licenciado-a-en-enfermeria",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),

        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-00000000026c")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuEscuelaDeEnfermeriaConvenioBellaVista.Id,
                Name: "Licenciado/a en Enfermería",
                Slug: "licenciado-a-en-enfermeria-escuela-de-enfermeria-convenio-bella-vista",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),

        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-00000000026d")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuEscuelaDeEnfermeriaConvenioFamailla.Id,
                Name: "Licenciado/a en Enfermería",
                Slug: "licenciado-a-en-enfermeria-escuela-de-enfermeria-convenio-famailla",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),

        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-00000000026e")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeMedicina.Id,
                Name: "Licenciado/a en Enfermería",
                Slug: "licenciado-a-en-enfermeria-facultad-de-medicina",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),

        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-00000000026f")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuInstitutoUniversitarioMultidisciplinarioDeAguilaresEnfermeria.Id,
                Name: "Licenciado/a en Enfermería",
                Slug: "licenciado-a-en-enfermeria-instituto-universitario-multidisciplinario-de-aguilares-enfermeria",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000205")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuEscuelaDeEnfermeria.Id,
                Name: "Licenciado/a en Obstetricia",
                Slug: "licenciado-a-en-obstetricia",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 4),
            Plan: null),
        // "Licenciado en Enfermería" (sin "/a") no entra en Escuela de Enfermería ni en sus tres
        // convenios: la Guía SIU lista la misma oferta dos veces, una con el sufijo de género y
        // otra sin él ("Licenciado/a en Enfermería", arriba, la que se conserva). Mismo bug que
        // "Ingeniero/a en Computación": duplicaba la institución en Dónde estudiarla.
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000207")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuEscuelaDeEnfermeria.Id,
                Name: "Técnico en Estadísticas de Salud",
                Slug: "tecnico-en-estadisticas-de-salud",
                DegreeType: CareerDegreeType.Tecnicatura,
                DurationYears: 3),
            Plan: null),

        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000273")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeMedicina.Id,
                Name: "Técnico en Estadísticas de Salud",
                Slug: "tecnico-en-estadisticas-de-salud-facultad-de-medicina",
                DegreeType: CareerDegreeType.Tecnicatura,
                DurationYears: 3),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000208")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuEscuelaDeEnfermeria.Id,
                Name: "Técnico en Instrumentación Quirúrgica",
                Slug: "tecnico-en-instrumentacion-quirurgica",
                DegreeType: CareerDegreeType.Tecnicatura,
                DurationYears: 2),
            Plan: null),

        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000274")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuInstitutoUniversitarioMultidisciplinarioDeAguilaresEnfermeria.Id,
                Name: "Técnico en Instrumentación Quirúrgica",
                Slug: "tecnico-en-instrumentacion-quirurgica-instituto-universitario-multidisciplinario-de-aguilares-enfermeria",
                DegreeType: CareerDegreeType.Tecnicatura,
                DurationYears: 2),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000209")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuEscuelaUniversitariaDeCineVideoYTelevision.Id,
                Name: "Licenciado/a en Cinematografía",
                Slug: "licenciado-a-en-cinematografia",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-00000000020a")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuEscuelaUniversitariaDeCineVideoYTelevision.Id,
                Name: "Técnico/a Universitario/a en Medios Audiovisuales",
                Slug: "tecnico-a-universitario-a-en-medios-audiovisuales",
                DegreeType: CareerDegreeType.Tecnicatura,
                DurationYears: 3),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-00000000020b")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeAgronomiaYZootecniaConcepcion.Id,
                Name: "Técnico Universitario de Gestión en Calidad Alimenticia",
                Slug: "tecnico-universitario-de-gestion-en-calidad-alimenticia",
                DegreeType: CareerDegreeType.Tecnicatura,
                DurationYears: 3),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-00000000020c")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeAgronomiaZootecniaYVeterinaria.Id,
                Name: "Ingeniero/a Agrónomo/a",
                Slug: "ingeniero-a-agronomo-a",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-00000000020d")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeAgronomiaZootecniaYVeterinaria.Id,
                Name: "Ingeniero/a Zootecnista",
                Slug: "ingeniero-a-zootecnista",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-00000000020e")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeAgronomiaZootecniaYVeterinaria.Id,
                Name: "Médico Veterinario",
                Slug: "medico-veterinario",
                DegreeType: CareerDegreeType.Grado),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-00000000020f")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeArquitecturaYUrbanismo.Id,
                Name: "Arquitecto",
                Slug: "arquitecto",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 6),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000210")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeArquitecturaYUrbanismo.Id,
                Name: "Técnico Diseñador Universitario de Indumentaria y Textil",
                Slug: "tecnico-disenador-universitario-de-indumentaria-y-textil",
                DegreeType: CareerDegreeType.Tecnicatura,
                DurationYears: 3),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000211")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeArtes.Id,
                Name: "Actor / Actriz",
                Slug: "actor-actriz",
                DegreeType: CareerDegreeType.Tecnicatura,
                DurationYears: 3),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000212")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeArtes.Id,
                Name: "Bailarín de Danza Contemporánea",
                Slug: "bailarin-de-danza-contemporanea",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 4),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000213")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeArtes.Id,
                Name: "Diseñador de Interiores y Equipamiento",
                Slug: "disenador-de-interiores-y-equipamiento",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 4),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000214")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeArtes.Id,
                Name: "Licenciado/a en Artes Visuales",
                Slug: "licenciado-a-en-artes-visuales",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),

        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000275")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuInstitutoUniversitarioMultidisciplinarioDeAguilaresArtes.Id,
                Name: "Licenciado/a en Artes Visuales",
                Slug: "licenciado-a-en-artes-visuales-instituto-universitario-multidisciplinario-de-aguilares-artes",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000215")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeArtes.Id,
                Name: "Licenciado/a en Danza Clásica",
                Slug: "licenciado-a-en-danza-clasica",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000216")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeArtes.Id,
                Name: "Licenciado/a en Diseño de sonido",
                Slug: "licenciado-a-en-diseno-de-sonido",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 4),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000217")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeArtes.Id,
                Name: "Licenciado/a en Luthería",
                Slug: "licenciado-a-en-lutheria",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000218")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeArtes.Id,
                Name: "Licenciado/a en Teatro",
                Slug: "licenciado-a-en-teatro",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000219")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeArtes.Id,
                Name: "Licenciado en Música - Ciclo de Licenciatura",
                Slug: "licenciado-en-musica-ciclo-de-licenciatura",
                DurationYears: 2),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-00000000021a")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeArtes.Id,
                Name: "Profesor/a Universitario/a en Teatro",
                Slug: "profesor-a-universitario-a-en-teatro",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 4),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-00000000021b")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeArtes.Id,
                Name: "Profesor de Danza Contemporánea",
                Slug: "profesor-de-danza-contemporanea",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-00000000021c")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeArtes.Id,
                Name: "Técnico/a Universitario/a en Construcción y Restauración de Instrumentos de Cuerdas Pulsadas",
                Slug: "tecnico-a-universitario-a-en-construccion-y-restauracion-de-instrumentos-de-cuerdas-pulsadas",
                DegreeType: CareerDegreeType.Tecnicatura,
                DurationYears: 2),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-00000000021d")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeArtes.Id,
                Name: "Técnico/a Universitario en Sonorización",
                Slug: "tecnico-a-universitario-en-sonorizacion",
                DegreeType: CareerDegreeType.Tecnicatura,
                DurationYears: 3),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-00000000021e")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeArtes.Id,
                Name: "Técnico Universitario en Fotografía",
                Slug: "tecnico-universitario-en-fotografia",
                DegreeType: CareerDegreeType.Tecnicatura,
                DurationYears: 3),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-00000000021f")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeBioquimicaQuimicaYFarmacia.Id,
                Name: "Bioquímico/a",
                Slug: "bioquimico-a",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 6),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000220")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeBioquimicaQuimicaYFarmacia.Id,
                Name: "Farmacéutico/a",
                Slug: "farmaceutico-a",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 6),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000221")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeBioquimicaQuimicaYFarmacia.Id,
                Name: "Licenciado/a en Química",
                Slug: "licenciado-a-en-quimica",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000222")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeBioquimicaQuimicaYFarmacia.Id,
                Name: "Licenciado en Biotecnología",
                Slug: "licenciado-en-biotecnologia",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000223")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeBioquimicaQuimicaYFarmacia.Id,
                Name: "Técnico Laboratorista Universitario en Salud",
                Slug: "tecnico-laboratorista-universitario-en-salud",
                DegreeType: CareerDegreeType.Tecnicatura,
                DurationYears: 3),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000224")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeCienciasEconomicas.Id,
                Name: "Contador Público",
                Slug: "contador-publico",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000225")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeCienciasEconomicas.Id,
                Name: "Licenciado en Administración",
                Slug: "licenciado-en-administracion",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000226")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeCienciasEconomicas.Id,
                Name: "Licenciado en Economía",
                Slug: "licenciado-en-economia",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000227")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeCienciasExactasYTecnologia.Id,
                Name: "Diseñador de Iluminación",
                Slug: "disenador-de-iluminacion",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 4),
            Plan: null),
        // "Ingeniero/a en Computación" (id ...228) no entra: es la misma oferta que "Ingeniería en
        // Computación" (arriba, cargada a mano con su CareerPlan), duplicada por el bulk load del
        // CSV. Sin este dedup, Dónde estudiarla mostraba a UNT dos veces en la misma comparación.
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000229")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeCienciasExactasYTecnologia.Id,
                Name: "Ingeniero/a Geodesta y Geofísico/a",
                Slug: "ingeniero-a-geodesta-y-geofisico-a",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-00000000022a")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeCienciasExactasYTecnologia.Id,
                Name: "Ingeniero Agrimensor",
                Slug: "ingeniero-agrimensor",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-00000000022b")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeCienciasExactasYTecnologia.Id,
                Name: "Ingeniero Azucarero",
                Slug: "ingeniero-azucarero",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-00000000022c")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeCienciasExactasYTecnologia.Id,
                Name: "Ingeniero Biomédico",
                Slug: "ingeniero-biomedico",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-00000000022d")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeCienciasExactasYTecnologia.Id,
                Name: "Ingeniero Civil",
                Slug: "ingeniero-civil",
                DegreeType: CareerDegreeType.Grado),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-00000000022e")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeCienciasExactasYTecnologia.Id,
                Name: "Ingeniero Electricista",
                Slug: "ingeniero-electricista",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-00000000022f")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeCienciasExactasYTecnologia.Id,
                Name: "Ingeniero Electrónico",
                Slug: "ingeniero-electronico",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000230")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeCienciasExactasYTecnologia.Id,
                Name: "Ingeniero Industrial",
                Slug: "ingeniero-industrial",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000231")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeCienciasExactasYTecnologia.Id,
                Name: "Ingeniero Mecánico",
                Slug: "ingeniero-mecanico",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000232")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeCienciasExactasYTecnologia.Id,
                Name: "Ingeniero Químico",
                Slug: "ingeniero-quimico",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000233")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeCienciasExactasYTecnologia.Id,
                Name: "Licenciado/a en Física",
                Slug: "licenciado-a-en-fisica",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000234")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeCienciasExactasYTecnologia.Id,
                Name: "Licenciado en Matemática",
                Slug: "licenciado-en-matematica",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000235")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeCienciasExactasYTecnologia.Id,
                Name: "Técnico/a Universitario/a en Física Ambiental",
                Slug: "tecnico-a-universitario-a-en-fisica-ambiental",
                DegreeType: CareerDegreeType.Tecnicatura),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000236")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeCienciasExactasYTecnologia.Id,
                Name: "Técnico en Iluminación",
                Slug: "tecnico-en-iluminacion",
                DegreeType: CareerDegreeType.Tecnicatura,
                DurationYears: 3),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000237")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeCienciasExactasYTecnologia.Id,
                Name: "Técnico Universitario en Física",
                Slug: "tecnico-universitario-en-fisica",
                DegreeType: CareerDegreeType.Tecnicatura,
                DurationYears: 3),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000238")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeCienciasExactasYTecnologia.Id,
                Name: "Técnico Universitario en Tecnología Azucarera e Industrias Derivadas",
                Slug: "tecnico-universitario-en-tecnologia-azucarera-e-industrias-derivadas",
                DegreeType: CareerDegreeType.Tecnicatura,
                DurationYears: 3),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000239")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeCienciasNaturalesEInstitutoMiguelLillo.Id,
                Name: "Arqueólogo",
                Slug: "arqueologo",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-00000000023a")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeCienciasNaturalesEInstitutoMiguelLillo.Id,
                Name: "Geólogo/a",
                Slug: "geologo-a",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-00000000023b")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeCienciasNaturalesEInstitutoMiguelLillo.Id,
                Name: "Licenciado/a en Ciencias Biológicas",
                Slug: "licenciado-a-en-ciencias-biologicas",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-00000000023c")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeCienciasNaturalesEInstitutoMiguelLillo.Id,
                Name: "Profesor en Ciencias Biológicas",
                Slug: "profesor-en-ciencias-biologicas",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 4),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-00000000023d")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeCienciasNaturalesEInstitutoMiguelLillo.Id,
                Name: "Técnico Universitario en Documentación y Museología Arqueológica",
                Slug: "tecnico-universitario-en-documentacion-y-museologia-arqueologica",
                DegreeType: CareerDegreeType.Tecnicatura,
                DurationYears: 3),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-00000000023e")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeDerechoYCienciasSociales.Id,
                Name: "Abogado",
                Slug: "abogado",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 6),
            Plan: null),

        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000276")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeDerechoYCienciasSocialesConvenioBellaVista.Id,
                Name: "Abogado",
                Slug: "abogado-facultad-de-derecho-y-ciencias-sociales-convenio-bella-vista",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 6),
            Plan: null),

        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000277")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeDerechoYCienciasSocialesConvenioConcepcion.Id,
                Name: "Abogado",
                Slug: "abogado-facultad-de-derecho-y-ciencias-sociales-convenio-concepcion",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 6),
            Plan: null),

        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000278")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeDerechoYCienciasSocialesConvenioMonteros.Id,
                Name: "Abogado",
                Slug: "abogado-facultad-de-derecho-y-ciencias-sociales-convenio-monteros",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 6),
            Plan: null),

        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000279")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeDerechoYCienciasSocialesConvenioTrancas.Id,
                Name: "Abogado",
                Slug: "abogado-facultad-de-derecho-y-ciencias-sociales-convenio-trancas",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 6),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-00000000023f")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeDerechoYCienciasSociales.Id,
                Name: "Escribano",
                Slug: "escribano",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000240")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeDerechoYCienciasSociales.Id,
                Name: "Licenciado/a en Seguridad Pública - Ciclo de Complementación Curricular - MD",
                Slug: "licenciado-a-en-seguridad-publica-ciclo-de-complementacion-curricular-md"),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000241")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeDerechoYCienciasSociales.Id,
                Name: "Procurador",
                Slug: "procurador",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 4),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000242")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeEducacionFisica.Id,
                Name: "Licenciado en Educación Física",
                Slug: "licenciado-en-educacion-fisica",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000243")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeEducacionFisica.Id,
                Name: "Licenciado en Educación Física - Ciclo de Licenciatura",
                Slug: "licenciado-en-educacion-fisica-ciclo-de-licenciatura",
                DurationYears: 2),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000244")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeEducacionFisica.Id,
                Name: "Profesor de Educación Física",
                Slug: "profesor-de-educacion-fisica",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 4),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000245")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeFilosofiaYLetras.Id,
                Name: "Licenciado/a en Historia",
                Slug: "licenciado-a-en-historia",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000246")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeFilosofiaYLetras.Id,
                Name: "Licenciado en Ciencias de la Comunicación",
                Slug: "licenciado-en-ciencias-de-la-comunicacion",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 4),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000247")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeFilosofiaYLetras.Id,
                Name: "Licenciado en Ciencias de la Educación",
                Slug: "licenciado-en-ciencias-de-la-educacion",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000248")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeFilosofiaYLetras.Id,
                Name: "Licenciado en Filosofía",
                Slug: "licenciado-en-filosofia",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000249")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeFilosofiaYLetras.Id,
                Name: "Licenciado en Francés",
                Slug: "licenciado-en-frances",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-00000000024a")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeFilosofiaYLetras.Id,
                Name: "Licenciado en Geografía",
                Slug: "licenciado-en-geografia",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-00000000024b")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeFilosofiaYLetras.Id,
                Name: "Licenciado en Inglés",
                Slug: "licenciado-en-ingles",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-00000000024c")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeFilosofiaYLetras.Id,
                Name: "Licenciado en Letras",
                Slug: "licenciado-en-letras",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-00000000024d")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeFilosofiaYLetras.Id,
                Name: "Licenciado en Trabajo Social",
                Slug: "licenciado-en-trabajo-social",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-00000000024e")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeFilosofiaYLetras.Id,
                Name: "Profesor/a de Historia",
                Slug: "profesor-a-de-historia",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-00000000024f")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeFilosofiaYLetras.Id,
                Name: "Profesor en Artes Plásticas - Ciclo de Profesorado",
                Slug: "profesor-en-artes-plasticas-ciclo-de-profesorado",
                DurationYears: 2),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000250")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeFilosofiaYLetras.Id,
                Name: "Profesor en Ciencias de la Educación",
                Slug: "profesor-en-ciencias-de-la-educacion",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000251")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeFilosofiaYLetras.Id,
                Name: "Profesor en Ciencias Económicas - Ciclo de Profesorado",
                Slug: "profesor-en-ciencias-economicas-ciclo-de-profesorado",
                DurationYears: 2),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000252")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeFilosofiaYLetras.Id,
                Name: "Profesor en Filosofía",
                Slug: "profesor-en-filosofia",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000253")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeFilosofiaYLetras.Id,
                Name: "Profesor en Francés",
                Slug: "profesor-en-frances",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000254")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeFilosofiaYLetras.Id,
                Name: "Profesor en Geografía",
                Slug: "profesor-en-geografia",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000255")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeFilosofiaYLetras.Id,
                Name: "Profesor en Inglés",
                Slug: "profesor-en-ingles",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000256")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeFilosofiaYLetras.Id,
                Name: "Profesor en Letras",
                Slug: "profesor-en-letras",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000257")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeFilosofiaYLetras.Id,
                Name: "Profesor en Matemática",
                Slug: "profesor-en-matematica",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000258")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeFilosofiaYLetras.Id,
                Name: "Profesor en Química",
                Slug: "profesor-en-quimica",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000259")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeFilosofiaYLetras.Id,
                Name: "Técnico Universitario en Comunicación",
                Slug: "tecnico-universitario-en-comunicacion",
                DegreeType: CareerDegreeType.Tecnicatura,
                DurationYears: 3),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-00000000025a")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeMedicina.Id,
                Name: "Licenciado/a en Fonoaudiología - Ciclo de Complementación Curricular",
                Slug: "licenciado-a-en-fonoaudiologia-ciclo-de-complementacion-curricular",
                DurationYears: 2),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-00000000025b")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeMedicina.Id,
                Name: "Licenciado/a en Kinesiología y Fisiatría",
                Slug: "licenciado-a-en-kinesiologia-y-fisiatria",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-00000000025c")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeMedicina.Id,
                Name: "Médico",
                Slug: "medico",
                DegreeType: CareerDegreeType.Grado),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-00000000025d")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeOdontologia.Id,
                Name: "Odontólogo/a",
                Slug: "odontologo-a",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-00000000025e")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeOdontologia.Id,
                Name: "Técnico/a Universitario/a en Asistencia Dental",
                Slug: "tecnico-a-universitario-a-en-asistencia-dental",
                DegreeType: CareerDegreeType.Tecnicatura,
                DurationYears: 3),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-00000000025f")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDeOdontologia.Id,
                Name: "Técnico/a Universitario/a en Prótesis Dental",
                Slug: "tecnico-a-universitario-a-en-protesis-dental",
                DegreeType: CareerDegreeType.Tecnicatura,
                DurationYears: 3),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000260")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDePsicologia.Id,
                Name: "Profesor/a en Psicología - Ciclo de Complementación Curricular",
                Slug: "profesor-a-en-psicologia-ciclo-de-complementacion-curricular",
                DurationYears: 2),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000261")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDePsicologia.Id,
                Name: "Psicólogo",
                Slug: "psicologo",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000262")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuFacultadDePsicologiaConvenioBellaVista.Id,
                Name: "Técnico Universitario en Acompañamiento Terapéutico",
                Slug: "tecnico-universitario-en-acompanamiento-terapeutico",
                DegreeType: CareerDegreeType.Tecnicatura,
                DurationYears: 3),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000263")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuInstitutoUniversitarioMultidisciplinarioDeAguilaresArtes.Id,
                Name: "Licenciado en Artes Plásticas",
                Slug: "licenciado-en-artes-plasticas",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000264")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuInstitutoUniversitarioMultidisciplinarioDeAguilaresArtes.Id,
                Name: "Licenciado en Artes Plásticas (Especialidad: Escultura)",
                Slug: "licenciado-en-artes-plasticas-especialidad-escultura",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000265")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuInstitutoUniversitarioMultidisciplinarioDeAguilaresArtes.Id,
                Name: "Licenciado en Artes Plásticas (Especialidad: Grabado)",
                Slug: "licenciado-en-artes-plasticas-especialidad-grabado",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000266")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuInstitutoUniversitarioMultidisciplinarioDeAguilaresArtes.Id,
                Name: "Licenciado en Artes Plásticas (Especialidad: Pintura)",
                Slug: "licenciado-en-artes-plasticas-especialidad-pintura",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000267")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuRectorado.Id,
                Name: "Licenciado en Gestión Universitaria",
                Slug: "licenciado-en-gestion-universitaria",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000268")),
                UniversityId: Unt.Id,
                AcademicUnitId: AuRectorado.Id,
                Name: "Técnico Superior en Gestión Universitaria",
                Slug: "tecnico-superior-en-gestion-universitaria",
                DegreeType: CareerDegreeType.Tecnicatura,
                DurationYears: 3),
            Plan: null),

        // ---------- USPT: resto de la oferta de pregrado y grado de la Guía SIU
        // (20), sin plan detallado (relevar 20 planes no es esta tarea). ----------
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000300")),
                UniversityId: UspT.Id,
                AcademicUnitId: AuInstitutoDeDesarrolloTecnologicoParaLaCompetitividadTerritorial.Id,
                Name: "Licenciado en Ciencia y Tecnología de Alimentos",
                Slug: "licenciado-en-ciencia-y-tecnologia-de-alimentos",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 4),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000301")),
                UniversityId: UspT.Id,
                AcademicUnitId: AuInstitutoDeDesarrolloTecnologicoParaLaCompetitividadTerritorial.Id,
                Name: "Licenciado en Comercio Exterior",
                Slug: "licenciado-en-comercio-exterior",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 4),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000302")),
                UniversityId: UspT.Id,
                AcademicUnitId: AuInstitutoDeDesarrolloTecnologicoParaLaCompetitividadTerritorial.Id,
                Name: "Licenciado en Diseño Industrial",
                Slug: "licenciado-en-diseno-industrial",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000303")),
                UniversityId: UspT.Id,
                AcademicUnitId: AuInstitutoDeDesarrolloTecnologicoParaLaCompetitividadTerritorial.Id,
                Name: "Licenciado en Diseño Textil y de Indumentaria",
                Slug: "licenciado-en-diseno-textil-y-de-indumentaria",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 4),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000304")),
                UniversityId: UspT.Id,
                AcademicUnitId: AuInstitutoDeDesarrolloTecnologicoParaLaCompetitividadTerritorial.Id,
                Name: "Licenciado en Finanzas",
                Slug: "licenciado-en-finanzas",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 4),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000305")),
                UniversityId: UspT.Id,
                AcademicUnitId: AuInstitutoDeDesarrolloTecnologicoParaLaCompetitividadTerritorial.Id,
                Name: "Licenciado en Gestión de Empresas Agroindustriales",
                Slug: "licenciado-en-gestion-de-empresas-agroindustriales",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 4),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000306")),
                UniversityId: UspT.Id,
                AcademicUnitId: AuInstitutoDeDesarrolloTecnologicoParaLaCompetitividadTerritorial.Id,
                Name: "Técnico en Diseño Industrial",
                Slug: "tecnico-en-diseno-industrial",
                DegreeType: CareerDegreeType.Tecnicatura,
                DurationYears: 3),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000307")),
                UniversityId: UspT.Id,
                AcademicUnitId: AuInstitutoDeEstudiosSocialesPoliticaYCultura.Id,
                Name: "Abogado",
                Slug: "abogado",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000308")),
                UniversityId: UspT.Id,
                AcademicUnitId: AuInstitutoDeEstudiosSocialesPoliticaYCultura.Id,
                Name: "Contador Público Nacional",
                Slug: "contador-publico-nacional",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 4),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000309")),
                UniversityId: UspT.Id,
                AcademicUnitId: AuInstitutoDeEstudiosSocialesPoliticaYCultura.Id,
                Name: "Corredor Inmobiliario",
                Slug: "corredor-inmobiliario",
                DegreeType: CareerDegreeType.Tecnicatura,
                DurationYears: 3),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-00000000030a")),
                UniversityId: UspT.Id,
                AcademicUnitId: AuInstitutoDeEstudiosSocialesPoliticaYCultura.Id,
                Name: "Licenciado en Ciencia Política",
                Slug: "licenciado-en-ciencia-politica",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 4),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-00000000030b")),
                UniversityId: UspT.Id,
                AcademicUnitId: AuInstitutoDeEstudiosSocialesPoliticaYCultura.Id,
                Name: "Licenciado en Periodismo",
                Slug: "licenciado-en-periodismo",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 4),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-00000000030c")),
                UniversityId: UspT.Id,
                AcademicUnitId: AuInstitutoDeEstudiosSocialesPoliticaYCultura.Id,
                Name: "Licenciado en Relaciones Internacionales",
                Slug: "licenciado-en-relaciones-internacionales",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 4),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-00000000030d")),
                UniversityId: UspT.Id,
                AcademicUnitId: AuInstitutoDeEstudiosSocialesPoliticaYCultura.Id,
                Name: "Licenciado en Seguridad Ciudadana",
                Slug: "licenciado-en-seguridad-ciudadana",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 4),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-00000000030e")),
                UniversityId: UspT.Id,
                AcademicUnitId: AuInstitutoDeEstudiosSocialesPoliticaYCultura.Id,
                Name: "Procurador/a",
                Slug: "procurador-a",
                DegreeType: CareerDegreeType.Tecnicatura,
                DurationYears: 4),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-00000000030f")),
                UniversityId: UspT.Id,
                AcademicUnitId: AuInstitutoDeEstudiosSocialesPoliticaYCultura.Id,
                Name: "Técnico en Desarrollo Social",
                Slug: "tecnico-en-desarrollo-social",
                DegreeType: CareerDegreeType.Tecnicatura,
                DurationYears: 3),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000310")),
                UniversityId: UspT.Id,
                AcademicUnitId: AuInstitutoDeEstudiosSocialesPoliticaYCultura.Id,
                Name: "Técnico Jurídico de Empresas",
                Slug: "tecnico-juridico-de-empresas",
                DegreeType: CareerDegreeType.Tecnicatura,
                DurationYears: 3),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000311")),
                UniversityId: UspT.Id,
                AcademicUnitId: AuInstitutoDeEstudiosSocialesPoliticaYCultura.Id,
                Name: "Técnico Universitario en Protocolo, Ceremonial y Organización de Eventos",
                Slug: "tecnico-universitario-en-protocolo-ceremonial-y-organizacion-de-eventos",
                DegreeType: CareerDegreeType.Tecnicatura,
                DurationYears: 2),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000312")),
                UniversityId: UspT.Id,
                AcademicUnitId: AuInstitutoDeEstudiosSocialesPoliticaYCultura.Id,
                Name: "Técnico Universitario en Taquigrafía y Estenotipia",
                Slug: "tecnico-universitario-en-taquigrafia-y-estenotipia",
                DegreeType: CareerDegreeType.Tecnicatura,
                DurationYears: 2),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000313")),
                UniversityId: UspT.Id,
                AcademicUnitId: AuInstitutoDeSaludYCalidadDeVida.Id,
                Name: "Médico",
                Slug: "medico",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 6),
            Plan: null),

        // ---------- UNSE: resto de la oferta de pregrado y grado de la Guía SIU
        // (7), sin plan detallado (relevar 7 planes no es esta tarea). ----------
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000400")),
                UniversityId: Unse.Id,
                AcademicUnitId: AuCentroDeEstudiosDelTucumanCetucTucuman.Id,
                Name: "Licenciado en Gestión Educativa - MD",
                Slug: "licenciado-en-gestion-educativa-md"),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000401")),
                UniversityId: Unse.Id,
                AcademicUnitId: AuInstitutoDeEducacionSuperiorSisaiani.Id,
                Name: "Analista en Gestión Educativa",
                Slug: "analista-en-gestion-educativa",
                DegreeType: CareerDegreeType.Tecnicatura,
                DurationYears: 2),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000402")),
                UniversityId: Unse.Id,
                AcademicUnitId: AuInstitutoDeEducacionSuperiorSisaiani.Id,
                Name: "Licenciado/a en Gestión Educativa - Ciclo de Complementación Curricular - MD",
                Slug: "licenciado-a-en-gestion-educativa-ciclo-de-complementacion-curricular-md",
                DurationYears: 2),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000403")),
                UniversityId: Unse.Id,
                AcademicUnitId: AuInstitutoDeEducacionSuperiorSisaiani.Id,
                Name: "Licenciado en Educación Inicial - Ciclo de Licenciatura - MD",
                Slug: "licenciado-en-educacion-inicial-ciclo-de-licenciatura-md",
                DurationYears: 2),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000404")),
                UniversityId: Unse.Id,
                AcademicUnitId: AuInstitutoDeEducacionSuperiorSisaiani.Id,
                Name: "Licenciado en Educación Primaria - Ciclo de Licenciatura - MD",
                Slug: "licenciado-en-educacion-primaria-ciclo-de-licenciatura-md",
                DurationYears: 2),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000405")),
                UniversityId: Unse.Id,
                AcademicUnitId: AuTucumanVillaQuinteros.Id,
                Name: "Técnico Universitario en Viveros y Plantaciones Forestales",
                Slug: "tecnico-universitario-en-viveros-y-plantaciones-forestales",
                DegreeType: CareerDegreeType.Tecnicatura),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000406")),
                UniversityId: Unse.Id,
                AcademicUnitId: AuTucumanVillaQuinteros.Id,
                Name: "Técnico Universitario Fitosanitarista",
                Slug: "tecnico-universitario-fitosanitarista",
                DegreeType: CareerDegreeType.Tecnicatura),
            Plan: null),

        // ---------- UTN-FRT: resto de la oferta de pregrado y grado de la Guía SIU
        // (14), sin plan detallado (relevar 14 planes no es esta tarea). ----------
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000500")),
                UniversityId: UtnFrt.Id,
                AcademicUnitId: AuFacultadRegionalTucuman.Id,
                Name: "Analista Universitario de Sistemas",
                Slug: "analista-universitario-de-sistemas",
                DegreeType: CareerDegreeType.Tecnicatura,
                DurationYears: 3),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000501")),
                UniversityId: UtnFrt.Id,
                AcademicUnitId: AuFacultadRegionalTucuman.Id,
                Name: "Ingeniero/a en Energía Eléctrica",
                Slug: "ingeniero-a-en-energia-electrica",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000502")),
                UniversityId: UtnFrt.Id,
                AcademicUnitId: AuFacultadRegionalTucuman.Id,
                Name: "Ingeniero Civil",
                Slug: "ingeniero-civil",
                DegreeType: CareerDegreeType.Grado),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000503")),
                UniversityId: UtnFrt.Id,
                AcademicUnitId: AuFacultadRegionalTucuman.Id,
                Name: "Ingeniero Electrónico",
                Slug: "ingeniero-electronico",
                DegreeType: CareerDegreeType.Grado),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000504")),
                UniversityId: UtnFrt.Id,
                AcademicUnitId: AuFacultadRegionalTucuman.Id,
                Name: "Ingeniero Mecánico",
                Slug: "ingeniero-mecanico",
                DegreeType: CareerDegreeType.Grado,
                DurationYears: 5),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000505")),
                UniversityId: UtnFrt.Id,
                AcademicUnitId: AuFacultadRegionalTucuman.Id,
                Name: "Licenciado en Gestión Ambiental - Ciclo de Complementación Curricular - MD",
                Slug: "licenciado-en-gestion-ambiental-ciclo-de-complementacion-curricular-md",
                DurationYears: 2),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000506")),
                UniversityId: UtnFrt.Id,
                AcademicUnitId: AuFacultadRegionalTucuman.Id,
                Name: "Licenciado en Higiene y Seguridad en el Trabajo - Ciclo de Complementación Curricular",
                Slug: "licenciado-en-higiene-y-seguridad-en-el-trabajo-ciclo-de-complementacion-curricular",
                DurationYears: 2),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000507")),
                UniversityId: UtnFrt.Id,
                AcademicUnitId: AuFacultadRegionalTucuman.Id,
                Name: "Licenciado en Tecnología Educativa - Ciclo de Complementación Curricular",
                Slug: "licenciado-en-tecnologia-educativa-ciclo-de-complementacion-curricular"),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000508")),
                UniversityId: UtnFrt.Id,
                AcademicUnitId: AuFacultadRegionalTucuman.Id,
                Name: "Técnico Universitario en Electrónica",
                Slug: "tecnico-universitario-en-electronica",
                DegreeType: CareerDegreeType.Tecnicatura,
                DurationYears: 4),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-000000000509")),
                UniversityId: UtnFrt.Id,
                AcademicUnitId: AuFacultadRegionalTucuman.Id,
                Name: "Técnico Universitario en Energías Sustentables",
                Slug: "tecnico-universitario-en-energias-sustentables",
                DegreeType: CareerDegreeType.Tecnicatura),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-00000000050a")),
                UniversityId: UtnFrt.Id,
                AcademicUnitId: AuFacultadRegionalTucuman.Id,
                Name: "Técnico Universitario en Higiene y Seguridad en el Trabajo",
                Slug: "tecnico-universitario-en-higiene-y-seguridad-en-el-trabajo",
                DegreeType: CareerDegreeType.Tecnicatura,
                DurationYears: 3),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-00000000050b")),
                UniversityId: UtnFrt.Id,
                AcademicUnitId: AuFacultadRegionalTucuman.Id,
                Name: "Técnico Universitario en Logística",
                Slug: "tecnico-universitario-en-logistica",
                DegreeType: CareerDegreeType.Tecnicatura),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-00000000050c")),
                UniversityId: UtnFrt.Id,
                AcademicUnitId: AuFacultadRegionalTucuman.Id,
                Name: "Técnico Universitario en Mantenimiento Industrial",
                Slug: "tecnico-universitario-en-mantenimiento-industrial",
                DegreeType: CareerDegreeType.Tecnicatura,
                DurationYears: 2),
            Plan: null),
        new CareerSeed(
            Career: new CareerRecord(
                Id: new CareerId(Guid.Parse("00000002-0000-4000-a000-00000000050d")),
                UniversityId: UtnFrt.Id,
                AcademicUnitId: AuFacultadRegionalTucuman.Id,
                Name: "Técnico Universitario en Mecatrónica",
                Slug: "tecnico-universitario-en-mecatronica",
                DegreeType: CareerDegreeType.Tecnicatura,
                DurationYears: 2),
            Plan: null),
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
            YearInPlan: 1, TermInYear: null, TermKind: TermKind.FullYear,
            WeeklyHours: 3, TotalHours: 84),
        new SubjectRecord(
            Id: new SubjectId(Guid.Parse("00000004-0000-4000-a000-000000000002")),
            CareerPlanId: TudcsPlanId,
            Code: "102",
            Name: "Álgebra I",
            YearInPlan: 1, TermInYear: 1, TermKind: TermKind.FourMonth,
            WeeklyHours: 4, TotalHours: 56),
        new SubjectRecord(
            Id: new SubjectId(Guid.Parse("00000004-0000-4000-a000-000000000003")),
            CareerPlanId: TudcsPlanId,
            Code: "103",
            Name: "Inglés A1",
            YearInPlan: 1, TermInYear: null, TermKind: TermKind.FullYear,
            WeeklyHours: 4, TotalHours: 112),
        new SubjectRecord(
            Id: new SubjectId(Guid.Parse("00000004-0000-4000-a000-000000000004")),
            CareerPlanId: TudcsPlanId,
            Code: "104",
            Name: "Formación Humanística I",
            YearInPlan: 1, TermInYear: null, TermKind: TermKind.FullYear,
            WeeklyHours: 3, TotalHours: 84),
        new SubjectRecord(
            Id: new SubjectId(Guid.Parse("00000004-0000-4000-a000-000000000005")),
            CareerPlanId: TudcsPlanId,
            Code: "111",
            Name: "Desarrollo de Software",
            YearInPlan: 1, TermInYear: 1, TermKind: TermKind.FourMonth,
            WeeklyHours: 3, TotalHours: 42),
        new SubjectRecord(
            Id: new SubjectId(Guid.Parse("00000004-0000-4000-a000-000000000006")),
            CareerPlanId: TudcsPlanId,
            Code: "113",
            Name: "Gestión de RR.HH",
            YearInPlan: 1, TermInYear: 1, TermKind: TermKind.FourMonth,
            WeeklyHours: 3, TotalHours: 42),
        new SubjectRecord(
            Id: new SubjectId(Guid.Parse("00000004-0000-4000-a000-000000000007")),
            CareerPlanId: TudcsPlanId,
            Code: "121",
            Name: "Base de datos",
            YearInPlan: 1, TermInYear: 2, TermKind: TermKind.FourMonth,
            WeeklyHours: 3, TotalHours: 42),
        new SubjectRecord(
            Id: new SubjectId(Guid.Parse("00000004-0000-4000-a000-000000000008")),
            CareerPlanId: TudcsPlanId,
            Code: "122",
            Name: "Álgebra II",
            YearInPlan: 1, TermInYear: 2, TermKind: TermKind.FourMonth,
            WeeklyHours: 4, TotalHours: 56),
        new SubjectRecord(
            Id: new SubjectId(Guid.Parse("00000004-0000-4000-a000-000000000009")),
            CareerPlanId: TudcsPlanId,
            Code: "123",
            Name: "Seminario Informático I",
            YearInPlan: 1, TermInYear: 2, TermKind: TermKind.FourMonth,
            WeeklyHours: 3, TotalHours: 42),

        // ---------- 2do año ----------
        new SubjectRecord(
            Id: new SubjectId(Guid.Parse("00000004-0000-4000-a000-000000000010")),
            CareerPlanId: TudcsPlanId,
            Code: "201",
            Name: "Inglés A2",
            YearInPlan: 2, TermInYear: null, TermKind: TermKind.FullYear,
            WeeklyHours: 4, TotalHours: 112),
        new SubjectRecord(
            Id: new SubjectId(Guid.Parse("00000004-0000-4000-a000-000000000011")),
            CareerPlanId: TudcsPlanId,
            Code: "202",
            Name: "Formación Humanística II",
            YearInPlan: 2, TermInYear: null, TermKind: TermKind.FullYear,
            WeeklyHours: 4, TotalHours: 112),
        new SubjectRecord(
            Id: new SubjectId(Guid.Parse("00000004-0000-4000-a000-000000000012")),
            CareerPlanId: TudcsPlanId,
            Code: "211",
            Name: "Fundamentos de Control de Calidad",
            YearInPlan: 2, TermInYear: 1, TermKind: TermKind.FourMonth,
            WeeklyHours: 4, TotalHours: 56),
        new SubjectRecord(
            Id: new SubjectId(Guid.Parse("00000004-0000-4000-a000-000000000013")),
            CareerPlanId: TudcsPlanId,
            Code: "212",
            Name: "Seminario Informático II",
            YearInPlan: 2, TermInYear: 1, TermKind: TermKind.FourMonth,
            WeeklyHours: 3, TotalHours: 42),
        new SubjectRecord(
            Id: new SubjectId(Guid.Parse("00000004-0000-4000-a000-000000000014")),
            CareerPlanId: TudcsPlanId,
            Code: "213",
            Name: "Desarrollo Front End",
            YearInPlan: 2, TermInYear: 1, TermKind: TermKind.FourMonth,
            WeeklyHours: 6, TotalHours: 84),
        new SubjectRecord(
            Id: new SubjectId(Guid.Parse("00000004-0000-4000-a000-000000000015")),
            CareerPlanId: TudcsPlanId,
            Code: "221",
            Name: "Control de Calidad Avanzado",
            YearInPlan: 2, TermInYear: 2, TermKind: TermKind.FourMonth,
            WeeklyHours: 4, TotalHours: 56),
        new SubjectRecord(
            Id: new SubjectId(Guid.Parse("00000004-0000-4000-a000-000000000016")),
            CareerPlanId: TudcsPlanId,
            Code: "222",
            Name: "Seminario Informático III",
            YearInPlan: 2, TermInYear: 2, TermKind: TermKind.FourMonth,
            WeeklyHours: 3, TotalHours: 42),
        new SubjectRecord(
            Id: new SubjectId(Guid.Parse("00000004-0000-4000-a000-000000000017")),
            CareerPlanId: TudcsPlanId,
            Code: "223",
            Name: "Desarrollo Back End",
            YearInPlan: 2, TermInYear: 2, TermKind: TermKind.FourMonth,
            WeeklyHours: 6, TotalHours: 84),

        // ---------- 3er año ----------
        new SubjectRecord(
            Id: new SubjectId(Guid.Parse("00000004-0000-4000-a000-000000000018")),
            CareerPlanId: TudcsPlanId,
            Code: "311",
            Name: "Desarrollo de Aplicaciones Web",
            YearInPlan: 3, TermInYear: 1, TermKind: TermKind.FourMonth,
            WeeklyHours: 5, TotalHours: 70),
        new SubjectRecord(
            Id: new SubjectId(Guid.Parse("00000004-0000-4000-a000-000000000019")),
            CareerPlanId: TudcsPlanId,
            Code: "312",
            Name: "Testeo Automatizado",
            YearInPlan: 3, TermInYear: 1, TermKind: TermKind.FourMonth,
            WeeklyHours: 3, TotalHours: 42),
        new SubjectRecord(
            Id: new SubjectId(Guid.Parse("00000004-0000-4000-a000-000000000020")),
            CareerPlanId: TudcsPlanId,
            Code: "313",
            Name: "Inglés B1:1",
            YearInPlan: 3, TermInYear: 1, TermKind: TermKind.FourMonth,
            WeeklyHours: 3, TotalHours: 42),
        new SubjectRecord(
            Id: new SubjectId(Guid.Parse("00000004-0000-4000-a000-000000000021")),
            CareerPlanId: TudcsPlanId,
            Code: "314",
            Name: "Proyecto Final",
            YearInPlan: 3, TermInYear: 1, TermKind: TermKind.FourMonth,
            // 0 hs semanales es correcto (no es una cursada con horario fijo, ver
            // Subject.Validate): no lo "corrijas" a 1. 350 hs totales.
            WeeklyHours: 0, TotalHours: 350),

    };

    // ====================================================================
    // Prerequisites (correlativas, ADR-0003). 16 parejas reales cargadas dos veces, una por type:
    // ToEnroll (para inscribirte a cursar necesitás la previa regularizada) y ToTakeFinal (para
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
            records.Add(new PrerequisiteRecord(subjectId, requiredId, PrerequisiteType.ToEnroll));
            records.Add(new PrerequisiteRecord(subjectId, requiredId, PrerequisiteType.ToTakeFinal));
        }

        return records;
    }

    // ====================================================================
    // AcademicTerms (UNSTA cuatrimestrales 2024-2026)
    //
    // Cobertura: 6 cuatrimestres consecutivos (2024-1c hasta 2026-2c). Cubre las reseñas de
    // cursada mockeadas (CatalogSeedData) + el cuatrimestre actual donde se cargaría una materia
    // nueva.
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
            Year: 2024, Number: 1, Kind: TermKind.FourMonth,
            StartDate: new DateOnly(2024, 3, 11),
            EndDate: new DateOnly(2024, 7, 6),
            EnrollmentOpens: new DateTimeOffset(2024, 2, 19, 0, 0, 0, TimeSpan.Zero),
            EnrollmentCloses: new DateTimeOffset(2024, 3, 8, 23, 59, 59, TimeSpan.Zero)),
        new AcademicTermRecord(
            Id: new AcademicTermId(Guid.Parse("00000005-0000-4000-a000-000000000002")),
            UniversityId: Unsta.Id,
            Year: 2024, Number: 2, Kind: TermKind.FourMonth,
            StartDate: new DateOnly(2024, 8, 5),
            EndDate: new DateOnly(2024, 11, 30),
            EnrollmentOpens: new DateTimeOffset(2024, 7, 15, 0, 0, 0, TimeSpan.Zero),
            EnrollmentCloses: new DateTimeOffset(2024, 8, 2, 23, 59, 59, TimeSpan.Zero)),
        new AcademicTermRecord(
            Id: new AcademicTermId(Guid.Parse("00000005-0000-4000-a000-000000000003")),
            UniversityId: Unsta.Id,
            Year: 2025, Number: 1, Kind: TermKind.FourMonth,
            StartDate: new DateOnly(2025, 3, 10),
            EndDate: new DateOnly(2025, 7, 5),
            EnrollmentOpens: new DateTimeOffset(2025, 2, 17, 0, 0, 0, TimeSpan.Zero),
            EnrollmentCloses: new DateTimeOffset(2025, 3, 7, 23, 59, 59, TimeSpan.Zero)),
        new AcademicTermRecord(
            Id: new AcademicTermId(Guid.Parse("00000005-0000-4000-a000-000000000004")),
            UniversityId: Unsta.Id,
            Year: 2025, Number: 2, Kind: TermKind.FourMonth,
            StartDate: new DateOnly(2025, 8, 4),
            EndDate: new DateOnly(2025, 11, 29),
            EnrollmentOpens: new DateTimeOffset(2025, 7, 14, 0, 0, 0, TimeSpan.Zero),
            EnrollmentCloses: new DateTimeOffset(2025, 8, 1, 23, 59, 59, TimeSpan.Zero)),
        new AcademicTermRecord(
            Id: new AcademicTermId(Guid.Parse("00000005-0000-4000-a000-000000000005")),
            UniversityId: Unsta.Id,
            Year: 2026, Number: 1, Kind: TermKind.FourMonth,
            StartDate: new DateOnly(2026, 3, 9),
            EndDate: new DateOnly(2026, 7, 4),
            EnrollmentOpens: new DateTimeOffset(2026, 2, 16, 0, 0, 0, TimeSpan.Zero),
            EnrollmentCloses: new DateTimeOffset(2026, 3, 6, 23, 59, 59, TimeSpan.Zero)),
        new AcademicTermRecord(
            Id: new AcademicTermId(Guid.Parse("00000005-0000-4000-a000-000000000006")),
            UniversityId: Unsta.Id,
            Year: 2026, Number: 2, Kind: TermKind.FourMonth,
            StartDate: new DateOnly(2026, 8, 3),
            EndDate: new DateOnly(2026, 11, 28),
            EnrollmentOpens: new DateTimeOffset(2026, 7, 13, 0, 0, 0, TimeSpan.Zero),
            EnrollmentCloses: new DateTimeOffset(2026, 7, 31, 23, 59, 59, TimeSpan.Zero)),
    };

    // ====================================================================
    // Teachers (UNSTA): catálogo docente de prueba (US-063). Nombres en lowercase
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

        // Titulares de las cátedras del seed (US-196, ver sección Chairs más abajo): ninguno de
        // los diez docentes de arriba tiene estos apellidos, así que se agregan acá.
        new TeacherRecord(Tid("0b"), Unsta.Id, "martín", "pérez", "Profesor Titular"),
        new TeacherRecord(Tid("0c"), Unsta.Id, "patricia", "gonzález", "Profesora Titular"),
        new TeacherRecord(Tid("0d"), Unsta.Id, "sergio", "ruiz", "Profesor Titular"),

        // Titulares de las cátedras nuevas de la Tecnicatura UNSTA: una por cada
        // materia del plan que hasta acá no tenía ninguna cátedra sembrada, más dos auxiliares.
        // Ningún docente real.
        new TeacherRecord(Tid("0e"), Unsta.Id, "lucas", "ibáñez", "Profesor Titular"),
        new TeacherRecord(Tid("0f"), Unsta.Id, "valeria", "vega", "Profesora Titular"),
        new TeacherRecord(Tid("10"), Unsta.Id, "matías", "domínguez", "Profesor Titular"),
        new TeacherRecord(Tid("11"), Unsta.Id, "sofía", "aráoz", "Profesora Titular"),
        new TeacherRecord(Tid("12"), Unsta.Id, "nicolás", "bravo", "Profesor Titular"),
        new TeacherRecord(Tid("13"), Unsta.Id, "camila", "fernández", "Profesora Titular"),
        new TeacherRecord(Tid("14"), Unsta.Id, "federico", "molina", "Profesor Titular"),
        new TeacherRecord(Tid("15"), Unsta.Id, "julieta", "aguirre", "Profesora Titular"),
        new TeacherRecord(Tid("16"), Unsta.Id, "emiliano", "benítez", "Profesor Titular"),
        new TeacherRecord(Tid("17"), Unsta.Id, "agustina", "correa", "Profesora Titular"),
        new TeacherRecord(Tid("18"), Unsta.Id, "ezequiel", "romero", "Profesor Titular"),
        new TeacherRecord(Tid("19"), Unsta.Id, "daniela", "acosta", "Profesora Titular"),
        new TeacherRecord(Tid("1a"), Unsta.Id, "maximiliano", "herrera", "Profesor Titular"),
        new TeacherRecord(Tid("1b"), Unsta.Id, "carolina", "godoy", "Profesora Titular"),
        new TeacherRecord(Tid("1c"), Unsta.Id, "leandro", "juárez", "Profesor Titular"),
        new TeacherRecord(Tid("1d"), Unsta.Id, "antonella", "morales", "Profesora Titular"),
        new TeacherRecord(Tid("1e"), Unsta.Id, "gonzalo", "ortiz", "Profesor Titular"),
        new TeacherRecord(Tid("1f"), Unsta.Id, "micaela", "luna", "Profesora Titular"),
        new TeacherRecord(Tid("20"), Unsta.Id, "ramiro", "cabrera", "Profesor Titular"),
        new TeacherRecord(Tid("21"), Unsta.Id, "tomás", "paz", "Profesor Titular"),
        new TeacherRecord(Tid("22"), Unsta.Id, "belén", "silva", "Profesora Titular"),
        new TeacherRecord(Tid("23"), Unsta.Id, "rocío", "franco", "Jefa de Trabajos Prácticos"),
        new TeacherRecord(Tid("24"), Unsta.Id, "joaquín", "vera", "Jefe de Trabajos Prácticos"),
    };

    private static TeacherId Tid(string nn) =>
        new(Guid.Parse($"00000006-0000-4000-a000-0000000000{nn}"));

    private static SubjectId Sid(string nn) =>
        new(Guid.Parse($"00000004-0000-4000-a000-0000000000{nn}"));

    private static AcademicTermId Atid(string nn) =>
        new(Guid.Parse($"00000005-0000-4000-a000-0000000000{nn}"));

    // ====================================================================
    // Chairs (UNSTA + UTN-FRT): cátedras de prueba para Reseñar (US-196). El mockup de la ficha
    // (SC-002-chair/sketch.html) usa "Análisis Matemático II", que no es una materia del plan real
    // de la TUDCS sembrado acá: se sustituye por Fundamentos de Control de Calidad (211), la
    // primera materia cuatrimestral de 2do año del plan. Tres cátedras con sus titulares, nombradas
    // como el alumno las recuerda ("cursé con Pérez"): Pérez, González y Ruiz, mismos nombres que
    // usa ese mockup. Ningún docente ya sembrado tiene esos apellidos (ver sección Teachers), así
    // que sus titulares son los tres agregados ahí. since_term_id de cada titular apunta al período
    // más viejo del seed (2024-1c).
    //
    // El resto del bloque le suma una cátedra con titular a cada una de las 18
    // materias restantes de la Tecnicatura UNSTA (211 ya tenía tres, y esto cierra las 21), más
    // el equipo de seis cátedras de la Tecnicatura nueva de UTN-FRT. El corpus de reseñas
    // (CorpusSeedData, módulo reviews) responde sobre un subconjunto de estas: el resto queda con
    // titular y cero reseñas, que es el estado "materia sin ninguna voz todavía".
    //
    // Convención de UUIDs:
    //   - Chairs: 00000008-0000-4000-a000-0000000000NN
    // ====================================================================
    private static readonly SubjectId ControlDeCalidadSubjectId = Sid("12");

    public static IReadOnlyList<ChairRecord> Chairs { get; } = new[]
    {
        new ChairRecord(Chid("01"), ControlDeCalidadSubjectId, "Pérez",
            new[] { new ChairMemberRecord(Tid("0b"), ChairMemberRole.Lead, Atid("01")) }),
        new ChairRecord(Chid("02"), ControlDeCalidadSubjectId, "González",
            new[] { new ChairMemberRecord(Tid("0c"), ChairMemberRole.Lead, Atid("01")) }),
        new ChairRecord(Chid("03"), ControlDeCalidadSubjectId, "Ruiz",
            new[] { new ChairMemberRecord(Tid("0d"), ChairMemberRole.Lead, Atid("01")) }),

        // ---------- UNSTA: una cátedra por cada materia sin cátedra sembrada ----------
        new ChairRecord(Chid("04"), Sid("05"), "Ibáñez",
            new[]
            {
                new ChairMemberRecord(Tid("0e"), ChairMemberRole.Lead, Atid("01")),
                new ChairMemberRecord(Tid("24"), ChairMemberRole.Assistant, Atid("01")),
            }),
        new ChairRecord(Chid("05"), Sid("05"), "Vega",
            new[] { new ChairMemberRecord(Tid("0f"), ChairMemberRole.Lead, Atid("01")) }),
        new ChairRecord(Chid("06"), Sid("07"), "Domínguez",
            new[]
            {
                new ChairMemberRecord(Tid("10"), ChairMemberRole.Lead, Atid("01")),
                new ChairMemberRecord(Tid("23"), ChairMemberRole.Assistant, Atid("01")),
            }),
        new ChairRecord(Chid("07"), Sid("08"), "Aráoz",
            new[] { new ChairMemberRecord(Tid("11"), ChairMemberRole.Lead, Atid("01")) }),
        new ChairRecord(Chid("08"), Sid("09"), "Bravo",
            new[] { new ChairMemberRecord(Tid("12"), ChairMemberRole.Lead, Atid("01")) }),
        new ChairRecord(Chid("09"), Sid("01"), "Fernández",
            new[] { new ChairMemberRecord(Tid("13"), ChairMemberRole.Lead, Atid("01")) }),
        new ChairRecord(Chid("0a"), Sid("02"), "Molina",
            new[] { new ChairMemberRecord(Tid("14"), ChairMemberRole.Lead, Atid("01")) }),
        new ChairRecord(Chid("0b"), Sid("03"), "Aguirre",
            new[] { new ChairMemberRecord(Tid("15"), ChairMemberRole.Lead, Atid("01")) }),
        new ChairRecord(Chid("0c"), Sid("04"), "Benítez",
            new[] { new ChairMemberRecord(Tid("16"), ChairMemberRole.Lead, Atid("01")) }),
        new ChairRecord(Chid("0d"), Sid("06"), "Correa",
            new[] { new ChairMemberRecord(Tid("17"), ChairMemberRole.Lead, Atid("01")) }),
        // Sid("10") (201 Inglés A2) se queda sin cátedra a propósito: es la materia real que
        // GetSubjectFactsEndpointTests usa como "existe en el plan, cero cátedras" (antes lo daba
        // la carrera ficticia de UTN-FRT, retirada en R6). Docente "ezequiel romero" (Tid 18)
        // sigue en el catálogo, sin cátedra asignada, igual que los diez docentes generales del
        // arranque de la lista.
        new ChairRecord(Chid("0f"), Sid("11"), "Acosta",
            new[] { new ChairMemberRecord(Tid("19"), ChairMemberRole.Lead, Atid("01")) }),
        new ChairRecord(Chid("10"), Sid("13"), "Herrera",
            new[] { new ChairMemberRecord(Tid("1a"), ChairMemberRole.Lead, Atid("01")) }),
        new ChairRecord(Chid("11"), Sid("14"), "Godoy",
            new[] { new ChairMemberRecord(Tid("1b"), ChairMemberRole.Lead, Atid("01")) }),
        new ChairRecord(Chid("12"), Sid("15"), "Juárez",
            new[] { new ChairMemberRecord(Tid("1c"), ChairMemberRole.Lead, Atid("01")) }),
        new ChairRecord(Chid("13"), Sid("16"), "Morales",
            new[] { new ChairMemberRecord(Tid("1d"), ChairMemberRole.Lead, Atid("01")) }),
        new ChairRecord(Chid("14"), Sid("17"), "Ortiz",
            new[] { new ChairMemberRecord(Tid("1e"), ChairMemberRole.Lead, Atid("01")) }),
        new ChairRecord(Chid("15"), Sid("18"), "Luna",
            new[] { new ChairMemberRecord(Tid("1f"), ChairMemberRole.Lead, Atid("01")) }),
        new ChairRecord(Chid("16"), Sid("19"), "Cabrera",
            new[] { new ChairMemberRecord(Tid("20"), ChairMemberRole.Lead, Atid("01")) }),
        new ChairRecord(Chid("17"), Sid("20"), "Paz",
            new[] { new ChairMemberRecord(Tid("21"), ChairMemberRole.Lead, Atid("01")) }),
        new ChairRecord(Chid("18"), Sid("21"), "Silva",
            new[] { new ChairMemberRecord(Tid("22"), ChairMemberRole.Lead, Atid("01")) }),
    };

    private static ChairId Chid(string nn) =>
        new(Guid.Parse($"00000008-0000-4000-a000-0000000000{nn}"));
}

/// <summary>Datos planos de una University del seed.</summary>
public sealed record UniversityRecord(
    UniversityId Id, string Name, string Slug, IReadOnlyList<string> InstitutionalEmailDomains);

/// <summary>
/// Datos planos de una AcademicUnit del seed (R6, tarea 19). <see cref="Address"/> es el domicilio
/// tal como lo publica la Guía SIU, sin normalizar: es la evidencia y no se pierde. La localidad
/// normalizada (id y nombre de Georef) no vive acá porque se resuelve al sembrar, no en el dato
/// estático (ver <c>IGeorefLocalityResolver</c>).
/// </summary>
public sealed record AcademicUnitRecord(
    AcademicUnitId Id, UniversityId UniversityId, string Name, string Slug, string Address);

/// <summary>
/// Datos planos de una Career del seed. <see cref="DegreeType"/> y <see cref="DurationYears"/> son
/// opcionales (R6): el catálogo real de Tucumán los completa cuando la Guía SIU los da tal cual
/// (tipo de título, duración en años enteros); si la fuente no encaja (un ciclo que no es "de cero",
/// una duración en cuatrimestres o con medio año) quedan sin dato en vez de forzarlo.
/// </summary>
public sealed record CareerRecord(
    CareerId Id,
    UniversityId UniversityId,
    AcademicUnitId AcademicUnitId,
    string Name,
    string Slug,
    CareerDegreeType? DegreeType = null,
    int? DurationYears = null);

/// <summary>Datos planos de un CareerPlan del seed (Career inferido por contexto).</summary>
public sealed record CareerPlanRecord(CareerPlanId Id, int Year, string? Label = null);

/// <summary>
/// Par Career + CareerPlan. <see cref="Plan"/> es nulo para la oferta que R6 carga sin plan
/// detallado (relevar 229 planes no es esta tarea): la carrera existe, el plan queda para cuando
/// alguien lo releve.
/// </summary>
public sealed record CareerSeed(CareerRecord Career, CareerPlanRecord? Plan);

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
/// estables desde fixtures de tests.
///
/// <para>
/// Sin <c>Label</c>: lo computa el seeder con <c>AcademicTerm.ComputeLabel</c>, el mismo método que
/// usa el alta admin. Cuando el seed traía su propia convención ("2026-C1") y el admin la suya
/// ("2026-C1"), el mismo dropdown mezclaba las dos formas de nombrar el mismo tipo de período según
/// quién lo hubiera creado, y ninguna de las dos era "la" convención.
/// </para>
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
    DateTimeOffset EnrollmentCloses);

/// <summary>
/// Docente del seed. Nombres en lowercase (storage). UUIDs determinísticos para referencias
/// estables (las reseñas de prueba van a apuntar a estos ids cuando aterrice "docente real por reseña").
/// </summary>
public sealed record TeacherRecord(
    TeacherId Id, UniversityId UniversityId, string FirstName, string LastName, string? Title);

/// <summary>
/// Cátedra del seed con su equipo embebido (US-196). UUIDs determinísticos. <see cref="Name"/> se
/// guarda tal cual (display-ready, sin lowercase), igual que <c>Chair.Name</c>: es como el alumno
/// la recuerda.
/// </summary>
public sealed record ChairRecord(
    ChairId Id,
    SubjectId SubjectId,
    string Name,
    IReadOnlyList<ChairMemberRecord> Members);

/// <summary>Miembro del equipo de una cátedra del seed: docente, rol y desde qué período lectivo.</summary>
public sealed record ChairMemberRecord(TeacherId TeacherId, ChairMemberRole Role, AcademicTermId SinceTermId);
