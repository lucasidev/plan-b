# US-F05: ADRs base 0001-0033

**Status**: Done
**Sprint**: S0 (pre-sprint)
**Epic**: [EPIC-00 — Foundations & DevEx](../epics/EPIC-00.md)
**Priority**: High
**Effort**: L
**UC**: —
**ADR refs**: 0001-0033 (todos)

## Como dev, quiero las decisiones arquitectónicas formalizadas para que cada decisión tenga contexto y alternativas registradas

Como solo-dev y futuros evaluadores (Ing. Copas), quiero los 33 ADRs base escritos en formato MADR documentando: dominio (multi-uni, planes versionados, correlativas), reseñas (anclas, anonimato, cascade), arquitectura (modular monolith, Wolverine, Carter, persistence ignorance, EF + Dapper), frontend (Next.js + shadcn + TanStack Query + forms primitivos), tooling (.NET 10, dev stack, git workflow), para tener fuente de verdad de decisiones cuando alguien pregunte "por qué así".

## Acceptance Criteria

- [x] 33 ADRs en `docs/decisions/` con formato MADR (Title, Status, Context, Decision, Consequences, Alternatives).
- [x] `docs/decisions/README.md` con criterios de cuándo escribir un ADR e índice.
- [x] Cada ADR cubre una decisión con alternativas reales (no decisiones triviales).
- [x] ADRs linkeadas desde docs de dominio y user stories cuando aplica.

## Sub-tasks

- [x] Escribir ADRs 0001-0013 (dominio + reglas de negocio)
- [x] Escribir ADRs 0014-0025 (arquitectura backend + frontend + runtime)
- [x] Escribir ADRs 0026-0033 (workflow + outbox + projections + child entities)
- [x] Actualizar `docs/decisions/README.md` con criterios e índice

## Notas de implementación

- **Criterio de "decisión que amerita ADR"**: las tres preguntas del README. Si hay alternativa real descartada por motivo concreto, si rompe algo a 3 meses cuando alguien hace lo contrario, y si el "por qué" se va a olvidar, escribirlo. Si no, no.
- **MADR como formato**: estable, lightweight, leído por humanos, no requiere tooling. Evita ADR tools custom que terminan abandonados.
- **ADRs linkeadas desde docs y US**: los ADRs son fuente de verdad de decisiones. Las US referencian ADRs en su header (`**ADR refs**`) y en `## Refs`, no copian el rationale.

## Refs

- DoD: [Definition of Done](../definition-of-done.md)
- Use Case: —
- ADRs: [docs/decisions/](../../decisions/)
