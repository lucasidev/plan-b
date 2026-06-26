namespace Planb.Api.Infrastructure.DemoCorpus;

/// <summary>
/// Manifiesto del corpus demo de reseñas (devex, sin US). Datos curados a mano: autores fantasma
/// + reseñas anónimas variadas por materia (ratings, tags, recomendaciones y fechas escalonadas
/// para que cada página de materia y el feed Explorar se sientan poblados) + votos generados de
/// forma determinista entre autores.
///
/// Vive en el host porque cruza módulos (identity, enrollments, reviews): el host es el único que
/// referencia los tres. Cada seeder de módulo recibe datos planos; acá está el "qué", no el "cómo".
/// Los IDs de catálogo (materias, terms, plan, carrera) son los deterministas de
/// <c>AcademicSeedData</c>; las cross-references son Guids sueltos (ADR-0017, sin FK cross-schema).
/// </summary>
public static class DemoCorpusData
{
    // Catálogo TUDCS (UNSTA): IDs espejados de AcademicSeedData.
    public static readonly Guid TudcsPlanId = Guid.Parse("00000003-0000-4000-a000-000000000003");
    public static readonly Guid TudcsCareerId = Guid.Parse("00000002-0000-4000-a000-000000000003");

    // Comisión demo: hoy commission_id es un Guid libre. Repuntar las cursadas demo a las comisiones
    // reales de US-065 + validar docente-en-comisión es la slice de "docente real por reseña".
    public static readonly Guid DemoCommissionId = Guid.Parse("0000000c-0000-4000-a000-000000000001");

    private static readonly Guid Mat102 = Guid.Parse("00000004-0000-4000-a000-000000000001"); // Análisis Matemático I
    private static readonly Guid Alg101 = Guid.Parse("00000004-0000-4000-a000-000000000002"); // Álgebra
    private static readonly Guid Int101 = Guid.Parse("00000004-0000-4000-a000-000000000003"); // Introducción a Sistemas
    private static readonly Guid Prg101 = Guid.Parse("00000004-0000-4000-a000-000000000004"); // Programación I
    private static readonly Guid Prg201 = Guid.Parse("00000004-0000-4000-a000-000000000010"); // Programación II
    private static readonly Guid Bd201 = Guid.Parse("00000004-0000-4000-a000-000000000013"); // Bases de Datos I
    private static readonly Guid So201 = Guid.Parse("00000004-0000-4000-a000-000000000014"); // Sistemas Operativos

    // Docente reseñado por materia: ids reales del catálogo docente (US-063). El titular de la
    // comisión sembrada (US-065) cuando la materia tiene una; un docente coherente de UNSTA para las
    // que no. Reemplaza el placeholder anterior: cada reseña demo apunta a un docente real, así la
    // página de docente (US-003) muestra contenido. El write-flow de producción sigue usando el
    // placeholder hasta la slice de "docente real por reseña".
    private static readonly IReadOnlyDictionary<Guid, Guid> SubjectTeacher = new Dictionary<Guid, Guid>
    {
        [Mat102] = Teacher("02"), // iturralde (titular comisión Mañana)
        [Prg101] = Teacher("01"), // brandt (titular comisión A)
        [Prg201] = Teacher("06"), // castro (titular comisión Noche)
        [Bd201] = Teacher("07"),  // méndez (titular comisión U1)
        [Alg101] = Teacher("03"), // reynoso
        [Int101] = Teacher("09"), // ledesma
        [So201] = Teacher("08"),  // páez
    };

    private static Guid Teacher(string nn) => Guid.Parse($"00000006-0000-4000-a000-0000000000{nn}");

    /// <summary>Docente reseñado real para una materia demo (id del catálogo, US-063).</summary>
    public static Guid TeacherForSubject(Guid subjectId) => SubjectTeacher[subjectId];

