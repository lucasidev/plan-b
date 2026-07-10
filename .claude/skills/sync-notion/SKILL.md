---
name: sync-notion
description: Sincroniza el board de Notion del proyecto después de mergear un PR. Usalo (gate obligatorio) cada vez que se mergea un PR y antes de arrancar un nuevo bloque de trabajo: hay que reflejar el estado real (US a Done, epics/sprints, limpiar duplicados) en TODAS las vistas, no solo la principal. El tracker operacional es Notion; si driftea, se pierde la traza del proyecto.
disable-model-invocation: true
---

Sincronizás Notion con el estado real del repo. Es el gate post-merge: después de cada PR mergeado, antes del próximo bloque de trabajo.

## Qué actualizar (todas las vistas, no solo una)

1. **Tasks**: las US entregadas por el PR pasan a `Done`. Verificá `Type`, `Sprint`, `Epic` (relation), `Doc link`.
2. **Vistas con filtros**: revisá las vistas por sprint, por epic, por estado. Una US puede desaparecer de una vista filtrada al cambiar de estado (eso es correcto), pero confirmá que no quedó en la columna equivocada.
3. **Dashboard**: los counters y rollups reflejan el nuevo estado.
4. **Epics**: si el PR cerró la última US de un epic, el epic pasa a `Done`; si arrancó uno, a `In progress`.
5. **Duplicados**: chequeá que no haya quedado una US duplicada (pasa cuando se crea una page nueva en vez de actualizar la existente).

## Reglas duras

- **NUNCA renombrar ni borrar options de un campo Select/Status vía API**: rompe los IDs de las asignaciones existentes. Si falta una option (ej. un sprint nuevo), se AGREGA con `update-data-source` incluyendo TODAS las options actuales + la nueva. Las obsoletas se dejan sin usar, no se borran.
- **Lucas decide** scope/sprint/prioridad. Vos reflejás lo decidido, no inventás asignaciones de sprint ni prioridades.
- **Sin nomenclatura de chat** en ninguna propiedad, header ni dashboard. Solo refs estables (US-NNN, ADR-NNNN, PR #NNN).

## Referencia

El estado canónico también vive en `docs/STATUS.md`. Si Notion y STATUS.md divergen, resolvé la divergencia mirando el repo, no asumas cuál está bien.
