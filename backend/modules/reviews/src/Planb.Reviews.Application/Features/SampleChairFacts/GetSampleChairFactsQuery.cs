namespace Planb.Reviews.Application.Features.SampleChairFacts;

/// <summary>
/// Pide la ficha de la muestra de la entrada (US-221): una cátedra al azar entre las que ya
/// publican. Sin parámetros a propósito: quien la pide no elige cuál le toca, que es lo único que
/// hace honesta a una muestra.
/// </summary>
public sealed record GetSampleChairFactsQuery;
