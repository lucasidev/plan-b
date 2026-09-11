# ADR-0093: The deploy migrates the schema and never seeds data

- **Estado**: aceptado
- **Fecha**: 2026-09-10

## Contexto

[`docker-compose.stage.yml`](../../docker-compose.stage.yml) encadena tres pasos antes de servir: un servicio `migrate` de un solo uso, después uno `seed`, y recién ahí `api`, cada uno esperando al anterior con `depends_on: condition: service_completed_successfully`. Lo decidió el [ADR-0091](0091-the-stage-runs-as-production-and-seeding-is-a-deploy-step.md) el 2026-09-08, con un argumento explícito: un stage a medio sembrar es peor que uno que no arrancó, así que cualquier fallo del seed se propaga en vez de tragarse.

La consecuencia que ese argumento no midió: **cualquier falla del seed impide que el producto arranque.**

Y pasó. El 2026-09-10 el seed murió por un choque de clave única en los períodos lectivos, `api` nunca arrancó, y el stage quedó devolviendo 404. Al revisarlo apareció lo de fondo: **los últimos cuatro despliegues habían fallado en fila desde el 8 de septiembre**, y desde afuera el stage seguía contestando con la versión anterior, porque el contenedor viejo atendía hasta que el último lo tiró abajo. La señal existía: el job "Redeploy the stage" espera hasta cinco minutos a que `/health` devuelva el sha del merge y falla cuando no llega ([`publish-images.yml`](../../.github/workflows/publish-images.yml), paso "Wait for the stage to run this sha"). Lo que faltó fue leerla.

El bug del seed nunca había aparecido antes por dónde corría. La idempotencia que fija el [ADR-0058](0058-deterministic-seed-in-code-gated-by-environment.md) es por id: cada seeder lee los ids que ya están y saltea esos ([`AcademicSeeder.cs:313`](../../backend/modules/academic/src/Planb.Academic.Infrastructure/Seeding/AcademicSeeder.cs)). La base define su unicidad por clave natural: `ux_academic_terms_uni_year_number_kind`, sobre universidad, año, número y tipo ([`AcademicTermConfiguration.cs:45`](../../backend/modules/academic/src/Planb.Academic.Infrastructure/Persistence/Configurations/AcademicTermConfiguration.cs)). Una fila del mismo período con otro id pasa el chequeo del seeder y muere en el `INSERT`. En desarrollo eso no se ve nunca, porque la base se tira y se recrea: el seed siempre corre contra una base vacía, y su idempotencia contra datos acumulados no se ejercita.

Y la cadena rompía algo que nadie había nombrado: **si el stage resiembra en cada merge, lo que alguien crea caminando el producto no sobrevive.** Los recorridos de persona, que se registran, verifican el mail, reseñan y cargan una cátedra desde el backoffice, necesitan que sobreviva.

## Decisión

**El despliegue migra el esquema y no siembra datos. En ningún ambiente.** Cargar datos, sean de referencia o de prueba, es una acción explícita de una persona, desacoplada del despliegue.

1. **`migrate` se queda en la cadena.** El esquema es precondición del código que se acaba de publicar: sin él la imagen nueva no arranca, y por eso migrar es parte de desplegar ([ADR-0059](0059-production-startup-does-not-self-repair.md)). `api` espera a `migrate`, y a nada más.
2. **`seed` sale de la cadena.** El verbo `seed-db` sigue siendo un verbo de la imagen, y alguien lo corre contra el stage cuando quiere cargar el catálogo. Ningún despliegue lo dispara.
3. **Resembrar en cada despliegue es conducta de entorno de desarrollo.** En desarrollo tiene sentido, porque el ambiente se recrea muchas veces y en muchos lugares. El stage actualiza un producto que se supone que está en otra etapa, y sus datos tienen que comportarse como se comportarían en producción: persistir. En producción nadie resiembra al desplegar.

## Lo que falta aplicar

La decisión está tomada y el compose todavía no la refleja. Al 2026-09-10, `docker-compose.stage.yml` sigue con el servicio `seed` y con `api` esperándolo.

