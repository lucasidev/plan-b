using Planb.Academic.Domain.OfficialFacts;

namespace Planb.Academic.Infrastructure.Seeding;

/// <summary>
/// Las afirmaciones oficiales relevadas a mano en R5 (ADR-0090, R6 tarea 3, <see
/// href="https://github.com/lucasidev/plan-b/issues/483">#483</see>), cargadas por seed: los seis
/// campos de la ficha de carrera para las tres ofertas de programación reales del catálogo (UNSTA,
/// UNT, UTN-FRT; Siglo 21 salió de alcance en R6, tarea 2, K03) y la identidad de las cinco
/// instituciones sembradas.
///
/// <para>
/// Cada afirmación cita la misma fuente, el mismo período y el mismo estado que su fila en <see
/// href="../../../../../../docs/history/reviews/2026-09-07-official-data-survey.md">el
/// relevamiento</see> y <see
/// href="../../../../../../docs/history/reviews/2026-09-07-official-data-sources.md">el registro de
/// fuentes</see>: nada inventado, nada redondeado. Tres decisiones de carga que no son un dato
/// literal de una celda y quedan documentadas acá:
/// </para>
///
/// <para>
/// <b>Acreditación de UNT sin fuente propia en su fila.</b> El relevamiento deja en blanco período y
/// fuente en la fila "Acreditación" de UNT (a diferencia de UNSTA y UTN, que sí las completan), y
/// vuelve a decir "no aplica" porque es la misma búsqueda por institución en CONEAU que describe el
/// método del documento. Esta carga reutiliza esa fuente compartida en vez de dejar el campo vacío.
/// </para>
///
/// <para>
/// <b>Dura en el papel de UTN, con la Guía SIU en vez del PDF sin URL.</b> El valor "2 años (más
/// pasantía...)" del relevamiento cita un PDF del Centro Universitario Chivilcoy sin URL registrada.
/// Esta carga usa en su lugar la duración de la Guía de carreras SIU (fuente con URL exacta, la misma
/// que ya usó la tarea 2 para <c>Career.DurationYears</c>) y deja la cita al PDF como nota, no como
/// fuente de la afirmación.
/// </para>
///
/// <para>
/// <b>Plan vigente de UNT, con dos afirmaciones que conviven (K04).</b> SIPES da la RM 2013/2020 y el
/// sitio de la FACET cita las Res. HCS 1926/96 y 307/04, sin que una resolución aparezca en la
/// página de la otra: es el caso que <see cref="OfficialFactCurrency"/> existe para resolver. Las dos
/// se cargan, con la de la FACET relevada más tarde el mismo día (releva materias y Proyecto Final,
/// no solo el número de resolución) para que sea la vigente.
/// </para>
///
/// <para>
/// Egreso por cohorte no aparece como "no publicado" en la ficha de cada oferta: la fila del
/// relevamiento apunta a la regla derivada ("proxy abajo"), así que esta carga guarda directamente
/// el <see cref="OfficialFactStatus.Derived"/> con el proxy institucional (nunca por carrera, como
/// pide la regla) en vez de una afirmación previa "no publicado" que nadie mostraría. Duración real
/// sí queda <see cref="OfficialFactStatus.NotPublished"/> en la oferta (ningún proxy la reemplaza,
/// O01) y además suma una afirmación <see cref="OfficialFactStatus.Requested"/> a nivel institución,
/// registrando el pedido al DIU (y, para las nacionales, por Ley 27.275) con la fecha de hoy.
/// </para>
/// </summary>
public static class OfficialFactSeedData
{
    // ====================================================================
    // Convención de Ids: 00000007-0000-4000-a000-000000000NNN (bloque libre, ningún otro seed de
    // Academic lo usa). NNN 001-027 es la carga; 000 queda reservado para RelievedBy, fuera de la
    // secuencia de afirmaciones.
    // ====================================================================

    private static OfficialFactId Fid(string nnn) =>
        new(Guid.Parse($"00000007-0000-4000-a000-000000000{nnn}"));

