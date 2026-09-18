# syntax=docker/dockerfile:1

FROM mcr.microsoft.com/dotnet/sdk:10.0@sha256:4ea6fe75dd36706bb6d8c3c293d4c4315840f5d76ea28ac97def77e3ec487fa5 AS build
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

FROM mcr.microsoft.com/dotnet/aspnet:10.0@sha256:3a494b8a73ec3248c237c9438592ff1e04587edf65863212bc1027e54dcb6f36 AS runtime
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

# GIT_SHA llega como build-arg desde el workflow; PLANB_VERSION es lo que expone GET /health.
ARG GIT_SHA=dev
ENV PLANB_VERSION=${GIT_SHA}

COPY --from=build --chown=app:app /app/publish .

# La imagen base trae el usuario no root "app": correr con él limita lo que un RCE puede tocar.
# El healthcheck pega GET /health por el socket crudo (esta imagen no trae curl ni wget) y espera 200 OK.
USER app
HEALTHCHECK --interval=10s --timeout=5s --start-period=60s --retries=12 CMD bash -c "exec 3<>/dev/tcp/127.0.0.1/8080 && printf 'GET /health HTTP/1.0\r\nHost: localhost\r\n\r\n' >&3 && grep -q '200 OK' <&3"

ENTRYPOINT ["dotnet", "Planb.Api.dll"]
