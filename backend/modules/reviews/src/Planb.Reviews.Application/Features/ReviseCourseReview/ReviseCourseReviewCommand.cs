namespace Planb.Reviews.Application.Features.ReviseCourseReview;

/// <summary>
/// Corregir una reseña propia. La cuenta sale del token: nadie edita la reseña de otro.
///
/// <para>
/// <see cref="Answers"/> es el set COMPLETO de lo que queda respondido, no un delta. Un delta no
/// puede expresar "esto ya no lo quiero contestar", que es la mitad de por qué alguien edita.
/// </para>
/// </summary>
public sealed record ReviseCourseReviewCommand(
    Guid UserId,
    Guid ReviewId,
    IReadOnlyList<ReviseAnswerInput> Answers,
    string? FreeText);

/// <summary>Una respuesta que queda: el código del ítem y el valor de la opción elegida.</summary>
public sealed record ReviseAnswerInput(string ItemCode, short OptionValue);
