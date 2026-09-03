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
///   Par 211 + 121     12 la llevaron juntas, 3 dejaron una   publica
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
/// </summary>
public static class CorpusSeedData
{
    /// <summary>211 Fundamentos de Control de Calidad, la única materia con cátedras sembradas.</summary>
    public static readonly Guid Subject211 = Guid.Parse("00000004-0000-4000-a000-000000000012");

    /// <summary>121 Base de datos: la que se lleva junto con 211 en el par que publica.</summary>
    private static readonly Guid Subject121 = Guid.Parse("00000004-0000-4000-a000-000000000005");

    /// <summary>223 Desarrollo Back End: el par que se queda bajo el piso.</summary>
    private static readonly Guid Subject223 = Guid.Parse("00000004-0000-4000-a000-000000000017");

    /// <summary>2024-C1, el período más viejo del seed. Todo el corpus vive en uno solo: la
    /// co-cursada cuenta por período, y repartirlo entre varios la dejaría sin pares.</summary>
    public static readonly Guid Term2024C1 = Guid.Parse("00000005-0000-4000-a000-000000000001");

    private static readonly Guid ChairPerez = Guid.Parse("00000008-0000-4000-a000-000000000001");
    private static readonly Guid ChairGonzalez = Guid.Parse("00000008-0000-4000-a000-000000000002");
    private static readonly Guid ChairRuiz = Guid.Parse("00000008-0000-4000-a000-000000000003");

    // Las frases que el corpus contesta. No contesta las catorce: alcanzan estas cuatro para que la
    // ficha tenga su moda, su distribución y su conteo de desenlaces, y agregar los demás sumaría
    // filas sin sumar nada que mirar.
    private static readonly ItemId Outcome = new(Guid.Parse("00000010-0000-4000-a000-000000000002"));
    private static readonly ItemId AnswersInClass = new(Guid.Parse("00000010-0000-4000-a000-000000000004"));
    private static readonly ItemId ClassesHeld = new(Guid.Parse("00000010-0000-4000-a000-000000000005"));
    private static readonly ItemId UnderstoodInClass = new(Guid.Parse("00000010-0000-4000-a000-00000000000b"));

    /// <summary>
    /// Una cursada sembrada. <paramref name="AccountIndex"/> es el número de la cuenta sintética:
    /// dos filas con el mismo índice son la misma persona, y eso es lo que arma un par de
    /// co-cursada.
    /// </summary>
    public sealed record SeededReview(
        ReviewId Id,
        int AccountIndex,
        Guid SubjectId,
        Guid TermId,
        Guid? ChairId,
        IReadOnlyList<(ItemId ItemId, short OptionValue)> Answers);

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
        // 3 dejaron una". En 121 todas llegaron al final, así que el conteo de dejadas sale entero
        // del lado de 211.
        for (var i = 1; i <= 12; i++)
        {
            reviews.Add(new SeededReview(
                ReviewIdAt(reviews.Count + 1), i, Subject121, Term2024C1, ChairId: null,
                [(Outcome, 1), (UnderstoodInClass, (short)(i % 3 + 1))]));
        }

        // Y un par que se queda corto, para que el estado "le faltan N" también se pueda ver.
        for (var i = 13; i <= 17; i++)
        {
            reviews.Add(new SeededReview(
                ReviewIdAt(reviews.Count + 1), i, Subject223, Term2024C1, ChairId: null,
                [(Outcome, 1), (UnderstoodInClass, 2)]));
        }

        return reviews;
    }

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
