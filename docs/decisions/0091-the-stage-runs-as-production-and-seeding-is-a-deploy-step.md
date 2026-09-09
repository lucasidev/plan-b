# ADR-0091: The stage runs as production and seeding is a deploy step

- **Estado**: aceptado
- **Fecha**: 2026-09-08

## Contexto

`docker-compose.stage.yml` corre el `api` con `ASPNETCORE_ENVIRONMENT=Development`. No es solo un nombre: activa el bloque `CritterStackDefaults` de Wolverine en `Program.cs` (`x.Development.GeneratedCodeMode = TypeLoadMode.Dynamic`, `x.Development.ResourceAutoCreate = AutoCreate.CreateOrUpdate`), habilita `DevMigrationsHostedService` y los cuatro `*SeedHostedService` (gateados por `IsDevelopment()`), y sube el log a Debug (`appsettings.Development.json`). El stage solo necesita dos de esas cosas (que algo migre y siembre solo, y con datos de prueba); las otras dos causaron dos incidentes el mismo día:

1. **Codegen en runtime.** En `Dynamic`, Wolverine compila con Roslyn el handler de cada tipo de mensaje la primera vez que se invoca. El backend tiene 87 endpoints Carter, cada uno dispara su propio `IMessageBus.InvokeAsync`, así que cada uno paga su propia compilación la primera vez que alguien lo visita. Medido contra la imagen real del stage (`main`, sin cambios) sobre podman: sin `mem_limit`, el proceso queda en 921 a 925 MB tras ejercitar ~45 endpoints; con el `mem_limit: 768m` real del compose llegó al 98 % de uso; con un límite de 400m (para acelerar el mismo mecanismo) se cayó con `OOMKilled: true` exactamente en `POST /api/academic/chairs/{id}/members`, el endpoint que más dependencias inyecta (7) y por lo tanto el más caro de generar. En producción esto no puede pasar: ahí `GeneratedCodeMode = Static` y la imagen ya trae el código pregenerado (`backend/Dockerfile`, el paso `codegen write` antes del `publish`).
2. **Nivel de log en Debug.** Con el healthcheck pegándole a `/health` cada 10 segundos, esas líneas se comían la ventana de diagnóstico antes de que el log rotara (`max-file: "3"`).

El stage rompía de maneras que producción no puede romper, y no ensayaba lo que sí se va a desplegar.

## Decisión

**El stage se trata como producción. La única ficción son las personas sembradas y sus reseñas, y esa ficción es dato, no un modo distinto de correr la aplicación: entra por un paso de carga del deploy.**

### 1. El stage corre `Production`

En `docker-compose.stage.yml`, `ASPNETCORE_ENVIRONMENT: Production`. Trae por default, sin configurar nada, código pregenerado (`Static`), `AssertAllPreGeneratedTypesExist`, `ResourceAutoCreate = None` y los niveles de log de `appsettings.json`, y desactiva `DevMigrationsHostedService` y los cuatro `*SeedHostedService`, que siguen gateados por `IsDevelopment()` sin cambios: no se agregó ninguna bandera de capacidad nueva. Con este cambio, `Development` pasa a significar exactamente "corriendo desde el código fuente" (`just dev`, `dotnet run`, los integration tests con `WebApplicationFactory`), y deja de ser también "el stage con datos de prueba".

Un gate que sí cambió, porque `IsDevelopment()` dejó de alcanzar para decidirlo: `Program.cs` cargaba `seed-data/personas.json` a `IConfiguration` solo si `IsDevelopment()`. Con el stage en `Production`, esa carga quedaba en cero y `SeedPersonasOptions.Personas` llegaba vacío al nuevo verbo de siembra. La carga de ese archivo ahora es incondicional (sigue siendo `optional: true`, así que en producción real, que no lo consume, es un no-op): lo que se apagó es el hosted service que lo *usa* al arrancar, no el archivo en sí.

### 2. Un solo verbo deja la base lista: `migrate-db`

Ya existía un comando JasperFx `migrate-db` (`backend/host/Planb.Api/Infrastructure/MigrateDbCommand.cs`) que aplicaba las migraciones de EF Core de los tres módulos. `db-apply` (registrado por Weasel/Wolverine, no es código propio) aplica el schema de outbox de Wolverine por separado; el deploy documentado corría los dos como dos `docker run` distintos.

`migrate-db` ahora hace las dos cosas y sigue siendo un solo verbo, idempotente, que deja la base lista. La parte de EF Core se extrajo a `EfCoreMigrator.MigrateAllAsync` (`backend/host/Planb.Api/Infrastructure/EfCoreMigrator.cs`), y tanto `MigrateDbCommand` como `DevMigrationsHostedService` (el que migra solo en Development) llaman a ese mismo método: no hay dos loops que puedan divergir. La parte de Wolverine llama a `host.SetupResources()` (`JasperFx.Resources`), la misma API que `UseResourceSetupOnStartup()` usa para el auto-create de Development; acá se dispara a mano en vez de en cada arranque.

