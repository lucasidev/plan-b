using FluentValidation;

namespace Planb.Identity.Application.Features.UpdateMySettings;

/// <summary>
/// Valida que el PATCH traiga al menos un campo no-null. El parseo de strings a enums se hace
/// en el endpoint antes de construir el command (con response 400 ValidationProblem si el
/// string no matchea ningún enum value).
/// </summary>
internal sealed class UpdateMySettingsValidator : AbstractValidator<UpdateMySettingsCommand>
{
    public UpdateMySettingsValidator()
    {
        RuleFor(c => c.UserId.Value).NotEmpty();

        RuleFor(c => c).Must(HasAtLeastOneField)
            .WithMessage("PATCH must include at least one setting to update.")
            .WithName("body");
    }

    private static bool HasAtLeastOneField(UpdateMySettingsCommand c) =>
        c.NotificationsInApp.HasValue
        || c.NotificationsEmail.HasValue
        || c.NotifyReviewResponse.HasValue
        || c.NotifyNewReviewInFollowed.HasValue
        || c.NotifyAcademicCalendar.HasValue
        || c.NotifyDraftPromotionNudge.HasValue
        || c.ShowDisplayNameInReviews.HasValue
        || c.AllowTeacherContact.HasValue
        || c.Language.HasValue
        || c.Theme.HasValue;
}