    // ── Cursada reseñable interactiva (Lucía) ──────────────────────────────────────────────────
    // Lucía (persona logueable del DevSeed) recibe UNA cursada Aprobada SIN reseña, anclada a una
    // comisión REAL de US-065 (Cid01: PRG101 con brandt titular + sosa jtp). Demuestra el write-flow
    // interactivo end-to-end: Lucía abre "escribir reseña", elige el docente real de la comisión y
    // publica (docente real por reseña). Como no se le crea reseña, queda en su listado de pendientes.
    public const string LuciaEmail = "lucia.mansilla@gmail.com";
    public const string LuciaPendingKey = "lucia-prg101-pending";
    public static readonly Guid LuciaPendingSubjectId = Prg101;
    public static readonly Guid LuciaPendingCommissionId =
        Guid.Parse("00000007-0000-4000-a000-000000000001"); // Cid01, PRG101 comisión "A"
    public static readonly Guid LuciaPendingTermId =
        Guid.Parse("00000005-0000-4000-a000-000000000005"); // 2026·1c

    private static readonly Guid[] Terms =
    [
        Guid.Parse("00000005-0000-4000-a000-000000000001"), // 2024 1c
        Guid.Parse("00000005-0000-4000-a000-000000000002"), // 2024 2c
        Guid.Parse("00000005-0000-4000-a000-000000000003"), // 2025 1c
        Guid.Parse("00000005-0000-4000-a000-000000000004"), // 2025 2c
    ];

    /// <summary>Diez autores fantasma TUDCS. Verificados con profile, anónimos en la UI.</summary>
    public static IReadOnlyList<AuthorDef> Authors { get; } =
    [
        new("a01", "demo.a01@planb.local", 2021),
        new("a02", "demo.a02@planb.local", 2021),
        new("a03", "demo.a03@planb.local", 2020),
        new("a04", "demo.a04@planb.local", 2022),
        new("a05", "demo.a05@planb.local", 2022),
        new("a06", "demo.a06@planb.local", 2020),
        new("a07", "demo.a07@planb.local", 2023),
        new("a08", "demo.a08@planb.local", 2021),
        new("a09", "demo.a09@planb.local", 2022),
        new("a10", "demo.a10@planb.local", 2023),
    ];

    /// <summary>
    /// Autores fantasma que solo reprobaron/abandonaron (sin reseña). Existen para alimentar el
    /// denominador del pass-rate (ADR-0047) y que la aprobación histórica no de 100% en todo.
    /// Perfiles distintos de los autores de reseñas, así no hay colisión en el UNIQUE
    /// (profile, subject, term).
    /// </summary>
    public static IReadOnlyList<AuthorDef> FailureAuthors { get; } =
    [
        new("b01", "demo.b01@planb.local", 2020),
        new("b02", "demo.b02@planb.local", 2021),
        new("b03", "demo.b03@planb.local", 2021),
        new("b04", "demo.b04@planb.local", 2022),
        new("b05", "demo.b05@planb.local", 2020),
        new("b06", "demo.b06@planb.local", 2022),
        new("b07", "demo.b07@planb.local", 2023),
        new("b08", "demo.b08@planb.local", 2021),
    ];

    /// <summary>
    /// Reseñas curadas. El <c>TermId</c> se asigna por índice más abajo (no afecta la UI, solo el
    /// UNIQUE (profile, subject, term), que se respeta porque cada autor reseña cada materia una vez).
    /// </summary>
    public static IReadOnlyList<ReviewDef> Reviews { get; } = BuildReviews();

    private static IReadOnlyList<ReviewDef> BuildReviews()
    {
        var raw = new List<ReviewDef>();
        raw.AddRange(Mat102Reviews());
        raw.AddRange(Prg101Reviews());
        raw.AddRange(Bd201Reviews());
        raw.AddRange(Int101Reviews());
        raw.AddRange(Prg201Reviews());
        raw.AddRange(So201Reviews());
        raw.AddRange(Alg101Reviews());

        // Term ciclado por índice: variedad sin tocar el UNIQUE (cada fila tiene profile distinto
        // dentro de una misma materia, así que el term puede repetirse sin colisión).
        return raw.Select((r, i) => r with { TermId = Terms[i % Terms.Length] }).ToList();
    }

