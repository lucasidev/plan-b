namespace Planb.Academic.Application.Features.AdminAcademicTerms;

/// <summary>Id del período lectivo editado. El frontend refetchea la lista (ADR-0046).</summary>
public sealed record UpdateAcademicTermResponse(Guid Id);
