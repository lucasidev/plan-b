using Planb.Reviews.Domain.Catalog;
using Planb.Reviews.Domain.Reviews;

namespace Planb.Reviews.Application.Seeding;

/// <summary>
/// El corpus de demostración: reseñas sembradas para que las fichas tengan qué mostrar (#374).
///
/// <para>
/// <b>Los conteos son calculables a mano</b>, que es la única forma de verificar que la ficha dice
/// la verdad. Lo que este manifiesto produce, sobre la materia 211 en el período 2024-C1:
/// </para>
///
/// <code>
///   Cátedra Pérez     14 voces  publica
///     ¿Se dictaron las clases?          7 faltaron muchas · 4 faltaron algunas · 3 casi todas
///     ¿Contestaba en clase?             8 casi nunca      · 4 a veces          · 2 siempre
///     ¿Salías entendiendo?              7 casi nunca      · 5 a veces          · 2 casi siempre
///
///   Cátedra González  12 voces  publica
///     ¿Se dictaron las clases?          9 casi todas      · 2 faltaron algunas · 1 faltaron muchas
///     ¿Contestaba en clase?             8 siempre         · 3 a veces          · 1 casi nunca
///     ¿Salías entendiendo?              7 casi siempre    · 4 a veces          · 1 casi nunca
///
///   Cátedra Ruiz       6 voces  no publica, le faltan 4
///
///   Par 211 + 111     12 la llevaron juntas, 3 dejaron una   publica
///   Par 211 + 223      5 la llevaron juntas                  no publica, le faltan 5
/// </code>
///
/// <para>
/// Las dos hermanas que publican están hechas para que la comparación tenga señal: Pérez pierde
/// clases y González no, sobre la misma materia y el mismo período. Ruiz existe para que se pueda
/// ver el otro estado, el de la ficha que todavía no llegó al piso y lo dice.
/// </para>
///
/// <para>
/// <b>Las cuentas son sintéticas</b>, guids del rango <c>00000020-…</c>. Una reseña referencia a su
/// cuenta por id y sin FK (ADR-0017), así que el corpus no necesita usuarios de verdad y no le pide
/// nada a identity. Ninguna de esas cuentas puede iniciar sesión, que es lo correcto: representan a
/// los que ya reseñaron, no a nadie que vaya a entrar.
/// </para>
///
/// <para>
/// <b>El mapa de estados</b>, materia por cátedra, todo en 2024-C1 salvo lo que se
/// aclara aparte:
/// </para>
///
/// <code>
///   211 Fundamentos de Control de Calidad (sin tocar, la citan cuatro registros de revisión)
///     Pérez     14 voces  publica, sin fama por convergencia
///     González  12 voces  publica, hermana de Pérez (Wilson separa CHAIR_CLASSES_HELD)
///     Ruiz       6 voces  bajo el piso, le faltan 4
///
///   111 Desarrollo de Software
///     Ibáñez    16 voces  publica, con fama (tres frases convergen del lado malo)
///     Vega       3 voces  bajo el piso, le faltan 7
///     (+ el par de co-cursada con 211 de siempre, sin tocar)
///
///   121 Base de datos
///     Domínguez 10 voces  publica justo en el piso, ni una de más
///
///   122 Álgebra II
///     Aráoz     13 voces  sola cátedra de la materia (sin hermana contra qué compararse) y sede
///               de la frase retirada: CHAIR_SYLLABUS_UPFRONT se corta y la sucede
///               CHAIR_SYLLABUS_UPFRONT_V2 (7 voces respondieron la vieja, 6 la nueva)
///
///   123 Seminario Informático I
///     Bravo      9 voces  a una del piso, le falta 1
///
///   101 Algoritmos y Paradigmas
///     Fernández  0 voces  materia con cátedra y titular, sin ninguna reseña todavía
///
///   102 Álgebra I + 103 Inglés A1     11 la llevaron juntas   publica
///   104 Formación Humanística I + 113 Gestión de RR.HH   6 la llevaron juntas   no publica, le faltan 4
///
///   213 Desarrollo Front End y 221 Control de Calidad Avanzado: dos voces propias de
///   lucia.mansilla (persona sembrada), para "Mis aportes" e Inicio.
/// </code>
///
/// <para>
/// Lo que el modelo vigente no soporta y por eso no está: una nota editorial a nivel institución.
/// <c>EditorialNote</c> solo cuelga de una carrera (ver su propio docstring): el nivel institución
/// está declarado en ADR-0084 pero su ficha todavía no existe, así que acá solo se siembra la nota
/// de carrera (Tecnicatura UNSTA).
/// </para>
/// </summary>
public static class CorpusSeedData
{
    /// <summary>211 Fundamentos de Control de Calidad, la materia con las tres cátedras originales.</summary>
    public static readonly Guid Subject211 = Guid.Parse("00000004-0000-4000-a000-000000000012");

