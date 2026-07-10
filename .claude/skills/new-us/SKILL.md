---
name: new-us
description: Crea una nueva user story (doc desde la plantilla + entrada en el board de Notion, cross-linkeados). Usalo cuando Lucas defina una US nueva y haya que registrarla en el repo y en el tracker.
disable-model-invocation: true
---

Creás una nueva user story. Pasos:

1. **Número**: mirá `docs/domain/user-stories.md` para la convención de IDs (`US-NNN[-x]`, sufijos `-b`/`-f`/`-i`/`-t`) y elegí el próximo libre.
2. **Doc**: leé `docs/domain/us-template.md` y creá `docs/domain/user-stories/US-NNN.md` con lo que pase Lucas (título, descripción, acceptance criteria, epic, ADR refs). Sin nomenclatura de chat.
3. **Notion**: creá la page en la DB `plan-b: Tasks` (`Type=Story`, `Priority`, `Epic` como relation a la DB de epics, `Sprint` si Lucas lo define, y `Doc link` apuntando al archivo del repo). El tracker operacional es Notion (ver `docs/STATUS.md`); no renombrar ni borrar options de Select vía API.
4. **Confirmar**: devolvé el path del doc + la URL de la page de Notion.

Recordá: Lucas decide scope/sprint/prioridad; vos ejecutás. No inventes el número de sprint ni el epic si no te lo dio.
