using Planb.Reviews.Application.Abstractions.ContentFilter;
using Planb.Reviews.Infrastructure.ContentFilter;
using Shouldly;
using Xunit;

namespace Planb.Reviews.Tests.ContentFilter;

/// <summary>
/// Unit tests puros (sin I/O) de <see cref="RegexReviewContentFilter"/>. Cubren las reglas de
/// PII (email, teléfono argentino, DNI) del <c>Evaluate</c>; la blacklist ya tiene cobertura en
/// otro punto de la suite (ver <c>EditReviewEndpointTests</c> en integration).
///
/// <para>
/// El regex de teléfono es deliberadamente amplio (ver comentario en la clase bajo test) y
/// solapa con el de DNI para corridas de dígitos sin separadores. Estos tests fijan el
/// comportamiento actual (qué reglas triggerea cada input), no lo "arreglan": si el regex
/// cambia, estos tests son la señal.
/// </para>
/// </summary>
public class RegexReviewContentFilterTests
{
    private static readonly RegexReviewContentFilter Filter = new();

    [Fact]
    public void Evaluate_returns_clean_for_benign_text_without_pii_or_blacklist_hits()
    {
        var result = Filter.Evaluate(
            "El profesor explica con mucha claridad y motiva a preguntar en cada clase.",
            null);

        result.Verdict.ShouldBe(ContentFilterVerdict.Clean);
        result.TriggeredRules.ShouldBeEmpty();
    }

    [Fact]
    public void Evaluate_triggers_pii_email_when_the_text_has_an_email_address()
    {
        var result = Filter.Evaluate(
            "Cualquier duda me pueden escribir a maria.gomez@fi.uba.ar antes del final.",
            null);

        result.Verdict.ShouldBe(ContentFilterVerdict.Triggered);
        result.TriggeredRules.ShouldBe(["pii:email"]);
    }

    [Fact]
    public void Evaluate_triggers_pii_phone_for_an_argentine_phone_number_with_separators()
    {
        // Área + número con espacio y guión: matchea el patrón de teléfono, no el de DNI (que
        // no admite espacios/guiones entre grupos, solo puntos opcionales).
        var result = Filter.Evaluate(
            "Mi número para consultas es 11 4567-8901, llamar de tarde.",
            null);

        result.Verdict.ShouldBe(ContentFilterVerdict.Triggered);
        result.TriggeredRules.ShouldBe(["pii:phone"]);
    }

    [Fact]
    public void Evaluate_triggers_pii_dni_for_a_dotted_eight_digit_number()
    {
        // Con puntos como separador de miles: el patrón de teléfono no lo matchea (no admite
        // puntos entre grupos), así que acá solo dispara la regla de DNI.
        var result = Filter.Evaluate(
            "Mi DNI es 30.123.456 por si necesitan validarlo.",
            null);

        result.Verdict.ShouldBe(ContentFilterVerdict.Triggered);
        result.TriggeredRules.ShouldBe(["pii:dni"]);
    }

    [Fact]
    public void Evaluate_triggers_both_pii_dni_and_pii_phone_for_a_plain_eight_digit_run()
    {
        // Documenta el solapamiento actual: una corrida de 8 dígitos sin separadores matchea
        // el patrón de DNI (2+3+3 dígitos) y también el de teléfono (4+4 dígitos, área
        // ausente). No es un bug a arreglar acá, es el comportamiento vigente del regex.
        var result = Filter.Evaluate(
            "Mi DNI es 30123456 nomás, sin puntos.",
            null);

        result.Verdict.ShouldBe(ContentFilterVerdict.Triggered);
        result.TriggeredRules.ShouldBe(["pii:phone", "pii:dni"]);
    }
}