    /// <summary>111 Desarrollo de Software: la que se lleva junto con 211 en el par que publica.</summary>
    private static readonly Guid Subject111 = Guid.Parse("00000004-0000-4000-a000-000000000005");

    /// <summary>223 Desarrollo Back End: el par que se queda bajo el piso.</summary>
    private static readonly Guid Subject223 = Guid.Parse("00000004-0000-4000-a000-000000000017");

    // 101 no tiene entrada acá: su estado (cátedra con titular, cero reseñas) no necesita ninguna
    // fila del corpus, lo pone entero AcademicSeedData con la cátedra Fernández.
    private static readonly Guid Subject102 = Guid.Parse("00000004-0000-4000-a000-000000000002");
    private static readonly Guid Subject103 = Guid.Parse("00000004-0000-4000-a000-000000000003");
    private static readonly Guid Subject104 = Guid.Parse("00000004-0000-4000-a000-000000000004");
    private static readonly Guid Subject113 = Guid.Parse("00000004-0000-4000-a000-000000000006");
    private static readonly Guid Subject121 = Guid.Parse("00000004-0000-4000-a000-000000000007");
    private static readonly Guid Subject122 = Guid.Parse("00000004-0000-4000-a000-000000000008");
    private static readonly Guid Subject123 = Guid.Parse("00000004-0000-4000-a000-000000000009");
    private static readonly Guid Subject213 = Guid.Parse("00000004-0000-4000-a000-000000000014");
    private static readonly Guid Subject221 = Guid.Parse("00000004-0000-4000-a000-000000000015");

    /// <summary>2024-C1, el período más viejo del seed. La mayoría del corpus vive en uno solo: la
    /// co-cursada cuenta por período, y repartirlo entre varios la dejaría sin pares.</summary>
    public static readonly Guid Term2024C1 = Guid.Parse("00000005-0000-4000-a000-000000000001");

    private static readonly Guid Term2024C2 = Guid.Parse("00000005-0000-4000-a000-000000000002");
    private static readonly Guid Term2025C1 = Guid.Parse("00000005-0000-4000-a000-000000000003");

    private static readonly Guid ChairPerez = Guid.Parse("00000008-0000-4000-a000-000000000001");
    private static readonly Guid ChairGonzalez = Guid.Parse("00000008-0000-4000-a000-000000000002");
    private static readonly Guid ChairRuiz = Guid.Parse("00000008-0000-4000-a000-000000000003");
    private static readonly Guid ChairIbanez = Guid.Parse("00000008-0000-4000-a000-000000000004");
    private static readonly Guid ChairVega = Guid.Parse("00000008-0000-4000-a000-000000000005");
    private static readonly Guid ChairDominguez = Guid.Parse("00000008-0000-4000-a000-000000000006");
    private static readonly Guid ChairAraoz = Guid.Parse("00000008-0000-4000-a000-000000000007");
    private static readonly Guid ChairBravo = Guid.Parse("00000008-0000-4000-a000-000000000008");
    private static readonly Guid ChairGodoy = Guid.Parse("00000008-0000-4000-a000-000000000011");
    private static readonly Guid ChairJuarez = Guid.Parse("00000008-0000-4000-a000-000000000012");