    private static IEnumerable<ReviewDef> Mat102Reviews()
    {
        var s = Mat102;
        yield return R("mat102-a01", "a01", s, 5, 3, 10, true, true, 6m, 420,
            "Análisis I es el filtro del primer año. Si no venís con base fuerte del secundario, prepará muchas horas de práctica.",
            "pide mucho", "exige pero acompaña");
        yield return R("mat102-a02", "a02", s, 4, 4, 8, true, true, 7m, 380,
            "Los teóricos son densos pero los prácticos te salvan. Iba a abandonar y terminé enganchándome con límites y derivadas.",
            "exige pero acompaña", "TPs bien armados");
        yield return R("mat102-a03", "a03", s, 5, 2, 12, false, false, 4m, 300,
            "Parciales durísimos, te toman cosas que no llegaste a ver en clase. Aprobé de milagro recién en el segundo recuperatorio.",
            "parciales difíciles");
        yield return R("mat102-a04", "a04", s, 4, 5, 9, true, true, 8m, 250,
            "Buena materia para entender de qué se trata la carrera. Exige, pero el equipo docente está siempre para las consultas.",
            "cercano con alumnos", "claro explicando");
        yield return R("mat102-a05", "a05", s, 4, 3, 11, true, false, 6m, 210,
            "Mucho volumen de ejercicios, no te alcanza solo con ir a clase. Armate un grupo de estudio sí o sí desde el arranque.",
            "pide mucho");
        yield return R("mat102-a06", "a06", s, 3, 4, 7, true, true, 8m, 170,
            "Le tenía pánico y resultó más llevadera de lo que pensaba. Los videos de repaso del aula virtual ayudan un montón.",
            "claro explicando", "estructura ordenada");
        yield return R("mat102-a07", "a07", s, 4, 3, 8, true, false, 7m, 120,
            "Contenido importante pero la cursada se hace larga. Algunos temas quedan medio colgados por falta de tiempo al final.",
            "material desactualizado");
        yield return R("mat102-a08", "a08", s, 4, 4, 9, true, true, 7m, 90,
            "Si la encarás desde el principio no es imposible. El problema es dejar todo para la semana del parcial y ahí explota.",
            "exige pero acompaña");
        yield return R("mat102-a09", "a09", s, 5, 4, 10, true, true, 8m, 45,
            "Profesores muy capos pero el ritmo es exigente de verdad. Vas a sufrir un poco, pero salís sabiendo la materia.",
            "exige pero acompaña", "cercano con alumnos");
    }

    private static IEnumerable<ReviewDef> Prg101Reviews()
    {
        var s = Prg101;
        yield return R("prg101-a01", "a01", s, 2, 5, 6, true, true, 9m, 400,
            "La mejor materia del primer año si te gusta programar. Arrancás de cero y terminás haciendo proyectitos que funcionan.",
            "claro explicando", "TPs bien armados");
        yield return R("prg101-a02", "a02", s, 3, 4, 7, true, false, 8m, 350,
            "Muy práctica, mucho laboratorio. Si no practicás en casa te quedás atrás, pero los TPs están realmente bien pensados.",
            "TPs bien armados", "pide mucho");
        yield return R("prg101-a04", "a04", s, 2, 5, 5, true, true, 9m, 290,
            "Ideal para el que nunca tocó una línea de código. Los ayudantes te bancan en cada entrega y eso hace la diferencia.",
            "cercano con alumnos", "flexible con entregas");
        yield return R("prg101-a05", "a05", s, 3, 3, 6, true, false, 7m, 230,
            "Entretenida pero las consignas a veces son ambiguas. Preguntá todo antes de entregar para no perder puntos al pedo.",
            "TPs bien armados");
        yield return R("prg101-a06", "a06", s, 2, 5, 6, true, true, 9m, 180,
            "Aprendí muchísimo. El docente explica con ejemplos reales del laburo y eso te ayuda a entender para qué sirve cada cosa.",
            "claro explicando", "estructura ordenada");
        yield return R("prg101-a07", "a07", s, 3, 3, 7, true, false, 7m, 140,
            "Buena introducción pero se queda corta en algunos temas. Después en Programación II terminás sufriendo lo que faltó.",
            "material desactualizado");
        yield return R("prg101-a08", "a08", s, 3, 4, 8, true, true, 8m, 100,
            "Cargada de entregas semanales, no te podés dormir ni una. Pero salís con lo básico de programación bien firme.",
            "pide mucho", "TPs bien armados");
        yield return R("prg101-a09", "a09", s, 2, 5, 6, true, true, 10m, 60,
            "Me encantó. Pasé de no entender absolutamente nada a tener mi primer programa andando en cuestión de un mes.",
            "claro explicando");
        yield return R("prg101-a10", "a10", s, 2, 4, 5, true, true, 8m, 30,
            "Práctica y bien organizada. La recomiendo para sacarte el miedo a programar de entrada y arrancar con buen pie.",
            "estructura ordenada", "cercano con alumnos");
    }

