---
name: new-us
description: Crea una nueva story del producto (el archivo en su épica, con su criterio de aceptación y su trazabilidad a las pantallas). Usala cuando Lucas defina una story nueva y haya que registrarla en el repo.
disable-model-invocation: true
---

Creás una nueva story del producto. **La story vive en su épica, no en el plan**: `docs/product/<épica>/stories/US-NNN-slug.md`.

Pasos:

1. **Leé el contrato**: `docs/plan/story-template.md` tiene el formato exacto, las reglas del ID y qué NO es una story (los requisitos no funcionales son Restricciones; el trabajo técnico sin producto atrás es una tarea de sprint).
2. **Número**: `US-NNN` secuencial, el próximo libre en todo `docs/product/*/stories/`. **Los IDs no se reciclan**: si uno quedó vacante porque su story se absorbió, sigue vacante. Sin sufijos de capa (`-b`, `-f`, `-i`, `-t`): la capa es un atributo de la tarea, no del identificador.
3. **Slug**: inglés kebab-case, 3 a 6 palabras, describe la story. Se congela al crear.
4. **Épica**: la que la pide. Si Lucas no la dijo, preguntale: no la deduzcas del tema.
5. **Escribí la story** con sus secciones: Historia (rol de la lista cerrada de `docs/product/personas.md`), Listo cuando (hasta tres criterios verificables), Dónde se resuelve (las pantallas, con una línea cada una) y Notas.
6. **Conectala en las dos direcciones**, o `check-docs` lo canta:
   - La fila en el índice del README de su épica, y el número de la frase que dice cuántas son.
   - El conteo de esa épica en la tabla de `docs/product/README.md`.
   - La sección `## Qué stories resuelve` de cada ficha de pantalla que la story declara.
7. **Verificá**: `bun scripts/check-docs.ts` tiene que quedar limpio.
8. **Confirmá**: devolvé el path de la story y qué archivos tocaste para conectarla.

**Lo que NO va en la story**: Status, Sprint, Effort, tareas ni contrato técnico. Eso es planificación y vive en `docs/plan/status.md`, que la cita por ID cuando entra a un sprint.

Recordá: Lucas decide scope, épica y prioridad; vos ejecutás. No inventes criterios de aceptación que él no dio: si algo quedó abierto, va en Notas, nunca en el "listo cuando".
