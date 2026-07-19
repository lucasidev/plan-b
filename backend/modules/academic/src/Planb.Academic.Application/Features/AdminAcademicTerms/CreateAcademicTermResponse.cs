namespace Planb.Academic.Application.Features.AdminAcademicTerms;

/// <summary>Id del período lectivo recién creado. El frontend refetchea la lista (ADR-0046).</summary>
public sealed record CreateAcademicTermResponse(Guid Id);
