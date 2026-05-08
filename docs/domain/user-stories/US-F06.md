# US-F06: DDD formalization (strategic + tactical + epics + user stories)

**Status**: Done
**Sprint**: S0 (pre-sprint)
**Epic**: [EPIC-00: Foundations & DevEx](../epics/EPIC-00.md)
**Priority**: Medium
**Effort**: M
**UC**: 
**ADR refs**: 

## Como dev, quiero el modelo DDD formalizado para que el dominio esté documentado antes de implementar features

Como solo-dev y candidato a recibir feedback académico, quiero documentación DDD completa: ubiquitous language, actors + use cases, lifecycles (enrollment, review, verification), eventstorming, modelo estratégico (BCs + context map), modelo táctico (aggregates por BC), epics y user stories, para que cualquier feature posterior tenga contexto y nomenclatura consistente.

## Acceptance Criteria

- [x] `docs/domain/ubiquitous-language.md` con glosario completo.
- [x] `docs/domain/actors-and-use-cases.md` con UCs catálogo.
- [x] Lifecycles documentados: enrollment, review, verification.
- [x] `docs/domain/eventstorming.md` con board completo (DDEs, comandos, policies).
- [x] `docs/domain/strategic/` con context map y BC descriptions.
- [x] `docs/domain/tactical/` con aggregates por BC.
- [x] `docs/domain/epics.md` y `docs/domain/user-stories.md` (este último split posterior en archivos individuales).
- [x] `docs/domain/definition-of-done.md` formalizado.

## Sub-tasks

- [x] Glosario ubiquitous language
- [x] UCs + actors + lifecycles
- [x] Eventstorming board
- [x] Strategic + tactical models
- [x] Epics + user stories catalog
- [x] Definition of Done

## Notas de implementación

- **DDD before code**: el modelo formalizado antes de implementar US individuales. Ubiquitous language, eventstorming, BCs, aggregates documentados primero. La US de implementación se monta sobre nomenclatura ya consensuada, no inventa términos.
- **`docs/domain/user-stories.md` se splittió en archivos individuales**: cada US tiene archivo propio para que las modificaciones de detalle (acceptance criteria, subtasks, status) no compitan en el mismo file. El `user-stories.md` original quedó como índice.
- **Lenguaje ubicuo enforceado**: el glosario manda. Si una US menciona "carrera" cuando habla de "plan", la US está mal escrita. La revisión de docs incluye chequeo del glosario.

## Refs

- DoD: [Definition of Done](../definition-of-done.md)
- Use Case: 
- ADRs: 
