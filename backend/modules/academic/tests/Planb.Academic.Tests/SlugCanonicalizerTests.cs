using Planb.Academic.Domain;
using Shouldly;
using Xunit;

namespace Planb.Academic.Tests;

/// <summary>
/// Unit tests de <see cref="SlugCanonicalizer"/>. El caso que motiva la clase entera es
/// <see cref="Canonicalize_AccentedFreeTextAndPlainAdminSlug_ProduceTheSameCanonicalForm"/>: sin
/// remover acentos, "Ingeniería en Sistemas" (lo que tipea un alumno) y "ingenieria-en-sistemas"
/// (lo que carga un admin) nunca matcheaban, y el catálogo terminaba con la carrera duplicada.
/// </summary>
public class SlugCanonicalizerTests
{
    [Fact]
    public void Canonicalize_RemovesAccents()
    {
        SlugCanonicalizer.Canonicalize("Ingeniería").ShouldBe("ingenieria");
    }

    [Fact]
    public void Canonicalize_RemovesTilde()
    {
        SlugCanonicalizer.Canonicalize("Diseño").ShouldBe("diseno");
    }

    [Fact]
    public void Canonicalize_TrimsAndLowercases()
    {
        SlugCanonicalizer.Canonicalize("  TUDCS  ").ShouldBe("tudcs");
    }

    [Fact]
    public void Canonicalize_CollapsesWhitespaceIntoHyphen()
    {
        SlugCanonicalizer.Canonicalize("Ingeniería en Sistemas").ShouldBe("ingenieria-en-sistemas");
    }

    [Fact]
    public void Canonicalize_CollapsesMultipleSpacesIntoASingleHyphen()
    {
        SlugCanonicalizer.Canonicalize("Ingeniería   en    Sistemas").ShouldBe("ingenieria-en-sistemas");
    }

    [Fact]
    public void Canonicalize_AlreadyCanonicalSlug_IsIdempotent()
    {
        SlugCanonicalizer.Canonicalize("ingenieria-en-sistemas").ShouldBe("ingenieria-en-sistemas");
    }

    /// <summary>
    /// El bug que esta clase existe para cerrar: el approve del import (nombre libre, con acentos) y
    /// el alta del backoffice (slug tipeado, sin acentos) tienen que resolver a la misma forma.
    /// </summary>
    [Fact]
    public void Canonicalize_AccentedFreeTextAndPlainAdminSlug_ProduceTheSameCanonicalForm()
    {
        var fromImportedCareerName = SlugCanonicalizer.Canonicalize("Ingeniería en Sistemas");
        var fromAdminTypedSlug = SlugCanonicalizer.Canonicalize("ingenieria-en-sistemas");

        fromImportedCareerName.ShouldBe(fromAdminTypedSlug);
    }
}
