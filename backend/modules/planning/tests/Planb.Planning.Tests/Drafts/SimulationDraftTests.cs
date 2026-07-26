using Planb.Planning.Domain.Drafts;
using Shouldly;
using Xunit;

namespace Planb.Planning.Tests.Drafts;

public class SimulationDraftTests
{
    private static readonly Guid AnyOwner = Guid.NewGuid();
    private static readonly Guid AnyTerm = Guid.NewGuid();
    private static readonly Guid Subject1 = Guid.NewGuid();
    private static readonly Guid Subject2 = Guid.NewGuid();
    private static readonly FixedClock Clock = new(
        new DateTimeOffset(2026, 3, 1, 12, 0, 0, TimeSpan.Zero));

    private static (Guid SubjectId, Guid? CommissionId) Item(Guid subjectId, Guid? commissionId = null) =>
        (subjectId, commissionId);

    private static SimulationDraft CreateValid() =>
        SimulationDraft.Create(AnyOwner, AnyTerm, "Plan A", [Item(Subject1)], Clock).Value;

    // -------------------------------------------------------------------
    // Create
    // -------------------------------------------------------------------

    [Fact]
    public void Create_HappyPath_StartsAsPrivateDraft()
    {
        var commissionId = Guid.NewGuid();

        var result = SimulationDraft.Create(
            AnyOwner, AnyTerm, "  Cuatri de prueba  ",
            [Item(Subject1), Item(Subject2, commissionId)], Clock);

        result.IsSuccess.ShouldBeTrue();
        var draft = result.Value;
        draft.OwnerProfileId.ShouldBe(AnyOwner);
        draft.TermId.ShouldBe(AnyTerm);
        draft.Label.ShouldBe("Cuatri de prueba"); // trim
        draft.Status.ShouldBe(SimulationDraftStatus.Draft);
        draft.Visibility.ShouldBe(SimulationVisibility.Private);
        draft.SharedAt.ShouldBeNull();
        draft.Items.Count.ShouldBe(2);
        draft.Items.ShouldContain(i => i.SubjectId == Subject2 && i.CommissionId == commissionId);
        draft.CreatedAt.ShouldBe(Clock.UtcNow);
        draft.UpdatedAt.ShouldBe(Clock.UtcNow);
    }

    [Fact]
    public void Create_BlankLabel_StoredAsNull()
    {
        var draft = SimulationDraft.Create(AnyOwner, AnyTerm, "   ", [Item(Subject1)], Clock).Value;

        draft.Label.ShouldBeNull();
    }

    [Fact]
    public void Create_NullLabel_Allowed()
    {
        var result = SimulationDraft.Create(AnyOwner, AnyTerm, null, [Item(Subject1)], Clock);

        result.IsSuccess.ShouldBeTrue();
        result.Value.Label.ShouldBeNull();
    }

