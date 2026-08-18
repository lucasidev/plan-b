---
name: new-us
description: Crea una nueva user story (la ficha desde la plantilla, con su Status y su sprint en STATUS.md). Usalo cuando Lucas defina una US nueva y haya que registrarla en el repo, que es el tracker.
disable-model-invocation: true
---

Creás una nueva user story. Pasos:

1. **Número**: mirá `docs/domain/user-stories.md` para la convención de IDs (`US-NNN[-x]`, sufijos `-b`/`-f`/`-i`/`-t`) y elegí el próximo libre.
2. **Doc**: leé `docs/domain/us-template.md` y creá `docs/domain/user-stories/US-NNN.md` con lo que pase Lucas (título, descripción, acceptance criteria, epic, ADR refs). Sin nomenclatura de chat.
3. **Tracker**: el repo es el tracker. La ficha lleva `Status` en el header; si Lucas le asigna sprint, entra en la tabla del sprint en `docs/STATUS.md` en el mismo cambio. Nada de Notion.
4. **Confirmar**: devolvé el path de la ficha y la línea de STATUS.md que la lista.

Recordá: Lucas decide scope/sprint/prioridad; vos ejecutás. No inventes el número de sprint ni el epic si no te lo dio.