    private static IEnumerable<ReviewDef> Bd201Reviews()
    {
        var s = Bd201;
        yield return R("bd201-a02", "a02", s, 3, 5, 7, true, true, 8m, 360,
            "Bases de Datos te cambia la cabeza para diseñar sistemas. Vas de SQL desde cero hasta normalización sin que se note el salto.",
            "claro explicando", "TPs bien armados");
        yield return R("bd201-a03", "a03", s, 4, 4, 8, true, false, 7m, 300,
            "Materia clave de la tecnicatura. El TP integrador es exigente pero terminás aprendiendo un montón de modelado real.",
            "pide mucho", "TPs bien armados");
        yield return R("bd201-a04", "a04", s, 3, 4, 7, true, true, 8m, 240,
            "Muy buena, aunque el teórico es pesado. Tomate el tiempo de entender normalización bien porque lo arrastrás toda la carrera.",
            "exige pero acompaña");
        yield return R("bd201-a05", "a05", s, 3, 5, 6, true, true, 9m, 190,
            "Re útil para lo laboral. Lo que ves acá lo aplicás tal cual en cualquier trabajo de sistemas, sin vueltas.",
            "estructura ordenada", "claro explicando");
        yield return R("bd201-a06", "a06", s, 4, 3, 8, true, false, 6m, 130,
            "El docente sabe muchísimo pero va rápido. Si te colgás un día con las consultas te cuesta bastante retomar el hilo.",
            "pide mucho");
        yield return R("bd201-a07", "a07", s, 3, 4, 6, true, true, 8m, 80,
            "Buena materia, los prácticos en laboratorio se disfrutan. El parcial de SQL es justo si hiciste la guía completa.",
            "parciales justos", "TPs bien armados");
        yield return R("bd201-a08", "a08", s, 3, 4, 7, true, false, 7m, 40,
            "Contenido sólido y aplicable de una. Me hubiera gustado tener más tiempo para pulir el proyecto final, nada más.",
            "TPs bien armados");
    }

    private static IEnumerable<ReviewDef> Int101Reviews()
    {
        var s = Int101;
        yield return R("int101-a01", "a01", s, 2, 4, 4, true, false, 8m, 410,
            "Materia introductoria tranquila, ideal para arrancar la carrera sin estrés. Te da los conceptos generales de qué es un sistema.",
            "estructura ordenada");
        yield return R("int101-a03", "a03", s, 2, 3, 4, true, false, 7m, 280,
            "Un poco teórica de más para mi gusto, pero te deja el panorama general de cómo se piensa un sistema de información.",
            "material desactualizado");
        yield return R("int101-a06", "a06", s, 2, 4, 3, true, true, 8m, 160,
            "Buena para ubicarte al principio de todo. Nada complicado, pero no la subestimes porque el parcial igual te puede sorprender.",
            "parciales justos");
        yield return R("int101-a09", "a09", s, 2, 4, 4, true, false, 9m, 70,
            "Liviana pero útil. Sienta las bases conceptuales que después vas a usar en casi todas las materias que siguen.",
            "claro explicando");
    }

