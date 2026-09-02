namespace Planb.Reviews.Application.Features.Curation;

/// <summary>
/// El corte, dicho con los dos códigos: el que arranca y el que se retira. Y la versión nueva del
/// cuestionario, que es la fecha del corte en el vocabulario del instrumento.
/// </summary>
public sealed record SupersedeItemResponse(
    Guid ItemId,
    string Code,
    string SupersededCode,
    short InstrumentVersion);