- El servicio `seed` sale de `docker-compose.stage.yml` entero. Sacarlo del `depends_on` de `api` no alcanza: un servicio de un solo uso corre igual en cada `up`, así que fallar seguiría cortando el deploy.
- `api` pasa a depender de `migrate`, con la misma forma que ya tiene en [`docker-compose.prod.yml`](../../docker-compose.prod.yml).
- Sembrar el stage pasa a ser un comando contra el despliegue existente: la misma imagen con el comando `seed-db` y las variables de conexión del stage, corrido desde el host. El paso a paso vive en [`runbook.md`](../engineering/runbook.md) y todavía no se corrió contra el stage real.
- Con el servicio afuera, el inventario por servicio del [ADR-0092](0092-containers-run-least-privilege-and-the-image-chain-is-pinned-and-gated.md) pierde su fila `seed`. Hasta entonces sigue describiendo el compose real y se deja como está.

## Alternativas consideradas

**Arreglar la idempotencia y dejar el seed en la cadena.** Chequear por la clave natural en vez de por el id cierra el choque de hoy. Descartada: resuelve el síntoma y deja intacto el modo de falla. Cualquier otro error del seed vuelve a tumbar el producto, y el seed tiene de dónde fallar: entra por `Hydrate`, que saltea las validaciones del dominio, y resuelve las localidades de las unidades académicas contra Georef, una API de terceros, en la misma corrida. La superficie del seed crece con cada sprint y la del despliegue no debería.

**Que el seed falle sin cortar el despliegue.** Sacarle a `api` el `depends_on` sobre `seed`, o tragarse el error dentro del verbo como hace `DevSeedHostedService` con las personas para no tumbar `just dev`. Deja el producto arriba y con datos a medias en silencio, que es exactamente lo que el ADR-0091 quiso evitar a propósito. Descartada: el problema no es cómo falla el seed adentro del despliegue, es que el seed esté adentro.

## Consecuencias

- Un despliegue no puede caerse por un dato. Entre la imagen nueva y el producto arriba queda solo la migración.
- **Los datos del stage pasan a acumularse y a divergir del seed.** Cuando el catálogo cambie, cargarlo es una acción deliberada de alguien y no un efecto del merge. Ese es el precio de la decisión, y es el que elige pagar.
- Lo que alguien crea caminando el producto sobrevive al merge siguiente: las cuentas, las reseñas y las cátedras cargadas desde el backoffice dejan de irse con el próximo despliegue.
- El reset del stage deja de rearmarlo solo. `down -v` y Deploy dejan la base migrada y vacía; sembrarla es el paso siguiente, a mano.
- La idempotencia del seed contra una base acumulada sigue siendo débil: por id, no por clave natural. Deja de poder tumbar el producto y sigue pudiendo fallar cuando alguien lo corra. Arreglarla es trabajo aparte, y ahora se hace sin urgencia.
- Ningún compose invoca `seed-db`, en ningún ambiente. La protección de topología del ADR-0091 sobre producción no cambia, y ahora vale igual para el stage.
- **A vigilar**: un despliegue del stage que falla se ve en un solo lugar, la corrida de *Publish images* que verifica el sha contra `/health`. Cuatro corridas en rojo seguidas es lo que costó descubrirlo esta vez.

## Refs

- [ADR-0091](0091-the-stage-runs-as-production-and-seeding-is-a-deploy-step.md): el stage corre como producción. Sigue vigente entero salvo la siembra como paso del deploy, que es lo que este ADR cambia.
- [ADR-0059](0059-production-startup-does-not-self-repair.md): por qué el arranque de Production falla en vez de repararse solo, y por qué migrar es una decisión explícita.
- [ADR-0058](0058-deterministic-seed-in-code-gated-by-environment.md): el seed vive en código, con ids determinísticos, y su idempotencia es por id.
- [ADR-0089](0089-the-stage-follows-main-and-production-is-promoted-from-a-release.md): el stage sigue a `main`; producción se promueve desde un Release.
- [ADR-0035](0035-environment-configuration.md): la matriz de ambientes.
- [`docker-compose.stage.yml`](../../docker-compose.stage.yml), [`docker-compose.prod.yml`](../../docker-compose.prod.yml), [`backend/host/Planb.Api/Infrastructure/SeedDbCommand.cs`](../../backend/host/Planb.Api/Infrastructure/SeedDbCommand.cs).
- [`docs/engineering/deploy.md`](../engineering/deploy.md) y [`docs/engineering/runbook.md`](../engineering/runbook.md).