    /// <summary>
    /// UserId de quien carga el relevamiento (staff, sin FK cross-módulo a identity: ADR-0090). No
    /// corresponde a ningún User real sembrado en identity; es la autoría del lote de seed.
    /// </summary>
    public static readonly Guid RelievedBy = Guid.Parse("00000007-0000-4000-a000-000000000000");

    // Fechas del relevamiento (R5: consultado el 2026-09-07 y el 2026-09-08) y de esta carga (R6
    // tarea 3, hoy). Horas explícitas solo en el par de UNT que compite por el mismo campo (K04):
    // el resto comparte fecha, sin hora, porque no hace falta desempatar nada.
    private static readonly DateTimeOffset Sep7 = new(2026, 9, 7, 0, 0, 0, TimeSpan.Zero);
    private static readonly DateTimeOffset Sep8 = new(2026, 9, 8, 0, 0, 0, TimeSpan.Zero);
    private static readonly DateTimeOffset Sep8Morning = new(2026, 9, 8, 8, 0, 0, TimeSpan.Zero);
    private static readonly DateTimeOffset Sep8Noon = new(2026, 9, 8, 12, 0, 0, TimeSpan.Zero);
    private static readonly DateTimeOffset Sep9 = new(2026, 9, 9, 0, 0, 0, TimeSpan.Zero);

    // Sujetos: las tres ofertas de programación del catálogo real (AcademicSeedData.Careers) y las
    // cinco instituciones (AcademicSeedData.Universities). Ids repetidos acá, no importados, mismo
    // criterio que CanonicalCareerGroupings.Cid(): son datos planos del seed, no un tipo del dominio.
    private static readonly Guid UnstaTudcsId = Guid.Parse("00000002-0000-4000-a000-000000000003");
    private static readonly Guid UntProgramadorId = Guid.Parse("00000002-0000-4000-a000-000000000023");
    private static readonly Guid UtnFrtProgramacionId = Guid.Parse("00000002-0000-4000-a000-000000000031");

    private const string Sipes = "https://sipes.siu.edu.ar/buscar_titulos_form.php";
    private const string GuiaSiu = "https://guiadecarreras.siu.edu.ar/";
    private const string Anuario =
        "https://www.argentina.gob.ar/educacion/universidades/informacion/publicaciones/anuarios";
    private const string Coneau =
        "https://global.coneau.gob.ar/coneauglobal/publico/buscadores/acreditacion/";
    private const string Diu = "http://pedidosciie.siu.edu.ar";

