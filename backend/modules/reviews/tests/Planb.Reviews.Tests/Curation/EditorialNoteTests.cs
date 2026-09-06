using Planb.Reviews.Domain.Curation;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;
using Shouldly;
using Xunit;

namespace Planb.Reviews.Tests.Curation;

/// <summary>
/// Domain unit tests de <see cref="EditorialNote"/>, uno por cada regla de ADR-0084: cada test
/// intenta violarla y tiene que ver al dominio pararlo.
///
/// <para>
/// El nivel cátedra no tiene test propio porque no hace falta: la firma de
/// <see cref="EditorialNote.Publish"/> no recibe un <c>chairId</c>, así que una nota a nivel cátedra
/// ni siquiera es representable. El hecho estructural alcanza; no hay nada que un test pueda romper.
/// </para>
/// </summary>
public class EditorialNoteTests
{
    private static readonly DateTimeOffset T0 = new(2026, 9, 1, 12, 0, 0, TimeSpan.Zero);

    private sealed class FixedClock(DateTimeOffset now) : IDateTimeProvider
    {
        public DateTimeOffset UtcNow { get; } = now;
    }

    // Wrapper con `people` opcional: la mayoría de los tests de acá no le interesa el nombrado, así
    // que no repiten una lista vacía en cada llamado.
    private static Result<EditorialNote> Publish(
        Guid careerId,
        string text,
        IDateTimeProvider clock,
        IReadOnlyCollection<PersonName>? people = null) =>
        EditorialNote.Publish(careerId, text, people ?? [], clock);

    // ── Nivel: carrera obligatoria ────────────────────────────────────────

    [Fact]
    public void Publish_without_a_career_is_rejected()
    {
        var result = Publish(Guid.Empty, "Una síntesis.", new FixedClock(T0));

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(EditorialNoteErrors.CareerRequired);
    }

    // ── Fechada ───────────────────────────────────────────────────────────

    [Fact]
    public void Publish_stamps_PublishedAt_with_the_clock_it_receives()
    {
        var result = Publish(Guid.NewGuid(), "Una síntesis.", new FixedClock(T0));

        result.IsSuccess.ShouldBeTrue();
        result.Value.PublishedAt.ShouldBe(T0);
    }

    [Fact]
    public void Withdraw_stamps_WithdrawnAt_with_the_clock_it_receives()
    {
        var note = Publish(Guid.NewGuid(), "Una síntesis.", new FixedClock(T0)).Value;
        var withdrawnAt = T0.AddDays(3);

        var result = note.Withdraw(new FixedClock(withdrawnAt));

        result.IsSuccess.ShouldBeTrue();
        note.WithdrawnAt.ShouldBe(withdrawnAt);
    }

    // ── Texto ─────────────────────────────────────────────────────────────

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Publish_with_blank_text_is_rejected(string text)
    {
        var result = Publish(Guid.NewGuid(), text, new FixedClock(T0));

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(EditorialNoteErrors.TextRequired);
    }

    [Fact]
    public void Publish_with_text_over_the_max_length_is_rejected()
    {
        var text = new string('a', EditorialNote.MaxTextLength + 1);

        var result = Publish(Guid.NewGuid(), text, new FixedClock(T0));

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(EditorialNoteErrors.TextTooLong);
    }

    [Fact]
    public void Publish_with_text_at_exactly_the_max_length_is_accepted()
    {
        var text = new string('a', EditorialNote.MaxTextLength);

        var result = Publish(Guid.NewGuid(), text, new FixedClock(T0));

        result.IsSuccess.ShouldBeTrue();
        result.Value.Text.Length.ShouldBe(EditorialNote.MaxTextLength);
    }

    // ── Retiro ────────────────────────────────────────────────────────────

    [Fact]
    public void Withdraw_twice_fails_the_second_time_and_keeps_the_first_date()
    {
        var note = Publish(Guid.NewGuid(), "Una síntesis.", new FixedClock(T0)).Value;
        note.Withdraw(new FixedClock(T0.AddDays(1)));
        var firstWithdrawnAt = note.WithdrawnAt;

        var second = note.Withdraw(new FixedClock(T0.AddDays(2)));

        second.IsFailure.ShouldBeTrue();
        second.Error.ShouldBe(EditorialNoteErrors.AlreadyWithdrawn);
        note.WithdrawnAt.ShouldBe(firstWithdrawnAt);
    }

    // ── Sin nombres ──────────────────────────────────────────────────────

    /// <summary>
    /// ADR-0084: una nota que nombra a alguien del catálogo de docentes se rechaza. El código es la
    /// clave estable; el mensaje trae el nombre completo para que quien cura sepa a quién reescribir.
    /// </summary>
    [Fact]
    public void Publish_with_a_named_person_in_the_text_is_rejected()
    {
        var result = Publish(
            Guid.NewGuid(),
            "La cátedra de Martín Pérez no responde nunca.",
            new FixedClock(T0),
            people: [new PersonName("Martín", "Pérez")]);

        result.IsFailure.ShouldBeTrue();
        result.Error.Code.ShouldBe("reviews.editorial_note.names_a_person");
        result.Error.Message.ShouldContain("Martín Pérez");
    }
}