    // Las frases que el corpus contesta. Entre 211 y lo nuevo suman nueve de las catorce, para que
    // las fichas tengan de qué hablar más allá de "cómo terminó" y "cómo te fue en clase".
    private static readonly ItemId Outcome = new(Guid.Parse("00000010-0000-4000-a000-000000000002"));
    private static readonly ItemId AnswersInClass = new(Guid.Parse("00000010-0000-4000-a000-000000000004"));
    private static readonly ItemId ClassesHeld = new(Guid.Parse("00000010-0000-4000-a000-000000000005"));
    private static readonly ItemId ExamDateNotice = new(Guid.Parse("00000010-0000-4000-a000-000000000008"));
    private static readonly ItemId SyllabusUpfront = new(Guid.Parse("00000010-0000-4000-a000-000000000009"));
    private static readonly ItemId AnswersOutsideClass = new(Guid.Parse("00000010-0000-4000-a000-000000000007"));
    private static readonly ItemId UnderstoodInClass = new(Guid.Parse("00000010-0000-4000-a000-00000000000b"));
    private static readonly ItemId MaterialEnough = new(Guid.Parse("00000010-0000-4000-a000-00000000000c"));
    private static readonly ItemId KeptPace = new(Guid.Parse("00000010-0000-4000-a000-00000000000d"));

    /// <summary>
    /// El código de la frase que reemplaza a <see cref="SyllabusUpfront"/>: corta la
    /// serie de <c>CHAIR_SYLLABUS_UPFRONT</c> para que la ficha de Aráoz tenga un tramo viejo y uno
    /// nuevo. Sin Id propio acá porque nace recién al sembrar (<see cref="CorpusSeeder"/>), no es
    /// parte del catálogo de referencia (<c>CatalogSeedData</c>).
    /// </summary>
    public const string SyllabusUpfrontSuccessorCode = "CHAIR_SYLLABUS_UPFRONT_V2";

    /// <summary>
    /// Una cursada sembrada. <paramref name="AccountIndex"/> es el número de la cuenta sintética:
    /// dos filas con el mismo índice son la misma persona, y eso es lo que arma un par de
    /// co-cursada. <paramref name="AccountIdOverride"/> pisa esa cuenta sintética por una real
    /// (una persona sembrada, ver <see cref="LuciaReviews"/>); cuando está presente,
    /// <paramref name="AccountIndex"/> no se usa. <paramref name="FreeText"/> es el campo libre,
    /// nulo en la mayoría de las filas.
    /// </summary>
    public sealed record SeededReview(
        ReviewId Id,
        int AccountIndex,
        Guid SubjectId,
        Guid TermId,
        Guid? ChairId,
        IReadOnlyList<(ItemId ItemId, short OptionValue)> Answers,
        string? FreeText = null,
        Guid? AccountIdOverride = null);

    /// <summary>Todas las cursadas del corpus, en orden estable.</summary>
    public static IReadOnlyList<SeededReview> Reviews { get; } = Build();

    /// <summary>
    /// El id de la cursada número <paramref name="position"/> del manifiesto. Determinista como el
    /// resto del seed (ADR-0058): correrlo dos veces produce las mismas filas, no filas nuevas.
    /// </summary>
    private static ReviewId ReviewIdAt(int position) =>
        new(Guid.Parse($"00000021-0000-4000-a000-{position:x12}"));

    /// <summary>
    /// La cuenta sintética número <paramref name="index"/>. El rango <c>00000020-…</c> no lo usa
    /// ningún otro seed.
    /// </summary>
    public static Guid AccountId(int index) =>
        Guid.Parse($"00000020-0000-4000-a000-{index:x12}");

