namespace Planb.Reviews.Application.Features.PublishReview;

/// <summary>
/// Publica la reseña de una cursada (US-146, ADR-0082): el acto principal del producto.
///
/// <para>
/// El <see cref="UserId"/> lo extrae el endpoint del JWT (claim <c>sub</c>) y lo pasa explícito:
/// nadie reseña en nombre de otro.
/// </para>
///
/// <para>
/// Las respuestas vienen como pares (código de frase, valor de opción). Se manda el <b>código</b> y
/// no el id porque es la identidad semántica y estable de la frase, que es lo que el front lee del
/// cuestionario. Lo salteado simplemente no viene en la lista: no hay un "no dijo" que mandar,
/// porque no cuenta en ningún denominador.
/// </para>
/// </summary>
public sealed record PublishReviewCommand(
    Guid UserId,
    Guid SubjectId,
    Guid TermId,
    Guid? ChairId,
    IReadOnlyList<ReviewAnswerInput> Answers,
    string? FreeText);

/// <summary>Una respuesta: el código de la frase y el valor de la opción elegida.</summary>
public sealed record ReviewAnswerInput(string ItemCode, short OptionValue);
