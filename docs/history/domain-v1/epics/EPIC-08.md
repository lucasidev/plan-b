# EPIC-08: Backoffice de catálogo

**Status**: Not started
**BCs involved**: Academic primario

## Capability

Admin precarga y mantiene el catálogo académico: universities, careers, plans, subjects, prerequisites, teachers, terms, commissions. Sin catálogo cargado, no hay UC-001 ni nada del público.

## User Stories

- [US-060](../stories/US-060.md): Gestionar University
- [US-061](../stories/US-061.md): Gestionar Career + CareerPlan
- [US-062](../stories/US-062.md): Gestionar Subject + Prerequisite
- [US-063](../stories/US-063.md): Gestionar Teacher
- [US-064](../stories/US-064.md): Gestionar AcademicTerm
- [US-065](../stories/US-065.md): Gestionar Commission + CommissionTeacher

## Decisiones que la condicionan

- [ADR-0001](../../../decisions/0001-multi-university-as-root-domain-from-day-1.md): multi-universidad desde día 1
- [ADR-0002](../../../decisions/0002-explicit-versioning-of-career-plans.md): versionado de planes de estudio
- [ADR-0003](../../../decisions/0003-prerequisites-with-two-types.md): correlativas con dos tipos
