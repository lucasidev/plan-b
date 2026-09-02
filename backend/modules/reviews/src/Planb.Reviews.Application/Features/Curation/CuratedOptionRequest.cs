namespace Planb.Reviews.Application.Features.Curation;

/// <summary>
/// Una opción tal como llega del backoffice. La valencia viaja como string y la parsea el endpoint:
/// un enum no bindea directo desde JSON, y un typo saldría como 500 en vez del 400 que corresponde.
/// </summary>
public sealed record CuratedOptionRequest(short Value, short Order, string Label, string Valence);
