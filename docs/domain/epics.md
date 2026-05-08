# Epics: planb

Capabilities mayores del producto. Cada epic agrupa user stories que aportan valor al usuario y comparten contexto de implementación. Cada epic vive en su propio archivo dentro de [epics/](epics/).

Granularidad: una epic es una unidad que en un equipo grande podría asumirse como "trabajo de varios sprints". Para nuestro proyecto solo-dev, una epic suele cruzar varios sprints de 7 días.

| ID | Epic | Sprint target | Status | Stories |
|---|---|---|---|---|
| [EPIC-00](epics/EPIC-00.md) | Foundations & DevEx | S0 | Done | 7 |
| [EPIC-01](epics/EPIC-01.md) | Catálogo público y exploración |: | Not started | 4 |
| [EPIC-02](epics/EPIC-02.md) | Identidad y autenticación | S1+ | In progress | 8 |
| [EPIC-03](epics/EPIC-03.md) | Historial académico |: | Not started | 3 |
| [EPIC-04](epics/EPIC-04.md) | Planificación de cuatrimestre |: | Not started | 7 |
| [EPIC-05](epics/EPIC-05.md) | Sistema de reseñas |: | Not started | 4 |
| [EPIC-06](epics/EPIC-06.md) | Claim e identidad docente |: | Not started | 6 |
| [EPIC-07](epics/EPIC-07.md) | Moderación |: | Not started | 4 |
| [EPIC-08](epics/EPIC-08.md) | Backoffice de catálogo |: | Not started | 6 |
| [EPIC-09](epics/EPIC-09.md) | Backoffice de cuentas staff |: | Not started | 1 |
| [EPIC-10](epics/EPIC-10.md) | Dashboard institucional |: | Not started | 1 |

`Sprint target` indica el sprint donde la epic queda funcional al usuario, no necesariamente cuándo todas sus stories cierran. El guión en la columna significa "pendiente de planificación". Cada sprint dura 7 días.

> Las "Fases del PFI" (1 a 7) son la unidad de evaluación académica del cronograma original y solo aparecen en [STATUS.md](../STATUS.md) como anexo para el evaluador. El día a día se planifica en sprints.

---

## Cómo se trackean

- En este doc: índice + tabla resumen. Cada archivo en [epics/](epics/) tiene la descripción de capability + stories incluidas + decisiones que la condicionan. Fuente de verdad.
- En Notion: estructura industry-standard con dos listas separadas (template "Projects & Tasks" oficial de Notion):
    - `plan-b: Epics` (lista propia): cada epic es una entry con su Description, US IDs, Sprint target, Status agregado, BCs involved, ADR refs, Doc link.
    - `plan-b: Tasks` (lista de stories y tasks): tiene un campo `Epic` que es Relation a la lista de Epics, y un campo `Sprint` (S0, S1, S2, ...) por entry. Cada story queda linkeada a su epic correspondiente.
- En código: indirectamente, vía PRs que referencian US-NNN o UC-NNN. La epic NO aparece en commits, solo es organización de planning.
