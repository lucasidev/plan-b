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
