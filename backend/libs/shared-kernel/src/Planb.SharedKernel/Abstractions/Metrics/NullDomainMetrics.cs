namespace Planb.SharedKernel.Abstractions.Metrics;

/// <summary>
/// Implementación nula de <see cref="IDomainMetrics"/>: no cuenta nada. Para handler unit tests que
/// necesitan el parámetro resuelto pero no verifican qué se contó, evita armar un
/// <c>Substitute.For&lt;IDomainMetrics&gt;()</c> por cada uno.
/// </summary>
public sealed class NullDomainMetrics : IDomainMetrics
{
    public void ReviewPublished(string instrumentCode)
    {
    }

    public void ChairFactsComputed(bool published)
    {
    }

    public void SignInAttempt(bool succeeded)
    {
    }

    public void EditorialNotePublished()
    {
    }
}
