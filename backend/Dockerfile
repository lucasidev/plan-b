# syntax=docker/dockerfile:1

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy csproj files and restore (for layer caching)
COPY ["backend/global.json", "global.json"]
COPY ["backend/nuget.config", "nuget.config"]
COPY ["backend/Directory.Build.props", "Directory.Build.props"]
COPY ["backend/Directory.Packages.props", "Directory.Packages.props"]
COPY ["backend/Planb.sln", "Planb.sln"]

# Copy all csproj files preserving structure
COPY ["backend/libs/", "libs/"]
COPY ["backend/host/", "host/"]
COPY ["backend/modules/", "modules/"]
COPY ["backend/tests/", "tests/"]

RUN dotnet restore "Planb.sln"

# Wolverine genera el código de sus handlers. En Production el host arranca con
# GeneratedCodeMode=Static y AssertAllPreGeneratedTypesExist=true, o sea que espera encontrarlo ya
# compilado y NO ARRANCA si falta un solo tipo. Este paso es el que lo produce; sin él la imagen
# construye igual y después no levanta.
#
# Las tres variables son las que el host exige para construirse (connection strings + secreto de
# JWT). Los valores son basura a propósito: codegen no abre ninguna conexión, solo arma el
# contenedor de DI y recorre los handlers. Está verificado que corre con un host de base inexistente.
ENV ASPNETCORE_ENVIRONMENT=Production \
    ConnectionStrings__Planb="Host=codegen;Database=planb;Username=planb;Password=codegen" \
    ConnectionStrings__Redis="codegen:6379" \
    JWT__Secret="codegen-only-not-a-secret-0123456789abcdef"

RUN dotnet run --project "host/Planb.Api/Planb.Api.csproj" \
    --configuration Release \
    --no-launch-profile \
    -- codegen write

# Build and publish
RUN dotnet publish "host/Planb.Api/Planb.Api.csproj" \
    --configuration Release \
    --output /app/publish \
    --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "Planb.Api.dll"]
