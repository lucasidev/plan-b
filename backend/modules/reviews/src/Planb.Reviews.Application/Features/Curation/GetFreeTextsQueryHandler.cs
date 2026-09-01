using Planb.Academic.Application.Contracts;
using Planb.Reviews.Application.Abstractions.Persistence;

namespace Planb.Reviews.Application.Features.Curation;

/// <summary>
/// Los textos libres con su contexto, para leerlos (ADR-0084).
///
/// <para>
/// El read devuelve ids y este handler compone los nombres con una sola llamada al contrato de
/// academic (ADR-0087): pedirlos fila por fila sería un N+1 por red, y leerlos de sus tablas ataría
/// la consulta a un esquema ajeno que ningún compilador chequea.
/// </para>
/// </summary>
public static class GetFreeTextsQueryHandler
{
    /// <summary>Lo que se muestra cuando el catálogo no tiene el id que la reseña guardó.</summary>
    private const string Unknown = "Sin vincular";

    public static async Task<FreeTextsView> Handle(
        int skip,
        int take,
        IFreeTextQueryService freeTexts,
        IAcademicQueryService academic,
        CancellationToken ct)
    {
        var page = await freeTexts.ListAsync(skip, take, ct);
        if (page.Items.Count == 0)
        {
            return new FreeTextsView([], page.Total);
        }

        var labels = await academic.GetLabelsAsync(
            page.Items.Select(t => t.SubjectId).Distinct().ToArray(),
            page.Items.Select(t => t.TermId).Distinct().ToArray(),
            page.Items.Where(t => t.ChairId is not null).Select(t => t.ChairId!.Value).Distinct().ToArray(),
            ct);

        var items = page.Items
            .Select(t => new FreeTextView(
                t.ReviewId,
                labels.Subjects.GetValueOrDefault(t.SubjectId)?.Name ?? Unknown,
                labels.Terms.GetValueOrDefault(t.TermId) ?? Unknown,
                t.ChairId is null ? null : labels.Chairs.GetValueOrDefault(t.ChairId.Value),
                t.Text,
                t.WrittenAt))
            .ToList();

        return new FreeTextsView(items, page.Total);
    }
}

/// <summary>Una tanda de textos, con el total para saber cuánto queda por leer.</summary>
public sealed record FreeTextsView(IReadOnlyList<FreeTextView> Items, int Total);

/// <summary>
/// Un texto con lo que hace falta para leerlo bien: de qué cursada salió. <b>Nada de quién lo
/// escribió</b>: el id que viaja es el de la reseña, y sirve para volver a encontrarla, no para
/// llegar a una persona.
/// </summary>
public sealed record FreeTextView(
    Guid ReviewId,
    string SubjectName,
    string TermLabel,
    string? ChairName,
    string Text,
    DateTimeOffset WrittenAt);