    private static IEnumerable<ReviewDef> Prg201Reviews()
    {
        var s = Prg201;
        yield return R("prg201-a02", "a02", s, 4, 4, 9, true, true, 7m, 330,
            "El salto desde Programación I es grande. Programación orientada a objetos, estructuras, todo se pone bastante más serio acá.",
            "pide mucho", "exige pero acompaña");
        yield return R("prg201-a04", "a04", s, 4, 5, 10, true, true, 8m, 220,
            "Materia exigente pero la que más me sirvió de toda la carrera. Los TPs son como mini proyectos reales de software.",
            "TPs bien armados", "claro explicando");
        yield return R("prg201-a07", "a07", s, 5, 3, 11, true, false, 6m, 150,
            "Difícil si venís flojo de Programación I. Reforzá lo básico antes de arrancar porque acá no hay tiempo de ponerse al día.",
            "pide mucho");
        yield return R("prg201-a10", "a10", s, 4, 4, 9, true, true, 8m, 55,
            "Mucho trabajo pero salís programando en serio. El docente acompaña bien en las entregas y devuelve correcciones útiles.",
            "exige pero acompaña", "cercano con alumnos");
    }

    private static IEnumerable<ReviewDef> So201Reviews()
    {
        var s = So201;
        yield return R("so201-a01", "a01", s, 4, 4, 8, true, false, 7m, 200,
            "Sistemas Operativos es fascinante pero abstracto. Procesos, memoria, planificación: todo lo que pasa abajo y nunca ves.",
            "claro explicando");
        yield return R("so201-a05", "a05", s, 4, 3, 9, true, false, 6m, 110,
            "Tema denso, requiere leer bastante por fuera de la clase. El parcial teórico es exigente, así que no lo dejes para último momento.",
            "parciales difíciles", "pide mucho");
        yield return R("so201-a08", "a08", s, 3, 4, 7, true, true, 8m, 50,
            "Muy interesante para entender cómo funciona una computadora por dentro de verdad. Recomendable si te copa lo de bajo nivel.",
            "estructura ordenada");
    }

    private static IEnumerable<ReviewDef> Alg101Reviews()
    {
        var s = Alg101;
        yield return R("alg101-a03", "a03", s, 3, 4, 6, true, false, 8m, 340,
            "Álgebra es prolija si te gusta la matemática estructurada. Matrices y vectores, todo bastante mecánico una vez que agarrás la mano.",
            "estructura ordenada", "parciales justos");
        yield return R("alg101-a06", "a06", s, 3, 4, 5, true, true, 8m, 130,
            "Llevadera comparada con Análisis. Los parciales son previsibles si hiciste la práctica, no hay sorpresas raras en la cursada.",
            "parciales justos");
    }

    private static ReviewDef R(
        string key, string author, Guid subject, int diff, int overall, int hours,
        bool recommend, bool retake, decimal grade, int daysAgo, string text, params string[] tags) =>
        new(key, author, subject, Guid.Empty, diff, overall, hours, recommend, retake, grade, daysAgo, text, tags);

    /// <summary>
    /// Genera votos deterministas: para cada reseña, hasta tres autores distintos del autor la
    /// votan (mayormente "útil", con algún "no útil" salpicado). No usa azar, para que el corpus
    /// sea reproducible. Lucía y Mateo no participan: arrancan sin voto y pueden votar en vivo.
    /// </summary>
    public static IReadOnlyList<VoteDef> BuildVotes()
    {
        var votes = new List<VoteDef>();
        var authorKeys = Authors.Select(a => a.Key).ToList();
        var reviews = Reviews;

        for (var i = 0; i < reviews.Count; i++)
        {
            var review = reviews[i];
            var authorIdx = authorKeys.IndexOf(review.AuthorKey);
            if (authorIdx < 0)
            {
                continue;
            }

            var voterCount = i % 4; // 0..3 votos por reseña: variedad, algunas en cero.
            for (var j = 1; j <= voterCount; j++)
            {
                var voterKey = authorKeys[(authorIdx + j) % authorKeys.Count];
                if (string.Equals(voterKey, review.AuthorKey, StringComparison.Ordinal))
                {
                    continue; // nunca auto-voto.
                }

                var isHelpful = (i + j) % 5 != 0; // ~1 de cada 5 es "no útil".
                votes.Add(new VoteDef(voterKey, review.Key, isHelpful));
            }
        }

        return votes;
    }

