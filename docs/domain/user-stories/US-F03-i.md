# US-F03-i: Infra local: Docker Postgres pgvector + Mailpit

**Status**: Done
**Sprint**: S0 (pre-sprint)
**Epic**: [EPIC-00 — Foundations & DevEx](../epics/EPIC-00.md)
**Priority**: High
**Effort**: S
**UC**: —
**ADR refs**: ADR-0007, ADR-0027

## Como dev, quiero infra local levantada con un comando para que el stack corra contra dependencias reales sin instalar nada manual

Como solo-dev, quiero un `docker-compose.yml` que levante Postgres 17 con extensión pgvector + Mailpit (SMTP catcher) con `just infra-up`, autodetectando podman o docker, para que el backend tenga DB y SMTP reales en local sin instalar clientes nativos.

## Acceptance Criteria

- [x] `docker-compose.yml` define services `postgres` (image con pgvector) y `mailpit`.
- [x] `just infra-up` autodetecta podman o docker y levanta los services.
- [x] `just infra-reset` vuela volúmenes y los rearma.
- [x] Postgres expone 5432, Mailpit 1025 (SMTP) + 8025 (UI web).
- [x] Connection string del backend apunta a `localhost` por default (Smtp y Postgres).
- [x] CI usa el mismo Mailpit como service (ADR-0027 + commits recientes).
- [x] Migration de pgvector aplica limpio.

## Sub-tasks

- [x] Escribir `docker-compose.yml` con services
- [x] Implementar autodetección podman/docker en script bun
- [x] Setear defaults Smtp host = localhost
- [x] Documentar en `CLAUDE.md` y README

## Notas de implementación

- **Imagen Postgres con pgvector preinstalado**: la extensión se habilita en migration inicial. ADR-0007 mantiene pgvector implementado pero gated off en UI hasta tener volumen de reseñas suficiente.
- **Mailpit en lugar de Mailhog**: Mailpit tiene mejor UI web y mejor performance para tests de integración que envían N emails. Misma puerta SMTP (1025), drop-in.
- **Autodetección podman/docker**: el script bun chequea cuál binario está disponible. Resuelve el caso típico de developers en Linux con podman default y CI/Mac con docker. Misma `compose` invocation independiente del backend.
- **Shared Postgres en CI**: ADR-0027. Un solo container con schemas separados por test parallel run, reseteo via `TRUNCATE` por aggregate. Más rápido que spinear container por suite.

## Refs

- DoD: [Definition of Done](../definition-of-done.md)
- Use Case: —
- ADRs: [ADR-0007](../../decisions/0007-pgvector-implementado-ui-gated-off.md), [ADR-0027](../../decisions/0027-integration-tests-shared-postgres.md)
