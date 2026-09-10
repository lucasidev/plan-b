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
/// fuentes</see>: nada inventado, nada redondeado. Cuatro decisiones de carga que no son un dato
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
/// <b>El checklist de transparencia institucional (SC-005, R6 tarea 6, issue #486), con sus cinco
/// campos.</b> Las constancias de "no publicado" del relevamiento para UNSTA y San Pablo-T (ninguna
/// de las dos publica actas, presupuesto ni nómina, O06) se cargan tal cual. <c>interim_share</c> se
/// carga <see cref="OfficialFactStatus.NotPublished"/> en las cinco instituciones aunque el
/// relevamiento no abrió esa cuenta para todas: ninguna nómina releva la condición del cargo (O04),
/// y para UNSE (sin nómina propia relevada) la afirmación cita esa misma razón estructural en vez de
/// saltear el campo. <c>institutional_evaluation</c> solo se carga para UNT, la única con una
/// evaluación institucional de CONEAU en el relevamiento (2021); UNSTA, UTN-FRT y San Pablo-T no
/// tienen ese dato relevado y quedan sin afirmación. El campo <c>agn_audit</c> no se carga acá: lo
/// escribe la importación automática de la tarea 18 (issue #506,
/// <see cref="Planb.Academic.Infrastructure.AgnAudits.AgnAuditImporter"/>), que no corre en este
/// seed.
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
    // Academic lo usa). NNN 001-045 es la carga; 000 queda reservado para RelievedBy, fuera de la
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
    private const string GuiaSiuName = "Guía de carreras universitarias (SIU)";
    private const string GuiaSiuDocument =
        "Filtro Tucumán, pregrado y grado (consultada 2026-09-08)";
    private const string Anuario =
        "https://www.argentina.gob.ar/educacion/universidades/informacion/publicaciones/anuarios";
    private const string Coneau =
        "https://global.coneau.gob.ar/coneauglobal/publico/buscadores/acreditacion/";
    private const string Diu = "http://pedidosciie.siu.edu.ar";

    // Fuentes del checklist de transparencia institucional (SC-005, R6 tarea 6): los dos portales
    // de Ley 27.275 y la raíz de los dos sitios institucionales privados, que el relevamiento cita
    // como "sitio institucional" sin una URL de transparencia propia (O06: no publican).
    private const string PortalTransparenciaUnt = "https://www.unt.edu.ar/portal-de-transparencia/activa/";
    private const string PortalTransparenciaUtn =
        "https://www.utn.edu.ar/es/la-universidad/unidad-de-visibilidad-y-transparencia";
    private const string SitioUnstaRaiz = "https://www.unsta.edu.ar/";
    private const string SitioUsptRaiz = "https://www.uspt.edu.ar/";

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

        // ================================================================
        // Instituciones: el checklist de transparencia (SC-005, R6 tarea 6, #486)
        // ================================================================

        // ---------- UNSTA: privada, sin transparencia publicada (O06) ----------

        new OfficialFactSeed(
            Fid("028"), OfficialFactSubjectType.Institution, AcademicSeedData.Unsta.Id.Value,
            OfficialFactField.MinutesPublished, OfficialFactStatus.NotPublished,
            Value: null, Unit: null, Period: null,
            SourceName: "Sitio UNSTA", SourceUrl: SitioUnstaRaiz,
            SourceDocument: null, SourceRetrievedAt: Sep7,
            DerivationRuleId: null,
            Note: "UNSTA no publica actas de su órgano de gobierno: privada, alcanzada por la Ley " +
                "27.275 solo por los fondos públicos que recibe (O06).",
            RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("029"), OfficialFactSubjectType.Institution, AcademicSeedData.Unsta.Id.Value,
            OfficialFactField.BudgetPublished, OfficialFactStatus.NotPublished,
            Value: null, Unit: null, Period: null,
            SourceName: "Sitio UNSTA", SourceUrl: SitioUnstaRaiz,
            SourceDocument: null, SourceRetrievedAt: Sep7,
            DerivationRuleId: null,
            Note: "UNSTA no publica presupuesto ejecutado: privada, alcanzada por la Ley 27.275 " +
                "solo por los fondos públicos que recibe (O06).",
            RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("030"), OfficialFactSubjectType.Institution, AcademicSeedData.Unsta.Id.Value,
            OfficialFactField.StaffRosterPublished, OfficialFactStatus.NotPublished,
            Value: null, Unit: null, Period: null,
            SourceName: "Sitio UNSTA", SourceUrl: SitioUnstaRaiz,
            SourceDocument: null, SourceRetrievedAt: Sep7,
            DerivationRuleId: null,
            Note: "UNSTA no publica nómina docente: privada, alcanzada por la Ley 27.275 solo por " +
                "los fondos públicos que recibe (O06).",
            RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("031"), OfficialFactSubjectType.Institution, AcademicSeedData.Unsta.Id.Value,
            OfficialFactField.InterimShare, OfficialFactStatus.NotPublished,
            Value: null, Unit: null, Period: null,
            SourceName: "Sitio UNSTA", SourceUrl: SitioUnstaRaiz,
            SourceDocument: null, SourceRetrievedAt: Sep7,
            DerivationRuleId: null,
            Note: "UNSTA no publica nómina docente, así que no hay de dónde derivar la proporción " +
                "de interinos (O06).",
            RelievedAt: Sep8),

        // ---------- UNT: los tres campos publicados, con lo que cada uno no cubre ----------

        new OfficialFactSeed(
            Fid("032"), OfficialFactSubjectType.Institution, AcademicSeedData.Unt.Id.Value,
            OfficialFactField.MinutesPublished, OfficialFactStatus.Published,
            Value: "Boletín Oficial semanal con las resoluciones",
            Unit: null, Period: "2025 en adelante",
            SourceName: "Boletín Oficial UNT", SourceUrl: "https://boletinoficial.unt.edu.ar/",
            SourceDocument: null, SourceRetrievedAt: Sep7,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("033"), OfficialFactSubjectType.Institution, AcademicSeedData.Unt.Id.Value,
            OfficialFactField.BudgetPublished, OfficialFactStatus.Published,
            Value: "Presupuesto 2023 y 2024 en PDF; ejecución por resoluciones 2024 a 2026",
            Unit: null, Period: "2023 a 2026",
            SourceName: "Portal de transparencia UNT", SourceUrl: PortalTransparenciaUnt,
            SourceDocument: null, SourceRetrievedAt: Sep7,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("034"), OfficialFactSubjectType.Institution, AcademicSeedData.Unt.Id.Value,
            OfficialFactField.StaffRosterPublished, OfficialFactStatus.Published,
            Value: "Publicada (XLSX, marzo 2026) con unidad académica, cargo, dedicación y horas; " +
                "FACET: 821 cargos y 700 personas (345 simples, 266 semiexclusivas, 210 " +
                "exclusivas); sin condición del cargo",
            Unit: null, Period: "marzo 2026",
            SourceName: "Portal de transparencia UNT", SourceUrl: PortalTransparenciaUnt,
            SourceDocument: null, SourceRetrievedAt: Sep7,
            DerivationRuleId: null,
            Note: "Sin condición del cargo (regular o interino): no permite calcular interim_share " +
                "(O04).",
            RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("035"), OfficialFactSubjectType.Institution, AcademicSeedData.Unt.Id.Value,
            OfficialFactField.InterimShare, OfficialFactStatus.NotPublished,
            Value: null, Unit: null, Period: null,
            SourceName: "Portal de transparencia UNT", SourceUrl: PortalTransparenciaUnt,
            SourceDocument: null, SourceRetrievedAt: Sep7,
            DerivationRuleId: null,
            Note: "La nómina docente de UNT trae cargo y dedicación pero no la condición del cargo " +
                "(regular o interina): no permite calcular la proporción de interinos (O04).",
            RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("036"), OfficialFactSubjectType.Institution, AcademicSeedData.Unt.Id.Value,
            OfficialFactField.InstitutionalEvaluation, OfficialFactStatus.Published,
            Value: "Evaluación externa CONEAU 2021",
            Unit: null, Period: "2021",
            SourceName: "Portal de transparencia UNT", SourceUrl: PortalTransparenciaUnt,
            SourceDocument: null, SourceRetrievedAt: Sep7,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        // ---------- UTN, Facultad Regional Tucumán ----------

        new OfficialFactSeed(
            Fid("037"), OfficialFactSubjectType.Institution, AcademicSeedData.UtnFrt.Id.Value,
            OfficialFactField.MinutesPublished, OfficialFactStatus.NotPublished,
            Value: null, Unit: null, Period: null,
            SourceName: "Consejo Superior UTN", SourceUrl: "https://csu.rec.utn.edu.ar",
            SourceDocument: null, SourceRetrievedAt: Sep7,
            DerivationRuleId: null,
            Note: "El sitio del Consejo Superior de UTN (csu.rec.utn.edu.ar) rechazó la conexión " +
                "el 2026-09-07: no se pudo verificar si publica ordenanzas y resoluciones (O10).",
            RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("038"), OfficialFactSubjectType.Institution, AcademicSeedData.UtnFrt.Id.Value,
            OfficialFactField.BudgetPublished, OfficialFactStatus.Published,
            Value: "Resoluciones presupuestarias 2022 a 2026 y créditos recibidos",
            Unit: null, Period: "2022 a 2026",
            SourceName: "Portal UTN", SourceUrl: PortalTransparenciaUtn,
            SourceDocument: null, SourceRetrievedAt: Sep7,
            DerivationRuleId: null,
            Note: "No abre por regional: los números son de toda la UTN, no solo de la Facultad " +
                "Regional Tucumán.",
            RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("039"), OfficialFactSubjectType.Institution, AcademicSeedData.UtnFrt.Id.Value,
            OfficialFactField.StaffRosterPublished, OfficialFactStatus.Published,
            Value: "Publicada (XLSX, julio 2026) con apellido, DNI y designación; sin regional, " +
                "cargo ni dedicación",
            Unit: null, Period: "julio 2026",
            SourceName: "Portal UTN", SourceUrl: PortalTransparenciaUtn,
            SourceDocument: null, SourceRetrievedAt: Sep7,
            DerivationRuleId: null,
            Note: "Sin regional, cargo ni dedicación: no permite calcular interim_share ni abrir " +
                "por Facultad Regional Tucumán (O04).",
            RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("040"), OfficialFactSubjectType.Institution, AcademicSeedData.UtnFrt.Id.Value,
            OfficialFactField.InterimShare, OfficialFactStatus.NotPublished,
            Value: null, Unit: null, Period: null,
            SourceName: "Portal UTN", SourceUrl: PortalTransparenciaUtn,
            SourceDocument: null, SourceRetrievedAt: Sep7,
            DerivationRuleId: null,
            Note: "La nómina docente de UTN no trae cargo, dedicación ni condición del cargo: no " +
                "permite calcular la proporción de interinos (O04).",
            RelievedAt: Sep8),

        // ---------- San Pablo-T: privada, sin transparencia publicada (O06) ----------

        new OfficialFactSeed(
            Fid("041"), OfficialFactSubjectType.Institution, AcademicSeedData.UspT.Id.Value,
            OfficialFactField.MinutesPublished, OfficialFactStatus.NotPublished,
            Value: null, Unit: null, Period: null,
            SourceName: "Sitio San Pablo-T", SourceUrl: SitioUsptRaiz,
            SourceDocument: null, SourceRetrievedAt: Sep7,
            DerivationRuleId: null,
            Note: "San Pablo-T no publica actas de su órgano de gobierno: privada, sin " +
                "transparencia publicada relevada (O06).",
            RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("042"), OfficialFactSubjectType.Institution, AcademicSeedData.UspT.Id.Value,
            OfficialFactField.BudgetPublished, OfficialFactStatus.NotPublished,
            Value: null, Unit: null, Period: null,
            SourceName: "Sitio San Pablo-T", SourceUrl: SitioUsptRaiz,
            SourceDocument: null, SourceRetrievedAt: Sep7,
            DerivationRuleId: null,
            Note: "San Pablo-T no publica presupuesto ejecutado: privada, sin transparencia " +
                "publicada relevada (O06).",
            RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("043"), OfficialFactSubjectType.Institution, AcademicSeedData.UspT.Id.Value,
            OfficialFactField.StaffRosterPublished, OfficialFactStatus.NotPublished,
            Value: null, Unit: null, Period: null,
            SourceName: "Sitio San Pablo-T", SourceUrl: SitioUsptRaiz,
            SourceDocument: null, SourceRetrievedAt: Sep7,
            DerivationRuleId: null,
            Note: "San Pablo-T no publica nómina docente: privada, sin transparencia publicada " +
                "relevada (O06).",
            RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("044"), OfficialFactSubjectType.Institution, AcademicSeedData.UspT.Id.Value,
            OfficialFactField.InterimShare, OfficialFactStatus.NotPublished,
            Value: null, Unit: null, Period: null,
            SourceName: "Sitio San Pablo-T", SourceUrl: SitioUsptRaiz,
            SourceDocument: null, SourceRetrievedAt: Sep7,
            DerivationRuleId: null,
            Note: "San Pablo-T no publica nómina docente, así que no hay de dónde derivar la " +
                "proporción de interinos (O06).",
            RelievedAt: Sep8),

        // ---------- UNSE: solo interim_share, la razón estructural que cubre a las cinco ----------

        new OfficialFactSeed(
            Fid("045"), OfficialFactSubjectType.Institution, AcademicSeedData.Unse.Id.Value,
            OfficialFactField.InterimShare, OfficialFactStatus.NotPublished,
            Value: null, Unit: null, Period: null,
            SourceName: "SPU, Anuario de Estadísticas Universitarias", SourceUrl: Anuario,
            SourceDocument: "Anuario, RHUN 4.4 (cargos docentes por dedicación)",
            SourceRetrievedAt: Sep7,
            DerivationRuleId: null,
            Note: "El anuario RHUN, visto en UNT y en UTN, clasifica los cargos docentes por " +
                "dedicación (exclusiva, semiexclusiva, simple), nunca por condición del cargo; " +
                "UNSE no tuvo su transparencia relevada en este trabajo y no hay nómina propia " +
                "consultada de la que derivar la proporción de interinos.",
            RelievedAt: Sep8),

        // ================================================================
        // El resto de la oferta (222 carreras): duración en el papel y régimen de ingreso,
        // Guía SIU (R6). Mismo criterio que la carga de arriba: solo lo que la Guía da, sin
        // completar nada por afuera de la fila de cada oferta.
        //
        // PaperDuration: cuando la Guía dice "N Años" (entero o con fracción decimal), el valor
        // queda como el numeral solo ("N" o "N.N") con Unit "years": lo formatea el frontend
        // (formatOfficialFactValue), el mismo camino que ya usan los tests de la ficha. Cuando la
        // Guía mide en cuatrimestres o semestres (no hay Unit para esa cadencia en el catálogo de
        // ADR-0090), el valor queda en texto libre ("N cuatrimestres"/"N semestres") con Unit
        // null, igual que Tudcs UNSTA arriba con "2 años y medio".
        //
        // Ocho ofertas usan acá un nombre curado (forma de carrera, no de titular: "Ingeniería en
        // Informática", "Licenciatura en X", "Tecnicatura Universitaria en X") que no matchea
        // texto a texto con el título que lista la Guía ("Ingeniero/a en X", "Licenciado en X",
        // "Técnico/a Universitario/a en X") para el mismo puesto: se resolvieron a mano contra la
        // fila que describe la misma oferta (mismo criterio que ya aplicó la tarea 2 al no forzar
        // esos ocho a una unica DurationYears entera). Las filas "Licenciado en Enfermería" (sin
        // "/a") de la Guía no generan afirmación: no tienen Career propia (ver el comentario de
        // más arriba, "Licenciado/a en Enfermería").

        // ---------------------------------------------------------------
        // UNSTA: duración en el papel y régimen de ingreso, Guía SIU (bulk)
        // ---------------------------------------------------------------

        new OfficialFactSeed(
            Fid("046"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000100"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("047"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000100"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("048"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000012b"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("049"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000012b"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("050"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000124"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("051"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000124"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Asistencia a curso de ingreso o nivelación", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("052"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000101"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "4", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("053"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000101"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("054"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000012c"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "4", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("055"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000012c"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("056"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000001"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("057"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000001"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("058"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000012a"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("059"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000012a"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Consulte con la institución", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("060"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000002"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("061"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000002"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Asistencia a curso de ingreso o nivelación", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("062"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000102"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("063"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000102"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Consulte con la institución", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("064"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000012d"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("065"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000012d"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("066"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000125"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("067"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000125"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Asistencia a curso de ingreso o nivelación", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("068"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000103"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "4", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("069"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000103"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("070"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000012e"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "4", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("071"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000012e"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("072"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000114"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "4", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("073"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000114"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Consulte con la institución", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("074"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000011a"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "4", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("075"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000011a"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("076"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000115"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("077"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000115"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("078"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000010f"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("079"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000010f"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("080"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000127"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "4", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("081"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000127"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("082"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000128"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "4", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("083"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000128"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("084"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000011f"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("085"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000011f"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("086"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000110"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "4", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("087"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000110"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("088"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000104"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "4", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("089"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000104"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Consulte con la institución", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("090"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000012f"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "4", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("091"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000012f"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("092"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000105"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("093"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000105"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("094"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000130"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("095"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000130"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("096"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000106"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "4", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("097"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000106"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Consulte con la institución", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("098"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000131"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "4", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("099"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000131"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("100"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000107"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "4", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("101"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000107"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("102"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000132"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "4", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("103"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000132"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("104"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000108"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("105"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000108"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("106"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000133"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("107"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000133"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("108"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000109"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "4", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("109"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000109"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("110"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000134"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "4", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("111"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000134"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("112"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000116"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "2", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("113"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000116"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("114"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000010a"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "4", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("115"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000010a"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Consulte con la institución", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("116"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000135"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "4", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("117"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000135"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("118"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000111"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "2", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("119"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000111"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Consulte con la institución", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("120"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000010b"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "4", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("121"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000010b"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Consulte con la institución", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("122"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000136"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "4", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("123"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000136"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("124"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000011c"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "4", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("125"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000011c"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("126"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000126"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "4", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("127"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000126"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Asistencia a curso de ingreso o nivelación", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("128"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000011d"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "4", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("129"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000011d"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Asistencia a curso de ingreso o nivelación", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("130"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000119"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "4", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("131"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000119"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("132"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000011e"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "4", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("133"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000011e"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Asistencia a curso de ingreso o nivelación", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("134"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000117"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "3", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("135"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000117"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Examen de ingreso", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("136"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000112"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "6", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("137"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000112"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Examen de ingreso", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("138"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000010c"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "4", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("139"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000010c"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("140"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000137"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "4", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("141"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000137"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("142"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000010d"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "3", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("143"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000010d"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("144"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000138"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "3", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("145"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000138"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("146"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000122"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("147"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000122"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("148"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000120"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "2", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("149"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000120"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("150"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000121"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "2", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("151"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000121"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("152"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000004"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5 semestres", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("153"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000004"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("154"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000129"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "3", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("155"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000129"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("156"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000011b"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "3", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("157"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000011b"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("158"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000010e"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "3", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("159"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000010e"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("160"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000113"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "3", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("161"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000113"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("162"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000118"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "3", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("163"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000118"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Consulte con la institución", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("164"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000123"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "3", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("165"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000123"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Asistencia a curso de ingreso o nivelación", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        // ---------------------------------------------------------------
        // UNT: duración en el papel y régimen de ingreso, Guía SIU (bulk)
        // ---------------------------------------------------------------

        new OfficialFactSeed(
            Fid("166"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000023e"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "6", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("167"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000023e"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("168"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000276"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "6", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("169"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000276"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("170"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000277"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "6", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("171"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000277"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("172"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000278"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "6", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("173"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000278"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("174"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000279"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "6", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("175"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000279"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("176"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000211"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "3", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("177"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000211"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Consulte con la institución", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("178"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000239"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("179"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000239"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Asistencia a curso de ingreso o nivelación", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("180"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000020f"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "6", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("181"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000020f"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Asistencia a curso de ingreso o nivelación", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("182"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000212"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "4", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("183"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000212"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("184"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000021f"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "6", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("185"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000021f"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Asistencia a curso de ingreso o nivelación", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("186"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000224"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("187"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000224"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Asistencia y aprobación a curso de ingreso o nivelación", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("188"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000227"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "4", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("189"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000227"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Asistencia y aprobación a curso de ingreso o nivelación", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("190"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000213"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "4", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("191"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000213"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("192"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000202"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "3", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("193"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000202"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Consulte con la institución", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("194"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000269"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "3", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("195"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000269"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Consulte con la institución", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("196"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000203"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "3", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("197"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000203"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Consulte con la institución", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("198"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000026a"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "3", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("199"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000026a"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Consulte con la institución", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("200"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000026b"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "3", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("201"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000026b"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Consulte con la institución", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("202"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000023f"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("203"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000023f"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("204"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000220"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "6", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("205"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000220"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Consulte con la institución", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("206"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000023a"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("207"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000023a"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Asistencia a curso de ingreso o nivelación", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("208"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000021"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("209"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000021"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Asistencia y aprobación a curso de ingreso o nivelación", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("210"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000020"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("211"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000020"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Asistencia y aprobación a curso de ingreso o nivelación", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("212"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000022a"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("213"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000022a"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Asistencia y aprobación a curso de ingreso o nivelación", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("214"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000022b"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("215"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000022b"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Asistencia y aprobación a curso de ingreso o nivelación", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("216"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000022c"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("217"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000022c"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Asistencia y aprobación a curso de ingreso o nivelación", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("218"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000022d"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5.5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("219"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000022d"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Asistencia y aprobación a curso de ingreso o nivelación", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("220"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000022e"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("221"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000022e"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Asistencia y aprobación a curso de ingreso o nivelación", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("222"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000022f"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("223"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000022f"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Asistencia y aprobación a curso de ingreso o nivelación", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("224"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000230"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("225"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000230"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Asistencia y aprobación a curso de ingreso o nivelación", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("226"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000231"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("227"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000231"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Asistencia y aprobación a curso de ingreso o nivelación", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("228"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000232"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("229"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000232"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Asistencia y aprobación a curso de ingreso o nivelación", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("230"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000020c"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("231"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000020c"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Consulte con la institución", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("232"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000229"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("233"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000229"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Asistencia y aprobación a curso de ingreso o nivelación", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("234"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000020d"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("235"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000020d"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Consulte con la institución", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("236"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000200"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "4", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("237"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000200"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Examen de ingreso", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("238"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000225"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("239"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000225"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Asistencia y aprobación a curso de ingreso o nivelación", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("240"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000263"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("241"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000263"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Consulte con la institución", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("242"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000264"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("243"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000264"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Consulte con la institución", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("244"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000265"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("245"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000265"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Consulte con la institución", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("246"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000266"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("247"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000266"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Consulte con la institución", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("248"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000222"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("249"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000222"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Consulte con la institución", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("250"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000246"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "4", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("251"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000246"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Asistencia a curso de ingreso o nivelación", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("252"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000247"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("253"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000247"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Asistencia a curso de ingreso o nivelación", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("254"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000226"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("255"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000226"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Asistencia y aprobación a curso de ingreso o nivelación", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("256"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000242"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("257"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000242"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("258"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000243"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "2", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("259"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000243"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("260"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000248"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("261"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000248"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Asistencia a curso de ingreso o nivelación", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("262"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000249"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("263"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000249"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Asistencia a curso de ingreso o nivelación", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("264"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000024a"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("265"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000024a"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Asistencia a curso de ingreso o nivelación", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("266"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000267"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("267"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000267"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("268"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000024b"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("269"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000024b"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Asistencia a curso de ingreso o nivelación", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("270"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000201"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("271"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000201"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Asistencia a curso de ingreso o nivelación", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("272"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000024c"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("273"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000024c"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Asistencia a curso de ingreso o nivelación", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("274"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000234"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("275"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000234"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Asistencia y aprobación a curso de ingreso o nivelación", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("276"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000219"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "2", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("277"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000219"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("278"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000024d"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("279"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000024d"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Asistencia a curso de ingreso o nivelación", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("280"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000214"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("281"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000214"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("282"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000275"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("283"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000275"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("284"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000023b"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("285"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000023b"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Asistencia a curso de ingreso o nivelación", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("286"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000209"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("287"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000209"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Consulte con la institución", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("288"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000215"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("289"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000215"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Consulte con la institución", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("290"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000216"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "4", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("291"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000216"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("292"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000204"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("293"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000204"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Consulte con la institución", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("294"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000026c"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("295"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000026c"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Consulte con la institución", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("296"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000026d"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("297"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000026d"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Consulte con la institución", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("298"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000026e"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("299"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000026e"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Consulte con la institución", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("300"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000026f"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("301"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000026f"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Consulte con la institución", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("302"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000233"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("303"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000233"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Asistencia y aprobación a curso de ingreso o nivelación", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("304"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000025a"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "2", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("305"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000025a"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Consulte con la institución", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("306"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000245"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("307"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000245"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Asistencia a curso de ingreso o nivelación", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("308"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000025b"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("309"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000025b"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Asistencia a curso de ingreso o nivelación", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("310"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000217"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("311"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000217"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("312"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000205"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "4", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("313"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000205"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Consulte con la institución", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("314"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000221"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("315"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000221"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Consulte con la institución", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("316"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000240"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "2.5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("317"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000240"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Consulte con la institución", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("318"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000218"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("319"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000218"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("320"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000022"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("321"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000022"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Asistencia y aprobación a curso de ingreso o nivelación", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("322"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000025c"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "6.5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("323"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000025c"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Consulte con la institución", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("324"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000020e"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5.5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("325"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000020e"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Consulte con la institución", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("326"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000025d"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("327"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000025d"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Asistencia a curso de ingreso o nivelación", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("328"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000241"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "4", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("329"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000241"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("330"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000021b"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("331"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000021b"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("332"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000244"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "4", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("333"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000244"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("334"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000024f"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "2", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("335"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000024f"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Asistencia a curso de ingreso o nivelación", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("336"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000023c"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "4", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("337"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000023c"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Asistencia a curso de ingreso o nivelación", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("338"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000250"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("339"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000250"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Asistencia a curso de ingreso o nivelación", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("340"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000251"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "2", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("341"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000251"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Asistencia a curso de ingreso o nivelación", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("342"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000252"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("343"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000252"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Asistencia a curso de ingreso o nivelación", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("344"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000253"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("345"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000253"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Asistencia a curso de ingreso o nivelación", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("346"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000254"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("347"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000254"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Asistencia a curso de ingreso o nivelación", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("348"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000255"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("349"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000255"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Asistencia a curso de ingreso o nivelación", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("350"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000256"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("351"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000256"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Asistencia a curso de ingreso o nivelación", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("352"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000257"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("353"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000257"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Asistencia a curso de ingreso o nivelación", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("354"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000258"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("355"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000258"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Asistencia a curso de ingreso o nivelación", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("356"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000024e"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("357"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000024e"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Asistencia a curso de ingreso o nivelación", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("358"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000260"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "2", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("359"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000260"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("360"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000021a"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "4", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("361"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000021a"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("362"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000261"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("363"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000261"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("364"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000210"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "3", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("365"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000210"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Examen de ingreso", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("366"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000207"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "3", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("367"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000207"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Consulte con la institución", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("368"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000273"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "3", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("369"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000273"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Consulte con la institución", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("370"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000236"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "3", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("371"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000236"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Asistencia y aprobación a curso de ingreso o nivelación", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("372"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000208"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "2", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("373"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000208"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Consulte con la institución", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("374"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000274"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "2", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("375"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000274"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Consulte con la institución", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("376"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000223"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "3", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("377"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000223"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Consulte con la institución", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("378"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000268"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "3", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("379"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000268"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Consulte con la institución", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("380"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000020b"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "3", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("381"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000020b"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Consulte con la institución", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("382"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000262"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "3", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("383"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000262"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("384"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000259"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "3", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("385"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000259"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Asistencia a curso de ingreso o nivelación", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("386"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000023d"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "3", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("387"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000023d"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Asistencia a curso de ingreso o nivelación", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("388"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000237"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "3", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("389"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000237"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Asistencia y aprobación a curso de ingreso o nivelación", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("390"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000021e"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "3", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("391"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000021e"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("392"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000238"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "3", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("393"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000238"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Asistencia y aprobación a curso de ingreso o nivelación", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("394"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000021d"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "3", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("395"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000021d"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("396"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000025e"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "3", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("397"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000025e"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Consulte con la institución", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("398"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000021c"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "2", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("399"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000021c"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("400"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000235"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "2.5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("401"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000235"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Asistencia y aprobación a curso de ingreso o nivelación", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("402"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000020a"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "3", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("403"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000020a"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Consulte con la institución", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("404"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000025f"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "3", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("405"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000025f"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Consulte con la institución", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        // ---------------------------------------------------------------
        // UTN, Facultad Regional Tucumán: duración en el papel y régimen de ingreso, Guía SIU (bulk)
        // ---------------------------------------------------------------

        new OfficialFactSeed(
            Fid("406"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000500"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "3", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("407"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000500"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Asistencia y aprobación a curso de ingreso o nivelación", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("408"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000030"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("409"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000030"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Asistencia y aprobación a curso de ingreso o nivelación", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("410"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000502"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5.5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("411"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000502"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Asistencia y aprobación a curso de ingreso o nivelación", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("412"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000503"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5.5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("413"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000503"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Asistencia y aprobación a curso de ingreso o nivelación", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("414"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000504"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("415"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000504"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Asistencia y aprobación a curso de ingreso o nivelación", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("416"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000501"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("417"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000501"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Asistencia y aprobación a curso de ingreso o nivelación", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("418"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000505"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "2", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("419"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000505"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Consulte con la institución", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("420"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000506"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "2", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("421"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000506"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Consulte con la institución", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("422"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000507"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "3 cuatrimestres", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("423"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000507"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Consulte con la institución", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("424"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000508"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "4", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("425"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000508"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Asistencia a curso de ingreso o nivelación", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("426"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000509"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "2.5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("427"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000509"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Consulte con la institución", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("428"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000050a"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "3", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("429"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000050a"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Consulte con la institución", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("430"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000050b"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "2.5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("431"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000050b"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Consulte con la institución", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("432"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000050c"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "2", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("433"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000050c"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Consulte con la institución", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("434"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000050d"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "2", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("435"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000050d"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Consulte con la institución", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        // ---------------------------------------------------------------
        // San Pablo-T: duración en el papel y régimen de ingreso, Guía SIU (bulk)
        // ---------------------------------------------------------------

        new OfficialFactSeed(
            Fid("436"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000307"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("437"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000307"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("438"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000308"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "4", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("439"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000308"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("440"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000309"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "3", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("441"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000309"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("442"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000030a"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "4", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("443"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000030a"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("444"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000300"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "4", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("445"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000300"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("446"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000301"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "4", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("447"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000301"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("448"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000302"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("449"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000302"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("450"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000303"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "4", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("451"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000303"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("452"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000304"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "4", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("453"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000304"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("454"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000305"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "4", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("455"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000305"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("456"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000030b"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "4", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("457"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000030b"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Consulte con la institución", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("458"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000030c"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "4", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("459"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000030c"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("460"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000030d"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "4", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("461"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000030d"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Consulte con la institución", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("462"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000313"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "6", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("463"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000313"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Examen de ingreso", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("464"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000030e"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "4", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("465"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000030e"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("466"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000030f"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "3", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("467"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-00000000030f"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("468"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000306"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "3", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("469"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000306"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("470"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000310"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "3", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("471"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000310"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("472"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000311"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "2", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("473"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000311"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Ingreso directo", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("474"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000312"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "2", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("475"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000312"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Consulte con la institución", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        // ---------------------------------------------------------------
        // UNSE: duración en el papel y régimen de ingreso, Guía SIU (bulk)
        // ---------------------------------------------------------------

        new OfficialFactSeed(
            Fid("476"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000401"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "2", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("477"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000401"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Asistencia a curso de ingreso o nivelación", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("478"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000403"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "2", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("479"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000403"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Consulte con la institución", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("480"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000404"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "2", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("481"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000404"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Consulte con la institución", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("482"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000400"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "4 cuatrimestres", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("483"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000400"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Consulte con la institución", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("484"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000402"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "2", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("485"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000402"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Asistencia a curso de ingreso o nivelación", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("486"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000405"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "2.5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("487"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000405"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Asistencia a curso de ingreso o nivelación", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("488"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000406"),
            OfficialFactField.PaperDuration, OfficialFactStatus.Published,
            Value: "2.5", Unit: "years", Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),

        new OfficialFactSeed(
            Fid("489"), OfficialFactSubjectType.Offering, Guid.Parse("00000002-0000-4000-a000-000000000406"),
            OfficialFactField.AdmissionRegime, OfficialFactStatus.Published,
            Value: "Asistencia a curso de ingreso o nivelación", Unit: null, Period: "oferta vigente",
            SourceName: GuiaSiuName, SourceUrl: GuiaSiu,
            SourceDocument: GuiaSiuDocument, SourceRetrievedAt: Sep8,
            DerivationRuleId: null, Note: null, RelievedAt: Sep8),
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
