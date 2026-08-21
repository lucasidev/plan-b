# ADR-0059: Production startup does not self-repair

- **Estado**: aceptado
- **Fecha**: 2026-07-27

## Contexto

El host tiene un bloque `CritterStackDefaults` en `Program.cs` que parte el comportamiento por entorno. En `Production` deja tres cosas prendidas:

| Flag | Qué implica |
|---|---|
| `GeneratedCodeMode = Static` | Wolverine no genera el código de sus handlers en runtime: espera encontrarlo compilado adentro del assembly. |
| `AssertAllPreGeneratedTypesExist = true` | Si falta aunque sea un tipo generado, el host no arranca. |
| `ResourceAutoCreate = None` | Wolverine no crea las tablas de su outbox. |

Y aparte, `DevMigrationsHostedService` aplica las migraciones de EF solo en Development.

Ese bloque venía del template canónico de CritterStack y estaba bien elegido, pero nunca se había ejercido: **nadie había construido la imagen ni la había levantado en modo Production**. Al hacerlo por primera vez aparecieron tres cosas encadenadas.

Primero, la imagen no construía: `global.json` pinneaba el SDK con `rollForward: latestPatch`, o sea que solo aceptaba parches dentro de la banda `10.0.2xx`, y la imagen base `sdk:10.0` ya venía con `10.0.302`. El build moría en `dotnet restore` con "A compatible .NET SDK was not found". CI no lo veía porque instala el SDK con `dotnet-version: 10.0.x` y hoy le toca uno de la banda vieja; era cuestión de tiempo.

Segundo, el Dockerfile publicaba sin generar el código de Wolverine. La imagen quedaba construida y el contenedor no levantaba nunca.

Tercero, y esto solo se ve corriéndolo: el host valida su configuración al arrancar y **exige ocho valores que hoy viven únicamente en `appsettings.Development.json`** (los cinco de SMTP y los tres `Identity:*:LinkBaseUrl`). En producción no tienen ningún default. El arranque falla con un `OptionsValidationException` que los nombra, pero nadie los había enumerado en ningún lado.

La pregunta de fondo es si el arranque debería resolver todo esto solo (migrar, crear su schema, generar lo que falte) o fallar.

## Decisión

**El arranque en producción no se repara a sí mismo. Falla fuerte y temprano, y los pasos previos son explícitos y ordenados.** Los tres flags se quedan como están.

El orden queda: publicar imagen → backup → `migrate-db` → `db-apply` → apuntar el servicio → verificar `/health`. Está escrito en [`docs/engineering/deploy.md`](../engineering/deploy.md) con los comandos exactos.

Tres piezas concretas que salen de esto:

- **El código generado de Wolverine se produce en el build de la imagen**, con un `dotnet run -- codegen write` antes del `publish`, y está gitignoreado. Verificado que codegen no abre ninguna conexión: corre con un host de Postgres inexistente, así que el build no necesita ningún secreto real y las variables que le pasa el Dockerfile son basura a propósito.
- **Las migraciones se aplican con la misma imagen que se va a correr**, en un contenedor efímero, desde la red donde vive Postgres. No desde un runner de GitHub.
- **`global.json` pasa a `rollForward: latestFeature`**: cualquier SDK `10.0.x` sirve, ninguno de .NET 11. Es lo que CI ya asumía con `10.0.x`, ahora dicho en un solo lugar.

## Alternativas consideradas

**Migrar al arrancar (`db.Database.Migrate()` en el startup, también en Production).** Es un solo paso y no hay runbook que seguir. Se descarta por dos razones que pesan más: con más de una réplica, N instancias corren las migraciones a la vez sobre la misma base, y una migración que falla a mitad deja el servicio en un crash-loop en vez de dejar la versión anterior andando. El deploy deja de ser reversible en el momento en que más lo necesitás.

**Commitear el código generado de Wolverine al repo.** El build no necesitaría el paso extra y la imagen sería reproducible sin correr nada. Se descarta porque es output de build viviendo como fuente: cada PR que toca un handler arrastra un diff generado que nadie revisa, y el día que alguien olvida regenerarlo la imagen se construye con código viejo y la falla aparece en runtime, que es justo lo que estos flags quieren evitar.

**Aplicar el schema desde el workflow de GitHub Actions.** Cerraría el deploy en un solo click. Exige exponer la base de producción a internet para que el runner la alcance. El precio de esa exposición es peor que el de dos comandos a mano en el host.

**Dejar `ResourceAutoCreate = CreateOrUpdate` también en producción.** Wolverine crearía su outbox solo y el paso `db-apply` desaparecería. Se descarta por coherencia con lo anterior: si las migraciones de EF son explícitas, que el outbox se cree solo esconde la mitad del schema y deja al servicio con permisos de DDL en producción para siempre.

## Consecuencias

**Positivas**

- Un deploy mal armado se muere al arrancar, con un mensaje que dice qué falta, en vez de andar a medias. El `/health` verde significa algo.
- La imagen es inmutable y el mismo artefacto sirve para migrar y para correr: no hay forma de que el binario que migró sea distinto del que quedó sirviendo.
- El servicio no necesita permisos de DDL en runtime.

**Negativas**

- El deploy tiene pasos manuales y admite el error humano de saltearse uno. La mitigación es el runbook con los comandos copiables, no automatizarlos (ver alternativas).
- Cada variable de configuración nueva que sea `[Required]` es una forma nueva de que el arranque falle en producción. Es el trade-off buscado, pero implica mantener la tabla del runbook al día: si se agrega una opción con `ValidateOnStart`, va a esa tabla en el mismo PR.

**Advertencia**

Los ocho valores que hoy solo viven en `appsettings.Development.json` siguen ahí. Nada impide que aparezca un noveno de la misma forma. La defensa real sería que el host los valide en un test, no que estén en un doc; queda anotado como la deuda de este ADR.

## Verificación

Probado local contra Podman y el Postgres y el Redis de `just infra-up` (2026-07-27): la imagen construye con codegen adentro, `migrate-db` aplica lo pendiente y es idempotente, `db-apply` corre, y el contenedor levanta en Production con `/health` respondiendo `{"status":"ok"}` y los logs confirmando `code generation mode is Static with pre-generated types being loaded`.

Sin verificar, porque necesita la infra real: la publicación a GHCR, el pull desde Dokploy, la red interna y el certificado.

## Refs

- [`docs/engineering/deploy.md`](../engineering/deploy.md): el runbook con los comandos.
- [`docs/engineering/rollback.md`](../engineering/rollback.md): qué hacer cuando algo entra y rompe.
- [ADR-0035](0035-environment-configuration.md): una sola casa por valor de configuración.
- [ADR-0038](0038-release-and-versioning-policy.md): por qué la publicación de imágenes es manual.