    /// <summary>
    /// Cursadas sin aprobar (Reprobada/Abandonada), sin reseña, por <see cref="FailureAuthors"/>.
    /// Alimentan el denominador del pass-rate (ADR-0047). Curado para un spread realista: MAT102
    /// (el filtro del primer año) queda bajo, PRG101 alto, y ALG101 queda bajo el gate de muestra
    /// (demuestra el estado "datos insuficientes"). Cada (autor, materia) es único.
    /// </summary>
    public static IReadOnlyList<FailureDef> Failures { get; } = BuildFailures();

    private static IReadOnlyList<FailureDef> BuildFailures()
    {
        var raw = new List<FailureDef>
        {
            // MAT102 (9 aprob): 6 reprobadas + 1 abandonada -> 9/(9+6) = 60%.
            F("fail-mat102-b01", "b01", Mat102, false),
            F("fail-mat102-b02", "b02", Mat102, false),
            F("fail-mat102-b03", "b03", Mat102, false),
            F("fail-mat102-b04", "b04", Mat102, false),
            F("fail-mat102-b05", "b05", Mat102, false),
            F("fail-mat102-b06", "b06", Mat102, false),
            F("fail-mat102-b07", "b07", Mat102, true),
            // PRG101 (9 aprob): 2 reprobadas -> 9/11 = 82%.
            F("fail-prg101-b01", "b01", Prg101, false),
            F("fail-prg101-b02", "b02", Prg101, false),
            // BD201 (7 aprob): 3 reprobadas -> 7/10 = 70%.
            F("fail-bd201-b03", "b03", Bd201, false),
            F("fail-bd201-b04", "b04", Bd201, false),
            F("fail-bd201-b05", "b05", Bd201, false),
            // INT101 (4 aprob): 1 reprobada -> 4/5 = 80% (N=5, justo el gate).
            F("fail-int101-b06", "b06", Int101, false),
            // PRG201 (4 aprob): 2 reprobadas -> 4/6 = 67%.
            F("fail-prg201-b07", "b07", Prg201, false),
            F("fail-prg201-b08", "b08", Prg201, false),
            // SO201 (3 aprob): 2 reprobadas -> 3/5 = 60% (N=5).
            F("fail-so201-b01", "b01", So201, false),
            F("fail-so201-b02", "b02", So201, false),
            // ALG101 (2 aprob): 1 reprobada -> N=3 < 5, GATED ("datos insuficientes").
            F("fail-alg101-b03", "b03", Alg101, false),
        };

        return raw.Select((f, i) => f with { TermId = Terms[i % Terms.Length] }).ToList();
    }

    private static FailureDef F(string key, string author, Guid subject, bool abandoned) =>
        new(key, author, subject, Guid.Empty, abandoned);
}

/// <summary>Autor fantasma del corpus demo.</summary>
public sealed record AuthorDef(string Key, string Email, int EnrollmentYear);

/// <summary>Reseña curada del corpus demo. <c>TermId</c> se asigna por índice en el builder.</summary>
public sealed record ReviewDef(
    string Key,
    string AuthorKey,
    Guid SubjectId,
    Guid TermId,
    int Difficulty,
    int Overall,
    int Hours,
    bool Recommend,
    bool Retake,
    decimal Grade,
    int DaysAgo,
    string Text,
    IReadOnlyList<string> Tags);

/// <summary>Voto demo: un autor vota la reseña de otro.</summary>
public sealed record VoteDef(string VoterKey, string ReviewKey, bool IsHelpful);

/// <summary>Cursada sin aprobar del corpus demo (Reprobada/Abandonada), sin reseña. Para el pass-rate.</summary>
public sealed record FailureDef(string Key, string AuthorKey, Guid SubjectId, Guid TermId, bool IsAbandoned);