    private static List<SeededReview> Build()
    {
        var reviews = new List<SeededReview>();

        // Las tres cátedras de 211, cada una con su tramo de cuentas. Los índices no se pisan: una
        // cuenta reseña 211 una sola vez en el período (lo impone el UNIQUE de la tabla).
        var next = 1;
        next = AddChair(reviews, next, ChairPerez, voices: 14,
            classesHeld: [(3, 7), (2, 4), (1, 3)],
            answersInClass: [(3, 8), (2, 4), (1, 2)],
            understood: [(3, 7), (2, 5), (1, 2)],
            outcomes: [(1, 6), (2, 3), (3, 2), (4, 3)]);

        next = AddChair(reviews, next, ChairGonzalez, voices: 12,
            classesHeld: [(1, 9), (2, 2), (3, 1)],
            answersInClass: [(1, 8), (2, 3), (3, 1)],
            understood: [(1, 7), (2, 4), (3, 1)],
            outcomes: [(1, 9), (2, 2), (4, 1)]);

        AddChair(reviews, next, ChairRuiz, voices: 6,
            classesHeld: [(1, 3), (2, 2), (3, 1)],
            answersInClass: [(1, 3), (2, 2), (3, 1)],
            understood: [(1, 2), (2, 3), (3, 1)],
            outcomes: [(1, 4), (2, 1), (3, 1)]);

        // Co-cursada. Las cuentas 1..12 son las primeras doce de Pérez, y de ellas las 10, 11 y 12
        // son las que marcaron recursé o dejé en 211: por eso el par publica "12 la llevaron juntas,
        // 3 dejaron una". En 111 todas llegaron al final, así que el conteo de dejadas sale entero
        // del lado de 211.
        for (var i = 1; i <= 12; i++)
        {
            reviews.Add(new SeededReview(
                ReviewIdAt(reviews.Count + 1), i, Subject111, Term2024C1, ChairId: null,
                [(Outcome, 1), (UnderstoodInClass, (short)(i % 3 + 1))]));
        }

        // Y un par que se queda corto, para que el estado "le faltan N" también se pueda ver.
        for (var i = 13; i <= 17; i++)
        {
            reviews.Add(new SeededReview(
                ReviewIdAt(reviews.Count + 1), i, Subject223, Term2024C1, ChairId: null,
                [(Outcome, 1), (UnderstoodInClass, 2)]));
        }

        // ---------- 111: una cátedra que publica con muchas voces (con fama) y otra que no llega ----------
        var ibanezStart = reviews.Count;
        AddChair(reviews, 100, ChairIbanez, voices: 16,
            classesHeld: [(3, 10), (2, 4), (1, 2)],
            answersInClass: [(3, 10), (2, 4), (1, 2)],
            understood: [(3, 9), (2, 4), (1, 3)],
            outcomes: [(1, 9), (2, 3), (3, 3), (4, 1)]);
        SetFreeText(reviews, ibanezStart,
            "Con Ibáñez las clases se caían seguido, terminé estudiando de apuntes de compañeros.");
        SetFreeText(reviews, ibanezStart + 1,
            "Ibáñez no contestaba nada en clase, había que ir a consulta sí o sí.");

        var vegaStart = reviews.Count;
        AddChair(reviews, 116, ChairVega, voices: 3,
            classesHeld: [(1, 2), (2, 1)],
            answersInClass: [(1, 2), (2, 1)],
            understood: [(1, 2), (2, 1)],
            outcomes: [(1, 3)]);
        SetFreeText(reviews, vegaStart, "Vega recién arrancó, todavía se está acomodando con los tiempos.");

        // ---------- 121: justo en el piso, ni una reseña de más ----------
        var domStart = reviews.Count;
        AddChairWithItems(reviews, 119, Subject121, ChairDominguez, voices: 10,
            (Outcome, [(1, 6), (2, 2), (3, 1), (4, 1)]),
            (ExamDateNotice, [(1, 4), (2, 3), (3, 2), (4, 1)]),
            (MaterialEnough, [(1, 5), (2, 3), (3, 2)]));
        SetFreeText(reviews, domStart,
            "Domínguez avisa la fecha del parcial con semanas de anticipación, se agradece.");

        // ---------- 122: sola cátedra de la materia (sin hermana), y sede de la frase retirada.
        // El tramo de después del corte lo siembra CorpusSeeder con PostSeriesCutReviews, recién
        // cuando existe el Id de la frase sucesora. ----------
        var araozStart = reviews.Count;
        AddChairWithItems(reviews, 129, Subject122, ChairAraoz, voices: 7,
            (Outcome, [(1, 5), (2, 1), (3, 1)]),
            (KeptPace, [(1, 4), (2, 2), (3, 1)]),
            (SyllabusUpfront, [(1, 3), (2, 2), (3, 2)]));
        SetFreeText(reviews, araozStart, "Aráoz entregó el programa recién a mitad de cuatrimestre.");

        // ---------- 123: a una del piso, le falta 1 ----------
        var bravoStart = reviews.Count;
        AddChairWithItems(reviews, 142, Subject123, ChairBravo, voices: 9,
            (Outcome, [(1, 5), (2, 2), (3, 1), (4, 1)]),
            (AnswersOutsideClass, [(1, 4), (2, 3), (3, 2)]));
        SetFreeText(reviews, bravoStart,
            "Bravo respondía las consultas por mail, pero tardaba varios días en contestar.");

        // ---------- Co-cursada nueva: un par que publica y otro que no llega ----------
        var pairStart = reviews.Count;
        for (var i = 151; i <= 161; i++)
        {
            // Los últimos dos recursaron 102: es lo que hace que el par publicado también tenga
            // "dejaron una" que mostrar, y no solo el de 211+111.
            var outcome102 = i <= 159 ? (short)1 : (short)3;
            reviews.Add(new SeededReview(
                ReviewIdAt(reviews.Count + 1), i, Subject102, Term2024C1, ChairId: null,
                [(Outcome, outcome102)]));
            reviews.Add(new SeededReview(
                ReviewIdAt(reviews.Count + 1), i, Subject103, Term2024C1, ChairId: null,
                [(Outcome, 1)]));
        }
        SetFreeText(reviews, pairStart,
            "Álgebra I e Inglés A1 las cursé el mismo cuatrimestre, se pudo llevar bien.");

        for (var i = 162; i <= 167; i++)
        {
            reviews.Add(new SeededReview(
                ReviewIdAt(reviews.Count + 1), i, Subject104, Term2024C1, ChairId: null,
                [(Outcome, 1)]));
            reviews.Add(new SeededReview(
                ReviewIdAt(reviews.Count + 1), i, Subject113, Term2024C1, ChairId: null,
                [(Outcome, 1)]));
        }

        return reviews;
    }