En `docker-compose.stage.yml` y en `docker-compose.prod.yml`, un servicio `migrate` de un solo uso corre la misma imagen con el comando `migrate-db`, las mismas variables de conexión que `api` (`ConnectionStrings__Planb`, `ConnectionStrings__Redis`, `JWT__Secret`; no necesita SMTP ni los `LinkBaseUrl`), `restart: "no"`, y `api` espera a que termine bien (`depends_on: migrate: condition: service_completed_successfully`). Es el mismo mecanismo en los dos ambientes: producción deja de tener un paso manual de `docker run` en el host del deploy (`docs/engineering/deploy.md`, "Secuencia de un deploy").

### 3. Sembrar es un paso más, y solo del stage

Un verbo nuevo, `seed-db` (`backend/host/Planb.Api/Infrastructure/SeedDbCommand.cs`), corre los mismos `*Seeder` del Application layer que ya corrían los cuatro `*SeedHostedService` de Development (personas, catálogo académico, catálogo de frases, corpus) y termina. No hay lógica de siembra duplicada: los `*Seeder` son el único lugar donde vive, tanto para el hosted service como para el verbo. A diferencia de `DevSeedHostedService` (que traga un fallo de la siembra de personas para no tumbar `just dev`), acá cualquier fallo se propaga: es un paso de deploy sin supervisión, y un stage a medio sembrar es peor que uno que no arrancó. La resolución del id de la cuenta de Lucía (a la que el corpus le suma dos reseñas propias) se compartía por copy-paste entre `CorpusSeedHostedService` y este verbo; ahora vive una sola vez en `LuciaAccountResolver`.

En `docker-compose.stage.yml`, un servicio `seed` de un solo uso corre después de `migrate` (`depends_on: condition: service_completed_successfully`) y `api` espera a que `seed` termine bien. La ficción sigue siendo la misma que hasta ahora (mismos cuatro seeders, mismos datos): lo que cambió es cuándo y cómo corre, no qué siembra.

**En `docker-compose.prod.yml` el servicio `seed` no existe.** Es la protección fuerte: producción no puede sembrar ni por error de configuración, porque no hay ningún verbo que un compose mal copiado pueda disparar.

### 4. Limpieza

De `fix/stage-logs-keep-the-window`: el filtro de `UseSerilogRequestLogging` que baja a Verbose los pedidos exitosos a `/health` y `/metrics` (vale en cualquier ambiente, no solo el stage) y el `max-file` de 3 a 5, los dos en el compose del stage. No se trajeron las tres variables `Serilog__MinimumLevel__*`: con el stage en `Production`, los niveles ya salen de `appsettings.json` sin configurar nada.

De `fix/stage-uses-pregenerated-handlers`: no se trajo código. La palanca `Wolverine:GeneratedCodeMode` que esa rama proponía queda innecesaria: con el stage en `Production`, Wolverine ya usa `Static` sin desacoplar nada del nombre del ambiente.

## Verificación

Imagen construida desde `backend/Dockerfile` (podman) y stack completo (`docker-compose.stage.yml`) levantado con contraseñas descartables generadas para esta verificación, contra una base vacía:

- **Arranca.** `migrate` corrió y terminó bien (exit 0): 15 migraciones de Identity, 21 de Academic, 22 de Reviews, y los recursos de Wolverine (schema `wolverine` con sus siete tablas). `seed` corrió y terminó bien (exit 0): 4 personas, 4 universidades, 19 carreras y planes, 37 materias, 30 cátedras, 14 ítems del catálogo, 136 reseñas del corpus. `api` quedó *healthy*. Ningún tipo pregenerado faltante: `AssertAllPreGeneratedTypesExist` no hizo fallar el arranque.
- **La ficción está.** `GET /api/reviews/subjects/00000004-0000-4000-a000-000000000012/facts` devuelve Pérez 14, González 12, Ruiz 6, exactamente lo esperado sobre una base recién sembrada. La entrada pública (`web`) muestra una ficha real del corpus sembrado.
- **El bug está muerto.** 43 endpoints distintos ejercitados (catálogo académico público y admin, búsqueda, fichas de reviews, identity, mutaciones de alta), terminando en `POST /api/academic/chairs/{chairId}/members`, que devolvió **204**. Memoria del proceso (`podman stats` + `/sys/fs/cgroup/memory.current` del contenedor `api`): **98,96 MB en reposo, 158,8 MB (154,2 MiB por cgroup) después del barrido**, 19,72 % del `mem_limit` de 768 MiB. Contra los 921 a 925 MB de `Dynamic` (el modo que corría el stage hasta hoy) tras un barrido comparable, es una reducción de aproximadamente el 83 %.
- **El reinicio es idempotente.** `docker compose down` (sin `-v`) y `up` de nuevo, sin tocar el volumen: `migrate` reportó "sin migraciones pendientes" en los tres módulos y re-aplicó los recursos de Wolverine sin error; `seed` volvió a correr sin duplicar (Pérez, González y Ruiz siguieron en 14, 12 y 6 después del reinicio).
- `cd backend && dotnet build -warnaserror`: limpio. `dotnet format --verify-no-changes`: limpio. Integración por área en primer plano: Academic 150/150, Reviews 89/89, Identity 95/95. `bun scripts/check-docs.ts --strict`: limpio.