    [Fact]
    public void Create_EmptyItems_ReturnsError()
    {
        var result = SimulationDraft.Create(AnyOwner, AnyTerm, "A", [], Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(SimulationDraftErrors.ItemsRequired);
    }

    [Fact]
    public void Create_DuplicateSubject_ReturnsError()
    {
        var result = SimulationDraft.Create(
            AnyOwner, AnyTerm, "A", [Item(Subject1), Item(Subject1)], Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(SimulationDraftErrors.DuplicateSubject);
    }

    [Fact]
    public void Create_LabelTooLong_ReturnsError()
    {
        var longLabel = new string('a', SimulationDraft.MaxLabelLength + 1);

        var result = SimulationDraft.Create(AnyOwner, AnyTerm, longLabel, [Item(Subject1)], Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(SimulationDraftErrors.LabelTooLong);
    }

    // -------------------------------------------------------------------
    // Update (reemplazo atómico)
    // -------------------------------------------------------------------

    [Fact]
    public void Update_Valid_ReplacesLabelAndItemsAndBumpsUpdatedAt()
    {
        var draft = CreateValid();
        var later = new FixedClock(Clock.UtcNow.AddDays(1));
        var newCommission = Guid.NewGuid();

        var result = draft.Update("Nuevo label", [Item(Subject2, newCommission)], later);

        result.IsSuccess.ShouldBeTrue();
        draft.Label.ShouldBe("Nuevo label");
        draft.Items.Count.ShouldBe(1);
        draft.Items[0].SubjectId.ShouldBe(Subject2);
        draft.Items[0].CommissionId.ShouldBe(newCommission);
        draft.UpdatedAt.ShouldBe(later.UtcNow);
    }

    [Fact]
    public void Update_EmptyItems_LeavesAggregateUnchanged()
    {
        var draft = CreateValid(); // Label "Plan A", Items = [Subject1]

        var result = draft.Update("Nuevo label", [], Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(SimulationDraftErrors.ItemsRequired);
        draft.Label.ShouldBe("Plan A");
        draft.Items.Count.ShouldBe(1);
        draft.Items[0].SubjectId.ShouldBe(Subject1);
    }

    [Fact]
    public void Update_DuplicateSubject_LeavesAggregateUnchanged()
    {
        var draft = CreateValid();

        var result = draft.Update("Nuevo label", [Item(Subject2), Item(Subject2)], Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(SimulationDraftErrors.DuplicateSubject);
        draft.Label.ShouldBe("Plan A");
        draft.Items.Count.ShouldBe(1);
        draft.Items[0].SubjectId.ShouldBe(Subject1);
    }

    [Fact]
    public void Update_LabelTooLong_LeavesAggregateUnchanged()
    {
        var draft = CreateValid();
        var longLabel = new string('a', SimulationDraft.MaxLabelLength + 1);

        var result = draft.Update(longLabel, [Item(Subject2)], Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(SimulationDraftErrors.LabelTooLong);
        draft.Label.ShouldBe("Plan A");
        draft.Items.Count.ShouldBe(1);
        draft.Items[0].SubjectId.ShouldBe(Subject1);
    }

    // -------------------------------------------------------------------
    // Promote
    // -------------------------------------------------------------------

    [Fact]
    public void Promote_FromDraft_SetsActive()
    {
        var draft = CreateValid();
        var later = new FixedClock(Clock.UtcNow.AddDays(1));

        var result = draft.Promote(later);

        result.IsSuccess.ShouldBeTrue();
        draft.Status.ShouldBe(SimulationDraftStatus.Active);
        draft.UpdatedAt.ShouldBe(later.UtcNow);
    }

    [Fact]
    public void Promote_AlreadyActive_ReturnsError()
    {
        var draft = CreateValid();
        draft.Promote(Clock);

        var result = draft.Promote(Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(SimulationDraftErrors.CannotPromote);
    }

    [Fact]
    public void Promote_FromArchived_ReturnsError()
    {
        var draft = CreateValid();
        draft.Promote(Clock);
        draft.Archive(Clock);

        var result = draft.Promote(Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(SimulationDraftErrors.CannotPromote);
        draft.Status.ShouldBe(SimulationDraftStatus.Archived);
    }

    // -------------------------------------------------------------------
    // Archive
    // -------------------------------------------------------------------

    [Fact]
    public void Archive_FromActive_SetsArchived()
    {
        var draft = CreateValid();
        draft.Promote(Clock);
        var later = new FixedClock(Clock.UtcNow.AddDays(1));

        var result = draft.Archive(later);

        result.IsSuccess.ShouldBeTrue();
        draft.Status.ShouldBe(SimulationDraftStatus.Archived);
        draft.UpdatedAt.ShouldBe(later.UtcNow);
    }

    [Fact]
    public void Archive_FromDraft_ReturnsError()
    {
        var draft = CreateValid();

        var result = draft.Archive(Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(SimulationDraftErrors.CannotArchive);
        draft.Status.ShouldBe(SimulationDraftStatus.Draft);
    }

    [Fact]
    public void Archive_AlreadyArchived_ReturnsError()
    {
        var draft = CreateValid();
        draft.Promote(Clock);
        draft.Archive(Clock);

        var result = draft.Archive(Clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(SimulationDraftErrors.CannotArchive);
    }

    // -------------------------------------------------------------------
    // Share / Unshare (US-024)
    // -------------------------------------------------------------------

    [Fact]
    public void Share_FromPrivate_SetsSharedAndStampsSharedAt()
    {
        var draft = CreateValid();
        var later = new FixedClock(Clock.UtcNow.AddDays(1));

        var result = draft.Share(later);

        result.IsSuccess.ShouldBeTrue();
        draft.Visibility.ShouldBe(SimulationVisibility.Shared);
        draft.SharedAt.ShouldBe(later.UtcNow);
        draft.UpdatedAt.ShouldBe(later.UtcNow);
    }

    [Fact]
    public void Share_AlreadyShared_IsIdempotentAndKeepsOriginalSharedAt()
    {
        var draft = CreateValid();
        var firstShareAt = new FixedClock(Clock.UtcNow.AddDays(1));
        draft.Share(firstShareAt);
        var secondShareAt = new FixedClock(Clock.UtcNow.AddDays(2));

        var result = draft.Share(secondShareAt);

        result.IsSuccess.ShouldBeTrue();
        draft.Visibility.ShouldBe(SimulationVisibility.Shared);
        // No revive la posición del borrador en el feed (shared_at DESC): un segundo share no
        // reestampa SharedAt con el clock más nuevo.
        draft.SharedAt.ShouldBe(firstShareAt.UtcNow);
        draft.UpdatedAt.ShouldBe(firstShareAt.UtcNow);
    }

    [Fact]
    public void Unshare_FromShared_SetsPrivateAndClearsSharedAt()
    {
        var draft = CreateValid();
        draft.Share(Clock);
        var later = new FixedClock(Clock.UtcNow.AddDays(1));

        var result = draft.Unshare(later);

        result.IsSuccess.ShouldBeTrue();
        draft.Visibility.ShouldBe(SimulationVisibility.Private);
        draft.SharedAt.ShouldBeNull();
        draft.UpdatedAt.ShouldBe(later.UtcNow);
    }

    [Fact]
    public void Unshare_AlreadyPrivate_IsIdempotentAndSucceeds()
    {
        var draft = CreateValid(); // nace Private

        var result = draft.Unshare(Clock);

        result.IsSuccess.ShouldBeTrue();
        draft.Visibility.ShouldBe(SimulationVisibility.Private);
        draft.SharedAt.ShouldBeNull();
    }

    [Fact]
    public void Share_then_unshare_then_share_again_keeps_visibility_and_shared_at_coherent()
    {
        var draft = CreateValid();
        var t1 = new FixedClock(Clock.UtcNow.AddDays(1));
        var t2 = new FixedClock(Clock.UtcNow.AddDays(2));
        var t3 = new FixedClock(Clock.UtcNow.AddDays(3));

        draft.Share(t1);
        draft.Visibility.ShouldBe(SimulationVisibility.Shared);
        draft.SharedAt.ShouldNotBeNull();

        draft.Unshare(t2);
        draft.Visibility.ShouldBe(SimulationVisibility.Private);
        draft.SharedAt.ShouldBeNull();

        draft.Share(t3);
        draft.Visibility.ShouldBe(SimulationVisibility.Shared);
        draft.SharedAt.ShouldBe(t3.UtcNow);
    }
}
