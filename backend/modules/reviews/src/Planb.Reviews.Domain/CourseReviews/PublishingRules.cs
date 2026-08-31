namespace Planb.Reviews.Domain.CourseReviews;

/// <summary>
/// Las reglas de publicación que gobiernan qué se muestra de un sujeto y qué se calla. Viven en el
/// dominio y no en la configuración porque no son un parámetro operativo: son la posición del
/// producto, y cambiarlas es cambiar lo que prometemos.
/// </summary>
public static class PublishingRules
{
    /// <summary>
    /// Reseñas mínimas para que una cátedra publique sus conteos (ADR-0082).
    ///
    /// <para>
    /// La razón es la privacidad de quien reseña, no la vergüenza estadística: con dos o tres
    /// reseñas, el titular deduce quién dijo qué. Por eso el piso protege al que aporta y no a la
    /// institución, y por eso la ficha muestra el estado ("junta 3 reseñas: con 7 más se publica")
    /// en vez de esconder que existe.
    /// </para>
    /// </summary>
    public const int ChairMinimumReviews = 10;

    /// <summary>
    /// Cuentas mínimas para publicar que dos materias se llevaron juntas, por par y período
    /// (US-143, decidido el 2026-08-29).
    ///
    /// <para>
    /// Es un piso propio y no el de la cátedra aunque hoy valgan lo mismo: protegen cosas
    /// distintas. El de la cátedra existe por la privacidad de quien reseña; este existe porque con
    /// menos, el número diría más sobre quién se acordó de reseñar que sobre la combinación. Si uno
    /// se mueve, el otro no tiene por qué seguirlo.
    /// </para>
    /// </summary>
    public const int SubjectPairMinimumReviews = 10;

    /// <summary>
    /// El código del cuestionario de la cursada. Es el instrumento contra el que se responde al
    /// reseñar; el administrativo tiene el suyo y llega con su propio sprint (ADR-0085).
    /// </summary>
    public const string CourseInstrumentCode = "STUDENT_COURSE";

    /// <summary>
    /// El ítem del que sale la tasa de finalización agregada (ADR-0083, punto 6).
    /// </summary>
    public const string OutcomeItemCode = "COURSE_OUTCOME";

    /// <summary>
    /// Qué desenlaces cuentan como haber llegado: aprobar y quedar regular. Recursar y dejar, no.
    ///
    /// <para>
    /// La definición es del producto, no del que lee: quedar regular es llegar al final de la
    /// cursada, aunque falte el final. Y la tasa se publica **solo agregada**, porque el punto es
    /// que la universidad se pregunte por qué su gente no termina, no señalar a nadie: el desenlace
    /// de una persona no se muestra jamás (US-148).
    /// </para>
    /// </summary>
    public static readonly IReadOnlySet<short> OutcomeValuesReachingTheEnd =
        new HashSet<short> { 1, 2 };

    /// <summary>
    /// El ítem del que sale cuántas veces se cursa una materia antes de aprobarla.
    ///
    /// <para>
    /// Se publica como distribución y nunca como promedio: su última opción es abierta ("tres o
    /// más"), así que promediarla subestima siempre y por un margen que nadie puede recalcular.
    /// Es el mismo motivo por el que ADR-0083 descarta "2,4 sobre 3".
    /// </para>
    /// </summary>
    public const string AttemptsItemCode = "COURSE_ATTEMPTS";

    /// <summary>
    /// El valor de la opción ABIERTA de ese ítem ("tres o más").
    ///
    /// <para>
    /// Es la que hace irreproducible cualquier promedio, porque quien la cursó cinco veces y quien
    /// la cursó tres marcan lo mismo. Por eso la ficha la publica <b>aparte y a la vista</b> en vez
    /// de dejarla al final de la distribución: es justo la gente que el dato existe para mostrar,
    /// y la que un promedio taparía.
    /// </para>
    ///
    /// <para>
    /// Vive acá y no en la pantalla porque cuál opción es abierta lo sabe el catálogo, no quien
    /// dibuja: suponer "la última" sería cierto en este ítem y falso en casi todos los demás.
    /// </para>
    /// </summary>
    public const short AttemptsOpenEndedValue = 3;
}
