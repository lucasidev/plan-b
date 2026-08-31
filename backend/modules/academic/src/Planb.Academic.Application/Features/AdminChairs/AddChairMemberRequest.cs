namespace Planb.Academic.Application.Features.AdminChairs;

/// <summary>
/// Body de sumar un integrante. El rol viaja como <b>string</b> y no como el enum: bindearlo
/// directo hace que un valor inválido reviente en el deserializador, antes de llegar a la
/// validación, y salga como 500 en vez de como el 400 que corresponde.
/// </summary>
public sealed record AddChairMemberRequest(Guid TeacherId, string Role, Guid SinceTermId);
