# ADR-0058: A deterministic seed in code, gated by environment

- **Estado**: aceptado
- **Fecha**: 2026-07-27 (registra una decisión ya vigente desde S2, ampliada en S8)

## Contexto

planb necesita datos para existir: sin universidad, carrera, plan y materias no hay qué elegir al registrarse ni qué reseñar, y sin reseñas no hay nada que mirar. Ese corpus se siembra hoy con hosted services por módulo (`AcademicSeedHostedService`, `DevSeedHostedService`, `SeedCorpusHostedService`), con ids hardcodeados y con dos niveles de gate por entorno.

La forma está y funciona, pero el criterio nunca se escribió. Quien agregue un módulo con datos propios tiene que deducirlo leyendo tres seeders, y las tres decisiones que lo componen (ids fijos, idempotencia, gates) se leen como detalles de implementación cuando en realidad cada una resuelve un problema concreto que ya nos mordió.

## Decisión

**El seed vive en código C#, con ids determinísticos, es idempotente, y se gatea por entorno en dos niveles.**

### 1. Ids hardcodeados con convención por tipo

`AcademicSeedData` fija los UUID en el código con una convención posicional: `00000001-0000-4000-a000-0000000000NN` para universidades, `00000002-...` para carreras, `00000003-...` para planes, y así. No se usa `Guid.NewGuid()`.

El motivo es que esos ids son **referencias públicas del proyecto**: los specs E2E los usan como constantes (`const TERM_ID = '00000005-0000-4000-a000-000000000005'`), los tests de integración los usan como fixtures, y la documentación los cita. Con ids random, cada `just infra-reset` invalidaría todo eso.

**El registro de prefijos vive acá, y se actualiza al agregar un tipo.** Sin esta lista, "y así" no alcanza: el 2026-08-26 dos tipos nuevos que se agregaron el mismo día (las cátedras en `academic`, los ítems del cuestionario en `reviews`) eligieron los dos el `00000008`, y quedaron dos filas de tablas distintas con el mismo UUID. No rompió nada porque viven en schemas separados y nada las relaciona, pero un fixture que cite ese id ya no dice cuál de las dos es.

| Prefijo | Tipo | Módulo |
|---|---|---|
| `00000001` | universidades | academic |
| `00000002` | carreras | academic |
| `00000003` | planes | academic |
| `00000004` | materias | academic |
| `00000005` | períodos lectivos | academic |
| `00000006` | docentes | academic |
| `00000007` | comisiones | academic |
| `00000008` | cátedras | academic |
| `00000010` | ítems del cuestionario | reviews |
| `00000011` | instrumentos | reviews |

### 2. Idempotente por clave natural y por id, no por "está vacía la tabla"

Cada seeder saltea lo que la base ya tiene; no chequea si la tabla está vacía ni borra nada. Así, correrlo sobre una base ya sembrada no hace nada, y agregar una fila nueva al manifiesto la inserta sin tocar lo demás.

Lo que la base ya tiene se reconoce por la identidad con la que la propia base frena un insert. Donde hay un índice único natural, es esa clave: una cuenta por mail, una frase por código, una reseña por cursada, un período lectivo por universidad, año, número y tipo. En el catálogo académico un registro entra solo si su clave natural y su id están libres, y si la base ya tiene uno de los dos con el otro distinto, se saltea con un aviso. Docentes y datos oficiales no tienen índice único natural y se saltean por id. Decidir solo por id no alcanza donde hay clave natural: contra una base acumulada, la misma clave reaparece con otro id y el insert muere contra el índice.

Corolario: **el seeder no actualiza ni renumera filas existentes**. Cambiar el nombre de una universidad ya sembrada no se propaga a una base que ya la tiene; para eso está el backoffice o un reset. Alinear los ids de una base poblada es una migración de datos curada.

### 3. Dos niveles de gate

