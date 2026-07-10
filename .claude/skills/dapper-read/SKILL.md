---
name: dapper-read
description: Guía para escribir un read con Dapper en el backend de planb (queries de lectura cross-schema o complejas que no pasan por EF Core). Usalo cuando necesites LEER datos, sobre todo si cruzan schemas de varios módulos o son proyecciones/joins que con EF serían pesados. Los writes y la lógica de dominio NO van acá: para eso, slice-backend. Dapper es solo para reads.
---

Escribís un read con Dapper. En planb los writes van por EF Core (dominio + outbox), pero los reads complejos o cross-schema van por Dapper: un query service en Infrastructure que mapea el resultado a un DTO plano. Más rápido y sin arrastrar el modelo de dominio a una proyección de lectura.

## Ejemplo canónico

`ListUniversitiesAsync` en el módulo academic:

- **El DTO** (proyección de lectura, `record` plano): `academic/.../Application/Contracts/UniversityListItem.cs`
  ```csharp
  public sealed record UniversityListItem(Guid Id, string Name, string Slug);
  ```
- **El query service** (Infrastructure, abre su propia conexión Npgsql): `academic/.../Infrastructure/Reading/DapperAcademicQueryService.cs`
  ```csharp
  const string sql = @"
      SELECT id AS Id, name AS Name, slug AS Slug
      FROM academic.universities
      ORDER BY name ASC;";
  using IDbConnection db = new NpgsqlConnection(_connectionString);
  var rows = await db.QueryAsync<UniversityListItem>(
      new CommandDefinition(sql, cancellationToken: ct));
  return rows.AsList();
  ```

## Reglas

- **SQL con alias explícitos** (`id AS Id`) que matcheen las props del record: Dapper mapea por nombre. Record posicional o con `{ get; init; }`, cualquiera mapea si los nombres coinciden.
- **Schema calificado en el FROM** (`academic.universities`, `reviews.reviews`): el read PUEDE cruzar schemas de varios módulos, esa es la razón de usar Dapper acá. Es lectura explícita, no viola persistence ignorance: no hay FK ni navigation, es un SELECT.
- **`CommandDefinition` con el `CancellationToken`** siempre.
- **Parámetros siempre parametrizados** (`WHERE id = @Id` con `new { Id }`), nunca interpoles strings en el SQL: inyección.
- El query service vive en `Infrastructure/Reading/` y expone una interfaz del lado Application (Contracts/Abstractions): el consumidor depende de la interfaz, no de Dapper.

## Al terminar

Verificá con `dotnet build Planb.sln` (o delegá al subagente `test-runner`). Los reads cross-schema conviene cubrirlos con un integration test contra la DB real.
