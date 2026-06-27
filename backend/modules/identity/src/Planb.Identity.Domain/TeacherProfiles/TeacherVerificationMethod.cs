namespace Planb.Identity.Domain.TeacherProfiles;

/// <summary>
/// Cómo se verificó (o se está verificando) un <see cref="TeacherProfile"/>. Se persiste como
/// string. <see cref="InstitutionalEmail"/> es el self-service de US-031; <see cref="Manual"/> es la
/// aprobación del admin (UC-066, todavía sin endpoint). El estado conceptual del profile se deriva
/// de la combinación de este campo + <c>verified_at</c> (ver verification-flows.md), no de un enum
/// de status dedicado.
/// </summary>
public enum TeacherVerificationMethod
{
    InstitutionalEmail,
    Manual,
}