    /// <summary>
    /// El tramo de después del corte de serie de <see cref="SyllabusUpfront"/>: seis
    /// cuentas más de Aráoz (122) que respondieron <paramref name="successorItemId"/> en vez de la
    /// frase vieja. IDs de reseña propios (rango <c>…-800</c> en adelante) porque este método corre
    /// fuera de la secuencia de <see cref="Build"/>: reusar <see cref="ReviewIdAt"/> acá pisaría los
    /// ids de las primeras filas del corpus.
    /// </summary>
    public static IReadOnlyList<SeededReview> PostSeriesCutReviews(ItemId successorItemId)
    {
        var outcome = Expand([(1, 3), (2, 1), (3, 1), (4, 1)], 6);
        var keptPace = Expand([(1, 3), (2, 2), (3, 1)], 6);
        var syllabus = Expand([(1, 4), (2, 1), (3, 1)], 6);

        var reviews = new List<SeededReview>();
        for (var i = 0; i < 6; i++)
        {
            reviews.Add(new SeededReview(
                new ReviewId(Guid.Parse($"00000021-0000-4000-a000-{800 + i:x12}")),
                AccountIndex: 136 + i,
                Subject122,
                Term2024C1,
                ChairAraoz,
                [(Outcome, outcome[i]), (KeptPace, keptPace[i]), (successorItemId, syllabus[i])]));
        }

        return reviews;
    }

