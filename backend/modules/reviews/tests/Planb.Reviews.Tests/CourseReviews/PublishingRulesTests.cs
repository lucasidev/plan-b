using Planb.Reviews.Domain.CourseReviews;
using Shouldly;
using Xunit;

namespace Planb.Reviews.Tests.CourseReviews;

/// <summary>
/// Los valores de <see cref="PublishingRules"/> escritos como literales, a propósito.
///
/// <para>
/// Todo el resto del código y de los tests referencia estas constantes, que es lo correcto: ahí el
/// valor es incidental. Pero si <b>nadie</b> afirma el número, cambiarlo no rompe nada y el
/// producto deja de cumplir lo que promete en silencio. Este archivo es el oráculo: son decisiones
/// de producto que se pueden explicar sin leer una línea de código, así que se escriben a mano.
/// </para>
///
/// <para>
/// Que un test de acá falle no es un bug: es que alguien cambió una promesa. Se actualiza el
/// literal <b>y</b> el ADR que lo sostiene, en el mismo cambio.
/// </para>
/// </summary>
public class PublishingRulesTests
{
    /// <summary>
    /// El piso es 10 y la razón es la privacidad de quien reseña, no la estadística: con dos o tres
    /// reseñas el titular deduce quién dijo qué ([ADR-0082](docs/decisions/0082)). Bajarlo expone a
    /// quien aportó; subirlo deja mudo al producto por más tiempo.
    /// </summary>
    [Fact]
    public void A_chair_publishes_from_ten_reviews()
    {
        PublishingRules.ChairMinimumReviews.ShouldBe(10);
    }

    /// <summary>
    /// Llegar al final es aprobar o quedar regular. Recursar y dejar, no: quedar regular es haber
    /// llegado al final de la cursada aunque falte el final (US-148).
    /// </summary>
    [Fact]
    public void Reaching_the_end_means_passed_or_regular_and_nothing_else()
    {
        PublishingRules.OutcomeValuesReachingTheEnd.ShouldBe(new HashSet<short> { 1, 2 });
    }

    /// <summary>
    /// La opción abierta de intentos es "tres o más". Es la que hace irreproducible cualquier
    /// promedio, y por eso la ficha la publica aparte (ADR-0083).
    /// </summary>
    [Fact]
    public void The_open_ended_attempts_option_is_three_or_more()
    {
        PublishingRules.AttemptsOpenEndedValue.ShouldBe((short)3);
    }
}