- **Nivel 1, `IsDevelopment()`**: lo aplican los hosted services que siembran al arrancar. Fuera de Development nada siembra solo: el gate apaga los hosted services y ningún deploy invoca `seed-db`, así que sembrar exige que una persona corra el verbo ([ADR-0093](0093-the-deploy-migrates-the-schema-and-never-seeds-data.md)). El archivo `seed-data/personas.json` se registra en `IConfiguration` en cualquier ambiente: el stage lo necesita cargado para que ese verbo lo use corriendo en Production ([ADR-0094](0094-dokploy-applications-are-the-deployment-lifecycle-unit.md)).
- **Nivel 2, la variable `PLANB_SEED_CORPUS`**: solo el corpus de demostración (autores fantasma, cursadas y reseñas). Lo prende `just dev` y nadie más. **Está decidido y no construido**: el tooling la manda, y al 2026-08-30 ningún código del backend la lee, así que los dos niveles siembran lo mismo. Lo construye el issue #374.

El segundo nivel existe por una razón que no es obvia: **los integration tests corren en Development**. Sin él recibirían el corpus de demo y cualquier assert de conteo ("esta materia tiene 2 reseñas") se rompería contra los datos de la demo.

## Alternativas consideradas

### A. `Guid.NewGuid()` en el seeder

Rechazada. Es lo natural si uno piensa el seed como "datos de arranque", y falla apenas algo externo necesita apuntar a una fila concreta. Hoy eso incluye specs E2E, fixtures de integración y ejemplos en la documentación.

### B. `INSERT` dentro de las migraciones de EF

Rechazada por dos razones. La primera es que una migración corre en todos los entornos, incluido producción: el gate por entorno dejaría de existir y habría que meter datos de demo en la base real o inventar migraciones condicionales. La segunda es que convierte el manifiesto de datos en historial inmutable: corregir una materia mal cargada exige una migración nueva en vez de editar una línea.

### C. `HasData` de EF Core (seeding declarativo del modelo)

Rechazada por lo mismo que B con un agravante: `HasData` genera migraciones automáticamente ante cualquier cambio del manifiesto, así que tocar el seed ensucia el historial de schema con migraciones de datos.

### D. Fixtures SQL aplicadas por el Justfile

Rechazada. Evita el problema del entorno, pero duplica el modelo: cada cambio de columna obliga a editar el `.sql` a mano, sin compilador que avise. Los seeders en C# usan los mismos aggregates que el resto del sistema, así que un cambio de firma rompe la compilación en vez de romper el seed en silencio.

## Consecuencias

**Positivas**

- Los ids son estables entre resets y entre máquinas, así que E2E, integración y docs pueden referenciarlos.
- El seed pasa por los aggregates: no puede introducir datos que el dominio rechazaría. (Con una salvedad, abajo.)
- Producción no arrastra datos de demo ni el archivo de personas.

**Negativas**

- El manifiesto es código, así que agregar una universidad es un PR y no un INSERT. Es el precio de que compile.
- Los ids hardcodeados son un contrato implícito: cambiar uno rompe specs y fixtures a distancia, sin que nada lo señale hasta que corren.
- Un cambio en un dato ya sembrado no se propaga a bases existentes. En dev se resuelve con `just infra-reset`.

**A vigilar**

- **Una tabla nueva con índice único natural se siembra chequeando esa clave, no solo el id.** Si chequea solo por id, vuelve el choque contra bases acumuladas, que en desarrollo no aparece nunca porque la base se tira y se recrea. Tumbó el stage el 2026-09-10 ([ADR-0093](0093-the-deploy-migrates-the-schema-and-never-seeds-data.md)).
- El seeder es el único caller de los métodos `Hydrate` de los aggregates, que saltean validación. Ese es justamente el camino que motivó replicar invariantes como constraints de base ([ADR-0052](0052-database-constraints-as-a-net-under-aggregate-invariants.md)); `Commission.Hydrate` ya se cerró para que valide y tire.
- Si alguna vez hace falta sembrar en producción (un catálogo real de universidades), esta decisión no cubre ese caso: el gate por `IsDevelopment()` habría que reemplazarlo por algo explícito, y ahí conviene revisar el ADR en vez de sacarle el gate.

## Refs

- [`AcademicSeedData`](../../backend/modules/academic/src/Planb.Academic.Infrastructure/Seeding/AcademicSeedData.cs): el manifiesto y la convención de UUIDs.
- [ADR-0027](0027-integration-tests-shared-postgres.md): por qué los integration tests corren en Development, que es lo que obliga al segundo gate.
- [ADR-0052](0052-database-constraints-as-a-net-under-aggregate-invariants.md): la red de base para los caminos que saltean el dominio, el seeder entre ellos.
