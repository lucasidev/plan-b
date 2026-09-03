using Planb.Reviews.Domain.Catalog;

namespace Planb.Reviews.Application.Seeding;

/// <summary>
/// Manifiesto determinístico del catálogo aprobado (issue #357): las 14 frases semilla de
/// <c>docs/product/phrases.md</c> ("La reseña de una cursada") y el instrumento
/// <c>STUDENT_COURSE</c> v1 que los agrupa, en el orden en que se preguntan (contexto, conducta de
/// la cátedra, vivencia).
///
/// <para>
/// El período y la cátedra NO son frases acá: son campos estructurales de la reseña que referencian
/// <c>AcademicTerm</c> y <c>Chair</c> directamente, no preguntas del cuestionario (ver phrases.md).
/// </para>
///
/// <para>
/// UUIDs hardcodeados en lugar de <c>Guid.NewGuid()</c>, mismo motivo que <c>AcademicSeedData</c>
/// (ADR-0058): son referencias públicas del proyecto (docs, fixtures, specs), no valores de arranque
/// descartables. Convención de UUIDs propia del módulo reviews, sin pisar los prefijos 1-8 que ya usa
/// <c>AcademicSeedData</c>:
/// <list type="bullet">
///   <item>Items: <c>00000010-0000-4000-a000-0000000000NN</c>, NN secuencial en el orden de arriba.</item>
///   <item>Instruments: <c>00000011-0000-4000-a000-0000000000NN</c>.</item>
/// </list>
/// </para>
/// </summary>
public static class CatalogSeedData
{
    public const string StudentCourseCode = "STUDENT_COURSE";
    public const short StudentCourseVersion = 1;

    public static readonly InstrumentId StudentCourseInstrumentId =
        new(Guid.Parse("00000011-0000-4000-a000-000000000001"));

    /// <summary>Una frase semilla con sus opciones, en la forma que pide <see cref="Item.Hydrate"/>.</summary>
    public sealed record ItemSeed(
        ItemId Id,
        string Code,
        string Text,
        string? Help,
        ItemLayer Layer,
        ItemSubject Subject,
        IReadOnlyList<(short Value, short Order, string Label, OptionValence Valence)> Options);

