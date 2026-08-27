using Planb.Reviews.Application.Abstractions.Persistence;
using Planb.Reviews.Domain.CourseReviews;
using Planb.SharedKernel.Primitives;

namespace Planb.Reviews.Application.Features.DeleteCourseReview;

/// <summary>
/// Borrar una reseña de cursada propia (US-165, US-166).
///
/// <para>
/// Es borrado real y no un soft delete: lo que se borra tiene que dejar de contar, y una fila
/// marcada como borrada que sigue en la tabla es una promesa a medias. Los conteos de la ficha se
/// calculan al leerla, así que borrar los mueve hacia atrás en la siguiente lectura, sin
/// recalcular nada.
/// </para>
///
/// <para>
/// Es también el mecanismo que la pantalla de baja de cuenta ya promete con esas palabras: quien
/// quiere sacar algo lo borra ANTES, de a uno. La baja anonimiza la identidad y deja publicado lo
/// que quedó aportado (ADR-0044), así que sin esto esa frase era falsa.
/// </para>
/// </summary>
public static class DeleteCourseReviewCommandHandler
{
    public static async Task<Result> Handle(
        DeleteCourseReviewCommand command,
        ICourseReviewRepository reviews,
        IReviewsUnitOfWork unitOfWork,
        CancellationToken ct)
    {
        var review = await reviews.GetByIdAsync(new CourseReviewId(command.ReviewId), ct);
        if (review is null)
        {
            return CourseReviewErrors.NotFound;
        }

        // Una reseña ajena responde igual que una inexistente: confirmar que existe sería decir
        // que alguien reseñó esa cursada.
        if (!review.IsAuthoredBy(command.UserId))
        {
            return CourseReviewErrors.NotFound;
        }

        reviews.Remove(review);
        await unitOfWork.SaveChangesAsync(ct);

        return Result.Success();
    }
}
