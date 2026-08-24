namespace Planb.Identity.Application.Features.RegisterUser;

/// <summary>
/// Sin id a proposito: la respuesta es identica exista o no la cuenta (ADR-0076), y un id
/// solo del lado "cuenta nueva" la volvia distinguible. El cliente no necesita nada mas que
/// saber a que casilla mirar.
/// </summary>
public sealed record RegisterUserResponse(string Email);
