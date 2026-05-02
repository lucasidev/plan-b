using Microsoft.Extensions.DependencyInjection;

namespace Planb.Academic.Application;

public static class DependencyInjection
{
    /// <summary>
    /// Wires Academic application services. La interface IAcademicQueryService se registra
    /// desde Infrastructure. Wolverine descubre handlers via
    /// opts.Discovery.IncludeAssembly(typeof(DependencyInjection).Assembly) en el host.
    /// </summary>
    public static IServiceCollection AddAcademicApplication(this IServiceCollection services)
    {
        return services;
    }
}