    /// <summary>
    /// Las 14 frases, en el orden de publicación del instrumento. Contexto no se publica y por eso
    /// todas sus opciones llevan <see cref="OptionValence.None"/> (el dominio lo exige: una frase de
    /// capa Context con una opción con valencia no compila el aggregate). La opción negativa de cada
    /// frase de conducta y vivencia es la que phrases.md marca en negrita.
    /// </summary>
    public static IReadOnlyList<ItemSeed> Items { get; } =
    [
        // ---------- Contexto (no se publica) ----------
        new ItemSeed(
            Id: new ItemId(Guid.Parse("00000010-0000-4000-a000-000000000001")),
            Code: "COURSE_MODALITY",
            Text: "¿Cómo cursaste?",
            Help: null,
            Layer: ItemLayer.Context,
            Subject: ItemSubject.Chair,
            Options:
            [
                (1, 1, "Presencial", OptionValence.None),
                (2, 2, "A distancia", OptionValence.None),
                (3, 3, "Mezcla", OptionValence.None),
            ]),

        new ItemSeed(
            Id: new ItemId(Guid.Parse("00000010-0000-4000-a000-000000000002")),
            Code: "COURSE_OUTCOME",
            Text: "¿Cómo terminó esa cursada?",
            Help: null,
            Layer: ItemLayer.Context,
            Subject: ItemSubject.Chair,
            Options:
            [
                (1, 1, "La aprobé", OptionValence.None),
                (2, 2, "Me quedó regular", OptionValence.None),
                (3, 3, "La recursé", OptionValence.None),
                (4, 4, "La dejé", OptionValence.None),
            ]),

        new ItemSeed(
            Id: new ItemId(Guid.Parse("00000010-0000-4000-a000-000000000003")),
            Code: "COURSE_ATTEMPTS",
            Text: "¿Cuántas veces la cursaste, contando esta?",
            Help: null,
            Layer: ItemLayer.Context,
            Subject: ItemSubject.Subject,
            Options:
            [
                (1, 1, "Una", OptionValence.None),
                (2, 2, "Dos", OptionValence.None),
                (3, 3, "Tres o más", OptionValence.None),
            ]),

        // ---------- Qué hizo la cátedra (conducta observable) ----------
        new ItemSeed(
            Id: new ItemId(Guid.Parse("00000010-0000-4000-a000-000000000004")),
            Code: "CHAIR_ANSWERS_IN_CLASS",
            Text: "¿Contestaba las preguntas que le hacían en clase?",
            Help: null,
            Layer: ItemLayer.ChairConduct,
            Subject: ItemSubject.Chair,
            Options:
            [
                (1, 1, "Siempre", OptionValence.Positive),
                (2, 2, "A veces", OptionValence.Neutral),
                (3, 3, "Casi nunca", OptionValence.Negative),
                (4, 4, "Nadie preguntaba", OptionValence.Neutral),
            ]),

        new ItemSeed(
            Id: new ItemId(Guid.Parse("00000010-0000-4000-a000-000000000005")),
            Code: "CHAIR_CLASSES_HELD",
            Text: "¿Se dictaron las clases?",
            Help: null,
            Layer: ItemLayer.ChairConduct,
            Subject: ItemSubject.Chair,
            Options:
            [
                (1, 1, "Casi todas", OptionValence.Positive),
                (2, 2, "Faltaron algunas", OptionValence.Neutral),
                (3, 3, "Faltaron muchas", OptionValence.Negative),
            ]),

        new ItemSeed(
            Id: new ItemId(Guid.Parse("00000010-0000-4000-a000-000000000006")),
            Code: "CHAIR_PRACTICE_MATCHES_THEORY",
            Text: "¿El práctico daba lo mismo que el teórico?",
            Help: null,
            Layer: ItemLayer.ChairConduct,
            Subject: ItemSubject.Chair,
            Options:
            [
                (1, 1, "Sí", OptionValence.Positive),
                (2, 2, "Había diferencias", OptionValence.Neutral),
                (3, 3, "Eran dos materias distintas", OptionValence.Negative),
            ]),

        new ItemSeed(
            Id: new ItemId(Guid.Parse("00000010-0000-4000-a000-000000000007")),
            Code: "CHAIR_ANSWERS_OUTSIDE_CLASS",
            Text: "¿Respondía consultas fuera de clase?",
            Help: null,
            Layer: ItemLayer.ChairConduct,
            Subject: ItemSubject.Chair,
            Options:
            [
                (1, 1, "Sí", OptionValence.Positive),
                (2, 2, "A veces", OptionValence.Neutral),
                (3, 3, "No había forma", OptionValence.Negative),
            ]),

        new ItemSeed(
            Id: new ItemId(Guid.Parse("00000010-0000-4000-a000-000000000008")),
            Code: "CHAIR_EXAM_DATE_NOTICE",
            Text: "¿Avisó la fecha del parcial con anticipación?",
            Help: null,
            Layer: ItemLayer.ChairConduct,
            Subject: ItemSubject.Chair,
            Options:
            [
                (1, 1, "Más de 2 semanas", OptionValence.Positive),
                (2, 2, "1 a 2 semanas", OptionValence.Neutral),
                (3, 3, "Menos de una semana", OptionValence.Neutral),
                (4, 4, "Nos enteramos de casualidad", OptionValence.Negative),
            ]),

        new ItemSeed(
            Id: new ItemId(Guid.Parse("00000010-0000-4000-a000-000000000009")),
            Code: "CHAIR_SYLLABUS_UPFRONT",
            Text: "¿Entregó el programa al inicio?",
            Help: null,
            Layer: ItemLayer.ChairConduct,
            Subject: ItemSubject.Chair,
            Options:
            [
                (1, 1, "Sí", OptionValence.Positive),
                (2, 2, "Tarde", OptionValence.Neutral),
                (3, 3, "Nunca lo vi", OptionValence.Negative),
            ]),

        new ItemSeed(
            Id: new ItemId(Guid.Parse("00000010-0000-4000-a000-00000000000a")),
            Code: "CHAIR_OFF_SYLLABUS_EXAMS",
            Text: "¿Tomó temas que no estaban en el programa?",
            Help: null,
            Layer: ItemLayer.ChairConduct,
            Subject: ItemSubject.Chair,
            Options:
            [
                (1, 1, "No", OptionValence.Positive),
                (2, 2, "Alguno", OptionValence.Neutral),
                (3, 3, "Varios", OptionValence.Negative),
            ]),

        // ---------- Qué te pasó a vos (vivencia) ----------
        new ItemSeed(
            Id: new ItemId(Guid.Parse("00000010-0000-4000-a000-00000000000b")),
            Code: "STUDENT_UNDERSTOOD_IN_CLASS",
            Text: "¿Salías de la clase entendiendo el tema?",
            Help: null,
            Layer: ItemLayer.StudentExperience,
            Subject: ItemSubject.Chair,
            Options:
            [
                (1, 1, "Casi siempre", OptionValence.Positive),
                (2, 2, "A veces", OptionValence.Neutral),
                (3, 3, "Casi nunca", OptionValence.Negative),
            ]),

        new ItemSeed(
            Id: new ItemId(Guid.Parse("00000010-0000-4000-a000-00000000000c")),
            Code: "STUDENT_MATERIAL_ENOUGH",
            Text: "¿El material alcanzaba para preparar el parcial?",
            Help: null,
            Layer: ItemLayer.StudentExperience,
            Subject: ItemSubject.Chair,
            Options:
            [
                (1, 1, "Sí", OptionValence.Positive),
                (2, 2, "Había que buscar por afuera", OptionValence.Neutral),
                (3, 3, "No servía", OptionValence.Negative),
            ]),

        new ItemSeed(
            Id: new ItemId(Guid.Parse("00000010-0000-4000-a000-00000000000d")),
            Code: "STUDENT_KEPT_PACE",
            Text: "¿Pudiste seguir el ritmo?",
            Help: null,
            Layer: ItemLayer.StudentExperience,
            Subject: ItemSubject.Chair,
            Options:
            [
                (1, 1, "Sí", OptionValence.Positive),
                (2, 2, "Con esfuerzo", OptionValence.Neutral),
                (3, 3, "Me quedé atrás", OptionValence.Negative),
            ]),

        new ItemSeed(
            Id: new ItemId(Guid.Parse("00000010-0000-4000-a000-00000000000e")),
            Code: "STUDENT_COULD_ASK",
            Text: "¿Sentías que podías preguntar sin quedar mal?",
            Help: null,
            Layer: ItemLayer.StudentExperience,
            Subject: ItemSubject.Chair,
            Options:
            [
                (1, 1, "Sí", OptionValence.Positive),
                (2, 2, "Depende del día", OptionValence.Neutral),
                (3, 3, "No", OptionValence.Negative),
            ]),
    ];
}
