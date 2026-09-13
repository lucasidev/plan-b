# Rollback playbook

Cómo volver a un artefacto sano y cómo recuperar datos. El deploy normal está en [`deploy.md`](deploy.md); el diagnóstico, en [`runbook.md`](runbook.md).

## Política

Hay tres acciones distintas y no se intercambian:

| Problema | Acción por default |
|---|---|
| API o web defectuosa | Volver la Application al último SHA sano. |
| Schema incompatible, sin corrupción ni pérdida | Roll-forward con una migración correctiva. |
| Datos corruptos o perdidos | Restore desde un backup verificado. |

Un rollback de aplicación no retrocede automáticamente el schema. Un restore no se usa para deshacer un bug de código.

## Rollback de Application por SHA

Stage y producción, cuando exista, consumen imágenes identificadas por SHA. `main` y `latest` no son targets válidos.

### Secuencia

1. Identificar el último SHA sano desde `/health`, GitHub Actions y el historial de deploys de Dokploy.
2. Confirmar que las imágenes API y web de ese SHA existen. El web tiene que ser el artefacto construido para ese destino.
3. Revisar si el schema actual sigue siendo compatible con la versión anterior. Las migraciones deben seguir expand/contract para que este paso sea posible.
4. Actualizar la referencia de imagen de API al SHA sano.
5. Actualizar la referencia de web al SHA sano del mismo destino.
6. No volver a ejecutar una migración vieja y no usar `Down()` por default.
7. Desplegar API y web.
8. Verificar `/health`, el SHA servido y una ruta pública.
9. Abrir un PR de revert o de corrección para que `main` deje de apuntar al cambio roto.

En stage, volver una Application por SHA restaura servicio, pero no cambia qué commit sigue `main`. Sin el PR correctivo, el próximo deploy intentará publicar otra vez el estado roto.

En producción, cuando exista, el rollback apunta las Applications al SHA del Release sano anterior. No se mueve ni se reescribe el Release roto para ocultar lo ocurrido.

## Revert del código en Git

El repositorio sigue un flujo PR-only. No se pushea un revert directo a `main`.

```bash
git fetch origin main
git switch -c revert/<scope-description> origin/main
git revert <sha> --no-edit
```

Si el PR original entró con Rebase and merge y contiene varios commits, revertir el rango o los commits afectados en orden inverso. Si hay conflictos, abortar y resolver con alcance explícito:

```bash
git revert --abort
```

El commit usa Conventional Commits, por ejemplo `revert(scope): remove broken change`. Después se abre PR y se espera CI.

## Schema: roll-forward por default

Migrate corre antes de API como Application run-once: una task por deploy, sin reinicio. Si falla, el deploy se corta antes de mover API y web. La respuesta normal es una migración nueva que lleve el schema desde el estado observable al estado compatible.

No correr `dotnet ef database update <migración-anterior>` ni un `Down()` sobre stage o producción por default. Aunque el `Down()` compile, puede borrar datos que la aplicación vieja y la nueva todavía necesitan.

### Secuencia de corrección

1. Detener el deploy nuevo y conservar los logs de Migrate.
2. Inspeccionar qué migraciones figuran aplicadas en cada módulo.
3. Escribir una migración correctiva compatible con la versión que sigue sirviendo.
4. Publicar una nueva imagen API por SHA.
5. Ejecutar Migrate con esa imagen y esperar éxito.
6. Desplegar API y web solo después.

Las migraciones deben diseñarse con expand/contract: primero agregar o tolerar, después mover lectores y escritores, y recién en otro deploy retirar lo viejo.

## Restore de PostgreSQL

Restore se reserva a corrupción o pérdida confirmada. No es el rollback normal de una migración ni de una Application.

### Precondiciones

- backup externo identificado y dentro de la retención;
- hora o punto de recuperación elegido;
- alcance de la pérdida entendido;
- escrituras detenidas;
- recurso de destino confirmado por id y ambiente.

### Secuencia

1. Mantener la Database dañada sin más escrituras.
2. Restaurar preferentemente sobre una PostgreSQL Database nueva, no encima de la única copia.
3. Verificar integridad y conteos antes de apuntar Applications.
4. Ejecutar Migrate con el SHA que se va a servir.
5. Configurar API y Migrate con el endpoint restaurado.
6. Desplegar API y web.
7. Verificar `/health` y los recorridos críticos.
8. Conservar la Database anterior hasta una decisión explícita de borrado.

El procedimiento exacto del proveedor y la retención todavía no existen para producción. Son requisitos previos a crearla, no una capacidad que este documento afirme disponible.

## Redis

Redis guarda estado efímero. Si se pierde, se recrea el recurso y se actualiza el endpoint de API y Migrate. El efecto esperado incluye sesiones o rate limits perdidos. No se restaura PostgreSQL para compensar una pérdida de Redis.

## Reset de development local

Development local es descartable. Ahí sí corresponde recrear infraestructura y datos:

```bash
just infra-reset
```

Ese comando no se usa contra stage ni producción.

## Checklist

### Después de volver por SHA

- [ ] `/health` sirve el SHA elegido.
- [ ] API y web usan artefactos del mismo destino.
- [ ] PostgreSQL y Redis aparecen sanos.
- [ ] El workflow o deploy deja evidencia del cambio.
- [ ] Existe PR correctivo o de revert para `main`.

### Después de un roll-forward de schema

- [ ] Migrate completó exactamente una ejecución.
- [ ] La versión que seguía sirviendo fue compatible durante el cambio.
- [ ] API y web nuevas pasaron health.
- [ ] No se ejecutó seed como parte de la recuperación.

### Después de un restore

- [ ] El backup y su fecha quedaron registrados fuera del repo.
- [ ] Se verificó integridad antes de mover tráfico.
- [ ] El endpoint nuevo se actualizó en API y Migrate.
- [ ] La copia anterior no se borró sin una decisión explícita.

## Refs

- [ADR-0026](../decisions/0026-git-workflow-github-flow-with-rebase.md): flujo PR-only.
- [ADR-0059](../decisions/0059-production-startup-does-not-self-repair.md): Production no repara schema al arrancar.
- [ADR-0089](../decisions/0089-the-stage-follows-main-and-production-is-promoted-from-a-release.md): promoción por SHA y Release.
- [ADR-0093](../decisions/0093-the-deploy-migrates-the-schema-and-never-seeds-data.md): migración antes del deploy y seed manual.
- [ADR-0094](../decisions/0094-dokploy-applications-are-the-deployment-lifecycle-unit.md): Applications como unidad de ciclo de vida.