    public static IReadOnlyList<OfficialFactSeed> Facts { get; } = new[]
    {
        // ================================================================
        // UNSTA, Tecnicatura Universitaria en Desarrollo y Calidad de Software
        // ================================================================

        new OfficialFactSeed(
            Fid("001"), OfficialFactSubjectType.Offering, UnstaTudcsId,
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "2 años y medio", Unit: "years", Period: "plan vigente",
            SourceName: "Sitio UNSTA",
            SourceUrl: "https://www.unsta.edu.ar/ingenieria/desarrollo-y-calidad-de-software/",
            SourceDocument: null, SourceRetrievedAt: Sep7,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("002"), OfficialFactSubjectType.Offering, UnstaTudcsId,
            OfficialFactField.CurrentPlan, OfficialFactStatus.Published,
            Value: "Plan de la RM 2495/2018 (RNº-2018-2495-APN-ME), modificado o ampliado por RM " +
                "1186/2021; 21 materias: 9 en primer año, 8 en segundo, 4 en tercero (Proyecto Final " +
                "incluido)",
            Unit: null, Period: "2018",
            SourceName: "Sitio UNSTA",
            SourceUrl: "https://www.unsta.edu.ar/ingenieria/desarrollo-y-calidad-de-software/",
            SourceDocument: "Coincide con SIPES y con el plan de materias del catálogo",
            SourceRetrievedAt: Sep7,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("003"), OfficialFactSubjectType.Offering, UnstaTudcsId,
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Preinscripción, matrícula de pago único no reintegrable, documentación; sin " +
                "curso ni examen; mayores de 25 sin secundario con evaluación",
            Unit: null, Period: "2° cuatrimestre 2026",
            SourceName: "Ingreso UNSTA", SourceUrl: "https://ingreso.unsta.edu.ar",
            SourceDocument: "Preinscripción (preinscripcion.unsta.edu.ar)", SourceRetrievedAt: Sep7,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("004"), OfficialFactSubjectType.Offering, UnstaTudcsId,
            OfficialFactField.Accreditation, OfficialFactStatus.NotApplicable,
            Value: null, Unit: null, Period: "2013, 2018",
            SourceName: "CONEAU (solo grado), buscada por institución", SourceUrl: Coneau,
            SourceDocument: null, SourceRetrievedAt: Sep8,
            DerivationRuleId: null,
            Note: "Las tecnicaturas no se acreditan: el título tiene validez nacional por RM " +
                "2495/2018. La Ingeniería en Informática de la misma facultad sí está acreditada " +
                "(CONEAU 359/13 y RS-2018-24303544-APN-CONEAU#ME).",
            RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("005"), OfficialFactSubjectType.Offering, UnstaTudcsId,
            OfficialFactField.RealDuration, OfficialFactStatus.NotPublished,
            Value: null, Unit: null, Period: null,
            SourceName: "SPU, Anuario de Estadísticas Universitarias", SourceUrl: Anuario,
            SourceDocument: "Anuario 2023, indicadores", SourceRetrievedAt: Sep7,
            DerivationRuleId: null,
            Note: "Ninguna fuente publica la duración real por carrera: el anuario da, por " +
                "institución, el porcentaje de reinscriptos con dos o más materias aprobadas " +
                "(53,7 % en UNSTA, 2023). Pedido de información a la universidad y al DIU el " +
                "2026-09-09 (ver la afirmación a nivel institución).",
            RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("006"), OfficialFactSubjectType.Offering, UnstaTudcsId,
            OfficialFactField.CohortGraduation, OfficialFactStatus.Derived,
            Value: "21,4 %", Unit: "percent",
            Period: "egresados 2022 sobre nuevos inscriptos 2019 (d = 3 años, institución entera)",
            SourceName: "SPU, Anuario de Estadísticas Universitarias 2022", SourceUrl: Anuario,
            SourceDocument: "Anuario 2022, capítulo 2 (UNSTA)", SourceRetrievedAt: Sep7,
            DerivationRuleId: "graduation-flow-proxy",
            Note: "Proxy de flujo institucional, no una cohorte real de esta carrera: 401 " +
                "egresados 2022 sobre 1877 nuevos inscriptos de 2019. La SPU repite en UNSTA los " +
                "valores de 2019 en 2020 y 2021 (O11); este cálculo usa el dato real de 2019, no " +
                "el repetido. Sirve para orden de magnitud entre instituciones, no para comparar " +
                "carreras (ver Método).",
            RelievedAt: Sep8),

        // ================================================================
        // UNT, Programador Universitario (Facultad de Ciencias Exactas y Tecnología)
        // ================================================================

        new OfficialFactSeed(
            Fid("007"), OfficialFactSubjectType.Offering, UntProgramadorId,
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "3 años: 6 módulos cuatrimestrales, 2112 horas, más certificación de inglés",
            Unit: "years", Period: "plan",
            SourceName: "Sitio FACET (plan de estudios)",
            SourceUrl: "https://www.facet.unt.edu.ar/programadoruniversitario/plan-de-estudios/",
            SourceDocument: null, SourceRetrievedAt: Sep7,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        // K04: SIPES y el sitio de la FACET no cierran. Se cargan las dos; la de la FACET queda
        // vigente (releva materias y Proyecto Final, más tarde el mismo día).
        new OfficialFactSeed(
            Fid("008"), OfficialFactSubjectType.Offering, UntProgramadorId,
            OfficialFactField.CurrentPlan, OfficialFactStatus.Published,
            Value: "RM 2013/2020 (resolución de reconocimiento oficial vigente; la anterior fue RM " +
                "1148/98)",
            Unit: null, Period: "vigente",
            SourceName: "SIPES", SourceUrl: Sipes,
            SourceDocument: null, SourceRetrievedAt: Sep8,
            DerivationRuleId: null,
            Note: "SIPES no publica el detalle del plan de materias; la página del plan de la " +
                "FACET no cita esta resolución (K04): dos fuentes que no cierran, las dos cargadas.",
            RelievedAt: Sep8Morning),

        new OfficialFactSeed(
            Fid("009"), OfficialFactSubjectType.Offering, UntProgramadorId,
            OfficialFactField.CurrentPlan, OfficialFactStatus.Published,
            Value: "Aprobado por Res. HCS 1926/96, modificado por Res. HCS 307/04; 23 materias más " +
                "Proyecto Final en dos módulos",
            Unit: null, Period: "1996 y 2004",
            SourceName: "Sitio FACET",
            SourceUrl: "https://www.facet.unt.edu.ar/programadoruniversitario/plan-de-estudios/",
            SourceDocument: null, SourceRetrievedAt: Sep7,
            DerivationRuleId: null,
            Note: "SIPES cita la RM 2013/2020 para el mismo título y esa resolución no aparece en " +
                "esta página (K04): dos fuentes que no cierran, las dos cargadas.",
            RelievedAt: Sep8Noon),

        new OfficialFactSeed(
            Fid("010"), OfficialFactSubjectType.Offering, UntProgramadorId,
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "No irrestricto: curso de nivelación en matemática (12 semanas, tres clases de " +
                "dos horas, 75 % de asistencia y parciales con nota 6 o más) o prueba de " +
                "suficiencia; inscripción del 10 de agosto al 4 de septiembre de 2026",
            Unit: null, Period: "ciclo 2026-2027",
            SourceName: "FACET, Ingreso", SourceUrl: "https://www.facet.unt.edu.ar/ingreso/",
            SourceDocument: null, SourceRetrievedAt: Sep7,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("011"), OfficialFactSubjectType.Offering, UntProgramadorId,
            OfficialFactField.Accreditation, OfficialFactStatus.NotApplicable,
            Value: null, Unit: null, Period: null,
            SourceName: "CONEAU (solo grado), buscada por institución", SourceUrl: Coneau,
            SourceDocument: null, SourceRetrievedAt: Sep8,
            DerivationRuleId: null,
            Note: "Las tecnicaturas no se acreditan: el título de Programador Universitario tiene " +
                "validez nacional por RM 2013/2020 (SIPES).",
            RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("012"), OfficialFactSubjectType.Offering, UntProgramadorId,
            OfficialFactField.RealDuration, OfficialFactStatus.NotPublished,
            Value: null, Unit: null, Period: null,
            SourceName: "SPU, Anuario de Estadísticas Universitarias", SourceUrl: Anuario,
            SourceDocument: "Anuario 2023, indicadores", SourceRetrievedAt: Sep7,
            DerivationRuleId: null,
            Note: "Ninguna fuente publica la duración real por carrera: el anuario da, por " +
                "institución, el porcentaje de reinscriptos con dos o más materias aprobadas " +
                "(36,2 % en UNT, 2023). Pedido de información a la universidad y al DIU el " +
                "2026-09-09 (ver la afirmación a nivel institución).",
            RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("013"), OfficialFactSubjectType.Offering, UntProgramadorId,
            OfficialFactField.CohortGraduation, OfficialFactStatus.Derived,
            Value: "15,4 %", Unit: "percent",
            Period: "egresados 2022 sobre nuevos inscriptos 2019 (d = 3 años, institución entera)",
            SourceName: "SPU, Anuario de Estadísticas Universitarias 2022", SourceUrl: Anuario,
            SourceDocument: "Anuario 2022, capítulo 2 (UNT)", SourceRetrievedAt: Sep7,
            DerivationRuleId: "graduation-flow-proxy",
            Note: "Proxy de flujo institucional, no una cohorte real de esta carrera: 2370 " +
                "egresados 2022 sobre 15432 nuevos inscriptos de 2019. Sirve para orden de " +
                "magnitud entre instituciones, no para comparar carreras (ver Método).",
            RelievedAt: Sep8),

        // ================================================================
        // UTN, Facultad Regional Tucumán, Tecnicatura Universitaria en Programación
        // ================================================================

        // Dura en el papel: el relevamiento cita un PDF sin URL registrada (Centro Universitario
        // Chivilcoy, Ordenanza 987); se carga con la Guía SIU en su lugar (fuente con URL exacta,
        // la misma que usó la tarea 2 para la duración de esta carrera en el catálogo).
        new OfficialFactSeed(
            Fid("014"), OfficialFactSubjectType.Offering, UtnFrtProgramacionId,
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "2 años", Unit: "years", Period: "oferta vigente, ciclo 2026",
            SourceName: "Guía de carreras universitarias (SIU)", SourceUrl: GuiaSiu,
            SourceDocument: "Filtro Tucumán, pregrado y grado (consultada 2026-09-08)",
            SourceRetrievedAt: Sep8,
            DerivationRuleId: null,
            Note: "El plan 2003 (Ordenanza CS 987) suma una pasantía; el plan 2024 se cita en 1980 " +
                "horas en páginas de otras regionales, sin verificar contra la ordenanza de " +
                "Tucumán (K05).",
            RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("015"), OfficialFactSubjectType.Offering, UtnFrtProgramacionId,
            OfficialFactField.CurrentPlan, OfficialFactStatus.Published,
            Value: "Plan 2024 en transición desde el plan 2003 (Ordenanza CS 987)",
            Unit: null, Period: "2024",
            SourceName: "Ordenanzas CS 2018 y 2019, Consejo Superior UTN",
            SourceUrl: "https://csu.rec.utn.edu.ar",
            SourceDocument: null, SourceRetrievedAt: Sep7,
            DerivationRuleId: null,
            Note: "El sitio del Consejo Superior de UTN rechazó la conexión el 2026-09-07: la " +
                "ordenanza del plan 2024 no se pudo verificar contra la fuente primaria (K05, " +
                "O10). Sin materias cargadas para este plan.",
            RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("016"), OfficialFactSubjectType.Offering, UtnFrtProgramacionId,
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Las tecnicaturas tienen ingreso propio (guía de estudio); las ingenierías, " +
                "Seminario Universitario de tres materias, eliminatorio. El buscador de la " +
                "regional avisaba cupos agotados.",
            Unit: null, Period: "2025-2026",
            SourceName: "Ingreso FRT UTN",
            SourceUrl: "https://ingreso.frt.utn.edu.ar/preguntas-frecuentes/",
            SourceDocument: null, SourceRetrievedAt: Sep8,
            DerivationRuleId: null,
            Note: "El sitio de la Facultad Regional Tucumán (frt.utn.edu.ar) no respondió durante " +
                "todo el relevamiento (O10); esta información viene del subdominio de ingreso, " +
                "que sí respondió.",
            RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("017"), OfficialFactSubjectType.Offering, UtnFrtProgramacionId,
            OfficialFactField.Accreditation, OfficialFactStatus.NotApplicable,
            Value: null, Unit: null, Period: null,
            SourceName: "SACAD, UTN (listado de acreditaciones)",
            SourceUrl:
                "https://utn.edu.ar/images/Secretarias/SACAD/acreditacion/SACAD-Acreditacion-Academica.pdf",
            SourceDocument: null, SourceRetrievedAt: Sep8,
            DerivationRuleId: null,
            Note: "Las tecnicaturas no se acreditan: el título tiene validez nacional (SIPES). La " +
                "Ingeniería en Sistemas de Información de la regional sí está acreditada (CONEAU " +
                "678/11).",
            RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("018"), OfficialFactSubjectType.Offering, UtnFrtProgramacionId,
            OfficialFactField.RealDuration, OfficialFactStatus.NotPublished,
            Value: null, Unit: null, Period: null,
            SourceName: "SPU, Anuario de Estadísticas Universitarias", SourceUrl: Anuario,
            SourceDocument: "Anuario 2023, indicadores", SourceRetrievedAt: Sep7,
            DerivationRuleId: null,
            Note: "Ninguna fuente publica la duración real por carrera: el anuario da, por " +
                "institución y sin abrir por regional, el porcentaje de reinscriptos con dos o " +
                "más materias aprobadas (45,4 % en toda la UTN, 2023). Pedido de información a la " +
                "universidad y al DIU el 2026-09-09 (ver la afirmación a nivel institución).",
            RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("019"), OfficialFactSubjectType.Offering, UtnFrtProgramacionId,
            OfficialFactField.CohortGraduation, OfficialFactStatus.Derived,
            Value: "16,1 %", Unit: "percent",
            Period: "egresados 2022 sobre nuevos inscriptos 2020 (d = 2 años, toda la UTN)",
            SourceName: "SPU, Anuario de Estadísticas Universitarias 2022", SourceUrl: Anuario,
            SourceDocument: "Anuario 2022, capítulo 2 (UTN)", SourceRetrievedAt: Sep7,
            DerivationRuleId: "graduation-flow-proxy",
            Note: "Proxy de flujo institucional, no una cohorte real ni por regional: 3738 " +
                "egresados 2022 sobre 23219 nuevos inscriptos de 2020, de toda la UTN (el anuario " +
                "no abre por Facultad Regional). Sirve para orden de magnitud entre instituciones, " +
                "no para comparar carreras (ver Método).",
            RelievedAt: Sep8),

        // ================================================================
        // Instituciones: identidad (institution_type), las cinco del catálogo (K07)
        // ================================================================

        new OfficialFactSeed(
            Fid("020"), OfficialFactSubjectType.Institution, AcademicSeedData.Unsta.Id.Value,
            OfficialFactField.InstitutionType, OfficialFactStatus.Published,
            Value: "Privada; 7479 estudiantes en 2022 y 7660 en 2023; 2398 nuevos inscriptos y 401 " +
                "egresados en 2022 (488 en 2023); informática 2022: 352 estudiantes, 232 nuevos " +
                "inscriptos, 1 egresado",
            Unit: null, Period: "2022, 2023",
            SourceName: "SPU, Anuario de Estadísticas Universitarias", SourceUrl: Anuario,
            SourceDocument: "Anuario 2022 y 2023, capítulo 2", SourceRetrievedAt: Sep7,
            DerivationRuleId: null,
            Note: "Los anuarios 2020 y 2021 repiten para UNSTA los valores de 2019: la institución " +
                "no informó esos años (O11).",
            RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("021"), OfficialFactSubjectType.Institution, AcademicSeedData.Unt.Id.Value,
            OfficialFactField.InstitutionType, OfficialFactStatus.Published,
            Value: "Pública; 82401 estudiantes, 23035 nuevos inscriptos y 2370 egresados en 2022; " +
                "78964, 17297 y 2072 en 2023; informática 2022: 1543 estudiantes, 664 nuevos " +
                "inscriptos, 19 egresados; 36,2 % de reinscriptos con dos o más materias " +
                "aprobadas en 2023",
            Unit: null, Period: "2022, 2023",
            SourceName: "SPU, Anuario de Estadísticas Universitarias", SourceUrl: Anuario,
            SourceDocument: "Anuario 2022 y 2023, capítulo 2", SourceRetrievedAt: Sep7,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("022"), OfficialFactSubjectType.Institution, AcademicSeedData.UtnFrt.Id.Value,
            OfficialFactField.InstitutionType, OfficialFactStatus.Published,
            Value: "Pública; 98177 estudiantes, 25543 nuevos inscriptos y 3738 egresados en 2022 " +
                "(toda la UTN); 108986, 31463 y 4581 en 2023; informática 2022: 33472 estudiantes, " +
                "11966 nuevos inscriptos, 680 egresados; 45,4 % de reinscriptos con dos o más " +
                "materias en 2023",
            Unit: null, Period: "2022, 2023",
            SourceName: "SPU, Anuario de Estadísticas Universitarias", SourceUrl: Anuario,
            SourceDocument: "Anuario 2022 y 2023, capítulo 2", SourceRetrievedAt: Sep7,
            DerivationRuleId: null,
            Note: "El anuario no abre por Facultad Regional: los números son de toda la UTN, no " +
                "solo de la sede de Tucumán.",
            RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("023"), OfficialFactSubjectType.Institution, AcademicSeedData.UspT.Id.Value,
            OfficialFactField.InstitutionType, OfficialFactStatus.NotPublished,
            Value: null, Unit: null, Period: "2020 a 2022",
            SourceName: "SPU, Anuario de Estadísticas Universitarias", SourceUrl: Anuario,
            SourceDocument: "Anuario 2020 a 2022, capítulo 2", SourceRetrievedAt: Sep7,
            DerivationRuleId: null,
            Note: "Las filas de San Pablo-T en el anuario 2020 a 2022 están en cero (2016 y 2017 " +
                "repiten a 2015): la institución no informó. \"Cantidad de estudiantes\" no es " +
                "cero, es \"no informado\" (K07).",
            RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("024"), OfficialFactSubjectType.Institution, AcademicSeedData.Unse.Id.Value,
            OfficialFactField.InstitutionType, OfficialFactStatus.Published,
            Value: "Pública; 18066 estudiantes, 5544 nuevos inscriptos y 444 egresados en 2022; " +
                "informática: 724 estudiantes y 17 egresados, en su sede de Santiago del Estero",
            Unit: null, Period: "2022",
            SourceName: "SPU, Anuario de Estadísticas Universitarias", SourceUrl: Anuario,
            SourceDocument: "Anuario 2022, capítulo 2", SourceRetrievedAt: Sep7,
            DerivationRuleId: null,
            Note: "No estaba sembrada en el catálogo hasta R6; sus sedes en la provincia de " +
                "Tucumán no dictan informática.",
            RelievedAt: Sep8),

        // ================================================================
        // Instituciones: el pedido de duración real al DIU, con fecha (O01)
        // ================================================================

        new OfficialFactSeed(
            Fid("025"), OfficialFactSubjectType.Institution, AcademicSeedData.Unsta.Id.Value,
            OfficialFactField.RealDuration, OfficialFactStatus.Requested,
            Value: null, Unit: null, Period: null,
            SourceName: "DIU, pedido de información (SIU)", SourceUrl: Diu,
            SourceDocument: null, SourceRetrievedAt: Sep9,
            DerivationRuleId: null,
            Note: "Pedido de información al DIU sobre duración real por carrera, especificando " +
                "variables y período (sin plazo publicado). Sin respuesta al 2026-09-09.",
            RelievedAt: Sep9),

        new OfficialFactSeed(
            Fid("026"), OfficialFactSubjectType.Institution, AcademicSeedData.Unt.Id.Value,
            OfficialFactField.RealDuration, OfficialFactStatus.Requested,
            Value: null, Unit: null, Period: null,
            SourceName: "DIU, pedido de información (SIU)", SourceUrl: Diu,
            SourceDocument: null, SourceRetrievedAt: Sep9,
            DerivationRuleId: null,
            Note: "Pedido de información al DIU y, como universidad nacional, por Ley 27.275, " +
                "sobre duración real por carrera. Sin respuesta al 2026-09-09.",
            RelievedAt: Sep9),

        new OfficialFactSeed(
            Fid("027"), OfficialFactSubjectType.Institution, AcademicSeedData.UtnFrt.Id.Value,
            OfficialFactField.RealDuration, OfficialFactStatus.Requested,
            Value: null, Unit: null, Period: null,
            SourceName: "DIU, pedido de información (SIU)", SourceUrl: Diu,
            SourceDocument: null, SourceRetrievedAt: Sep9,
            DerivationRuleId: null,
            Note: "Pedido de información al DIU y, como universidad nacional, por Ley 27.275, " +
                "sobre duración real por carrera. Sin respuesta al 2026-09-09.",
            RelievedAt: Sep9),
    };
}

/// <summary>
/// Datos planos de un <see cref="OfficialFact"/> del seed. RelievedBy y CreatedAt quedan afuera: el
/// seeder los aplica uniformes a todo el lote (mismo criterio que el resto de <c>AcademicSeedData</c>
/// con su <c>now</c> compartido).
/// </summary>
public sealed record OfficialFactSeed(
    OfficialFactId Id,
    OfficialFactSubjectType SubjectType,
    Guid SubjectId,
    string Field,
    OfficialFactStatus Status,
    string? Value,
    string? Unit,
    string? Period,
    string SourceName,
    string SourceUrl,
    string? SourceDocument,
    DateTimeOffset SourceRetrievedAt,
    string? DerivationRuleId,
    string? Note,
    DateTimeOffset RelievedAt);