    /// <summary>
    /// Dos reseñas propias de <c>lucia.mansilla@gmail.com</c> (persona sembrada): para
    /// que "Mis aportes" e Inicio tengan qué mostrar en una cuenta real y no solo en las sintéticas.
    /// <paramref name="luciaAccountId"/> nace random al registrarse (no es determinístico como el
    /// resto del seed): <see cref="CorpusSeeder"/> lo busca por mail antes de llamar acá. Las dos
    /// materias que elige (213, 221) no tienen ninguna otra reseña en el corpus, así que no le suma
    /// voces a ninguna cátedra por encima del piso.
    /// </summary>
    public static IReadOnlyList<SeededReview> LuciaReviews(Guid luciaAccountId) =>
    [
        new SeededReview(
            new ReviewId(Guid.Parse("00000021-0000-4000-a000-000000000901")),
            AccountIndex: 0,
            Subject213,
            Term2024C2,
            ChairGodoy,
            [(Outcome, 1), (UnderstoodInClass, 2)],
            FreeText: "Front End me costó al principio, pero Godoy explica bien las dudas después de clase.",
            AccountIdOverride: luciaAccountId),
        new SeededReview(
            new ReviewId(Guid.Parse("00000021-0000-4000-a000-000000000902")),
            AccountIndex: 0,
            Subject221,
            Term2025C1,
            ChairJuarez,
            [(Outcome, 2), (ClassesHeld, 1)],
            AccountIdOverride: luciaAccountId),
    ];

    /// <summary>Pisa el campo libre de la reseña en <paramref name="index"/> (posición absoluta en la lista).</summary>
    private static void SetFreeText(List<SeededReview> reviews, int index, string text) =>
        reviews[index] = reviews[index] with { FreeText = text };

    /// <summary>
    /// Suma las <paramref name="voices"/> cursadas de una cátedra, repartiendo cada distribución en
    /// orden: las primeras N cuentas contestan el primer valor, y así. Devuelve el índice de cuenta
    /// siguiente, libre.
    /// </summary>
    private static int AddChair(
        List<SeededReview> reviews,
        int firstAccount,
        Guid chairId,
        int voices,
        (short Value, int Count)[] classesHeld,
        (short Value, int Count)[] answersInClass,
        (short Value, int Count)[] understood,
        (short Value, int Count)[] outcomes)
    {
        var held = Expand(classesHeld, voices);
        var answers = Expand(answersInClass, voices);
        var understand = Expand(understood, voices);
        var outcome = Expand(outcomes, voices);

        for (var i = 0; i < voices; i++)
        {
            reviews.Add(new SeededReview(
                ReviewIdAt(reviews.Count + 1),
                firstAccount + i,
                Subject211,
                Term2024C1,
                chairId,
                [
                    (Outcome, outcome[i]),
                    (ClassesHeld, held[i]),
                    (AnswersInClass, answers[i]),
                    (UnderstoodInClass, understand[i]),
                ]));
        }

        return firstAccount + voices;
    }

    /// <summary>
    /// Como <see cref="AddChair"/> pero con un juego de frases arbitrario en vez de las cuatro fijas:
    /// lo usan los estados nuevos del corpus que responden otras frases para sumar variedad (al
    /// menos ocho de las catorce del cuestionario entre todo el corpus).
    /// </summary>
    private static void AddChairWithItems(
        List<SeededReview> reviews,
        int firstAccount,
        Guid subjectId,
        Guid chairId,
        int voices,
        params (ItemId ItemId, (short Value, int Count)[] Distribution)[] items)
    {
        var expanded = items
            .Select(entry => (entry.ItemId, Values: Expand(entry.Distribution, voices)))
            .ToList();

        for (var i = 0; i < voices; i++)
        {
            var answers = expanded.Select(e => (e.ItemId, e.Values[i])).ToList();
            reviews.Add(new SeededReview(
                ReviewIdAt(reviews.Count + 1), firstAccount + i, subjectId, Term2024C1, chairId, answers));
        }
    }

    /// <summary>
    /// Convierte una distribución (valor, cuántas veces) en la lista de respuestas. Tira si no suma
    /// las voces declaradas: un corpus cuyos números no cierran no sirve para verificar nada.
    /// </summary>
    private static short[] Expand((short Value, int Count)[] distribution, int expected)
    {
        var values = distribution.SelectMany(d => Enumerable.Repeat(d.Value, d.Count)).ToArray();
        if (values.Length != expected)
        {
            throw new InvalidOperationException(
                $"La distribución suma {values.Length} y las voces declaradas son {expected}.");
        }

        return values;
    }
}
