namespace Planb.Reviews.Application.Features.Curation;

/// <summary>Lo que deja publicar una nota: su id, para poder retirarla, y cuándo se publicó.</summary>
public sealed record PublishEditorialNoteResponse(Guid Id, DateTimeOffset PublishedAt);
