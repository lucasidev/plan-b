using FluentValidation;
using Microsoft.Extensions.DependencyInjection;

namespace Planb.Identity.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddIdentityApplication(this IServiceCollection services)
    {
        // FluentValidation discovers IValidator<T> implementations in this assembly. Wolverine's
        // FluentValidation integration consumes them as middleware before each command handler.
        services.AddValidatorsFromAssembly(typeof(DependencyInjection).Assembly);
        return services;
    }
}
