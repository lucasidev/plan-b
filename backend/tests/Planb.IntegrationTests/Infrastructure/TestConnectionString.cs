namespace Planb.IntegrationTests.Infrastructure;

/// <summary>
/// Resolves the admin Postgres connection string for integration tests.
///
/// Precedence:
/// 1. <c>INTEGRATION_TEST_PG_CONNECTION</c> env var: explicit override (e.g. for a CI job that
///    targets a different Postgres than the local default).
/// 2. <c>ConnectionStrings__Planb</c> env var: set by <c>just</c> recipes and by the GitHub
///    Actions workflow.
/// 3. The root <c>.env</c> file, loaded via DotNetEnv as a fallback.
///
/// Punto 3: sin <c>just</c> las vars del .env no están en el entorno del proceso de test, así que
/// lo cargamos nosotros. Es el mismo mecanismo que usa el Api en <c>Program.cs</c> (DotNetEnv), y
/// existe por una razón concreta: el connection string es <c>Host=...;Port=...;...</c> y los ';'
/// sin comillas rompen un <c>source .env</c> de bash (parte la línea en varios comandos). DotNetEnv
/// parsea el archivo entero, no lo interpreta como shell, así que el valor llega completo. Correr
/// los tests con <c>dotnet test</c> a secas queda al mismo nivel que <c>just backend-test</c>.
///
/// Si no resuelve nada, lanza con un mensaje accionable en vez de caer a un valor hardcodeado. Un
/// fallback silencioso disfraza runs mal configurados como errores crípticos de Postgres, y
/// preferimos fallar fuerte apenas se construye un fixture.
/// </summary>
internal static class TestConnectionString
{
    public static string Resolve()
    {
        var value = ReadFromEnvironment();
        if (!string.IsNullOrWhiteSpace(value))
        {
            return value;
        }

        // Fallback: cargar el .env de la raíz. No pisa lo que ya esté en el entorno (just / CI),
        // solo completa lo que falta, así que la precedencia de arriba se mantiene.
        TryLoadDotEnv();

        value = ReadFromEnvironment();
        if (!string.IsNullOrWhiteSpace(value))
        {
            return value;
        }

        throw new InvalidOperationException(
            "Integration tests require a Postgres connection string. " +
            "Set ConnectionStrings__Planb (or run `just backend-test`), point " +
            "INTEGRATION_TEST_PG_CONNECTION at a custom server, or make sure the root .env exists.");
    }

    private static string? ReadFromEnvironment() =>
        Environment.GetEnvironmentVariable("INTEGRATION_TEST_PG_CONNECTION")
        ?? Environment.GetEnvironmentVariable("ConnectionStrings__Planb");

    private static void TryLoadDotEnv()
    {
        // TraversePath sube por el árbol de directorios hasta encontrar el .env, igual que el Api:
        // el cwd del runner de tests es el bin del proyecto, no la raíz del repo.
        DotNetEnv.Env.TraversePath().Load();
    }
}