## Alternativas consideradas

**Subir el `mem_limit` del servicio `api`.** El VPS tiene 3,82 GiB y los cinco servicios del stage ya suman menos de la mitad; había margen para hacerlo. Descartada: no toca la causa (seguiría compilando en runtime lo que la imagen ya trae compilado), solo corre el problema más lejos, y encima el stage seguiría sin ensayar el perfil `Production` que sí corre en producción.

**Desacoplar el modo de codegen del ambiente con una palanca** (`Wolverine:GeneratedCodeMode`, propuesta en `fix/stage-uses-pregenerated-handlers`). Resuelve el síntoma de memoria (medido en esa rama: 174,5 MiB tras un barrido de 71 endpoints, contra 4193,2 MiB de `Dynamic` sin límite) sin tocar `ASPNETCORE_ENVIRONMENT`, pero dejaba el resto del paquete de Development intacto: el log seguía en Debug, y migrar y sembrar seguían atados a que alguien no cambiara `IsDevelopment()` por accidente. Descartada: agrega una palanca nueva para resolver a medias lo que tratar el stage como producción resuelve entero, con el mismo costo de build (la imagen ya trae el codegen pregenerado en los dos casos).

**Dos comandos separados para migrar y aplicar recursos, uno por deploy** (lo que ya existía: `migrate-db` + `db-apply` a mano). Descartada para el mecanismo nuevo: el compose necesita un solo verbo por servicio para poder expresar "dejá la base lista" como un único `depends_on`; encadenar dos servicios de un solo uso (`migrate` y `migrate-wolverine`) no agrega nada que `migrate-db` haciendo las dos cosas no dé ya, y sí agrega una carrera más para razonar (¿y si el segundo corre sin que el primero haya terminado?).

## Consecuencias

- El stage ensaya lo mismo que corre en producción: mismo perfil de Wolverine, mismos niveles de log, mismo mecanismo de deploy (`migrate` + `api` esperando). Solo se le agrega `seed`.
- Producción deja de tener un paso manual de `docker run` para migrar: el mismo servicio `migrate` corre como parte del compose en los dos ambientes. `docs/engineering/deploy.md` documenta el flujo nuevo, con menos pasos a mano.
- `seed-db` es un verbo real de la imagen: correrlo a mano contra producción por error sigue siendo posible (nada en el código lo impide), pero nadie lo hace por accidente porque ningún compose de producción lo invoca. La protección es de topología, no de código.
- Un módulo nuevo con su propio `DbContext` se agrega en `EfCoreMigrator.MigrateAllAsync`, un solo lugar, no en el hosted service y en el comando por separado.
- `seed-data/personas.json` ahora se carga a `IConfiguration` en cualquier ambiente (sigue siendo `optional: true`); lo que decide si algo la usa es qué hosted service o verbo corre, no si el archivo llegó a `IConfiguration`.

## Refs

- [ADR-0059](0059-production-startup-does-not-self-repair.md): por qué el arranque de Production falla en vez de repararse solo, y por qué migrar es una decisión explícita.
- [ADR-0089](0089-the-stage-follows-main-and-production-is-promoted-from-a-release.md): el stage sigue a `main`; producción se promueve desde un Release.
- [ADR-0035](0035-environment-configuration.md): la matriz de ambientes, con el stage agregado.
- [ADR-0017](0017-persistence-ignorance.md): por qué el orden entre módulos no importa al migrar (no hay FK cross-schema).
- [`docker-compose.stage.yml`](../../docker-compose.stage.yml), [`docker-compose.prod.yml`](../../docker-compose.prod.yml), [`backend/host/Planb.Api/Program.cs`](../../backend/host/Planb.Api/Program.cs), [`backend/host/Planb.Api/Infrastructure/MigrateDbCommand.cs`](../../backend/host/Planb.Api/Infrastructure/MigrateDbCommand.cs), [`backend/host/Planb.Api/Infrastructure/SeedDbCommand.cs`](../../backend/host/Planb.Api/Infrastructure/SeedDbCommand.cs), [`backend/Dockerfile`](../../backend/Dockerfile).
- [`docs/engineering/deploy.md`](../engineering/deploy.md), [`docs/engineering/runbook.md`](../engineering/runbook.md).
- Wolverine, `TypeLoadMode` y recursos: https://wolverinefx.net.
