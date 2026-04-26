# ADR-0012: Edición de reseña permitida solo desde estado `published`

- **Estado**: aceptado
- **Fecha**: 2026-04-23

## Contexto

Los alumnos pueden editar sus reseñas propias (UC-018). Esto se acordó porque es irrazonable pedirles que no puedan corregir typos, matizar opiniones escritas con rage, o actualizar cuando cambia su perspectiva.

La pregunta de diseño: **¿desde qué estados de `Review.status` se permite editar?**

Los estados son `published`, `under_review`, y `removed`.

Permitir edición desde `under_review` parece útil a primera vista — el alumno podría corregir lo que disparó el flag y evitar el veredicto de moderación. Pero abre un vector de abuso concreto: **edit-bombing como evasión**.

Escenario de edit-bombing:

1. Alumno publica contenido problemático (insultos, datos personales, difamación).
2. Filtro automático o reports lo marcan, `Review.status = 'under_review'`.
3. Antes de que un moderador llegue a revisar, el alumno edita la reseña reemplazando el contenido por algo inocuo.
4. Moderador abre el caso, ve contenido limpio, dismissea el report.
5. El contenido original fue efectivamente publicado durante horas/días y la evidencia desaparece.

## Decisión

La edición vía UC-018 solo se permite cuando `Review.status = 'published'`. Intentos de edición sobre `under_review` o `removed` retornan 403 Forbidden con mensaje explicativo.

Si un alumno quiere corregir una reseña que está en `under_review`, debe esperar a que un moderador la resuelva:

- Si se dismissea y vuelve a `published`, puede editar normalmente.
- Si se uphold y pasa a `removed`, puede apelar al admin por canal out-of-band (email).

## Alternativas consideradas

### A. Edit permitido desde cualquier estado

Descartada por el vector de edit-bombing descrito arriba. La trazabilidad en `ReviewAuditLog.changes` (que guarda before/after de cada edit) podría mitigar parcialmente, pero deja carga en el moderador de leer el diff histórico para detectar la evasión — no resuelve la causa raíz.

### B. Edit permitido con re-filter automático + mantener `under_review`

El alumno puede editar pero el status no cambia automáticamente — sigue pendiente de moderación con el contenido nuevo + el histórico disponible para el moderador. El moderador decide si la edición repara o no.

Descartada: aunque más flexible, complica el flow de moderación. El moderador ahora tiene que leer N ediciones posibles y determinar si el original era problemático pese al "final cleanup". Agrega carga sin resolver completamente el problema — el alumno sigue pudiendo retrasar el veredicto con ediciones sucesivas.

### C. Edit permitido con bloqueo temporal post-moderation

El alumno puede editar pero no si hay reports open. Variante menos restrictiva que la decisión.

Descartada: similar a B en que el moderador sigue viendo contenido cambiante. Además, se crea un comportamiento inconsistente ("a veces puedo editar, a veces no") que requiere explicación en UI.

## Consecuencias

**Positivas:**

- Edit-bombing bloqueado como vector de evasión.
- El moderador siempre ve el contenido original que disparó el flag, salvo que ya haya pasado moderación y esté en `published` editable — en ese caso la edición es visible vía `ReviewAuditLog` y los usuarios que reporten el nuevo contenido vuelven a escalarlo a `under_review`.
- La regla es simple y explicable en UI: "no podés editar mientras está en revisión".

**Negativas:**

- Un alumno bien intencionado que genuinamente quiere corregir un error (ej. typo que el filtro catcheó) no puede hacerlo — tiene que esperar al moderador.
- Si el moderador upholdea por contenido que podría haberse arreglado con un edit, el alumno pierde la reseña. Debe apelar out-of-band o volver a publicar (pero UC-017 requiere el `UNIQUE(enrollment_id)` — así que efectivamente no puede volver a publicar; necesita restore vía UC-052).

**Mitigaciones:**

- El flujo de apelación queda out-of-band en MVP (email al admin). Si el volumen lo amerita, se formaliza con un endpoint `POST /reviews/{id}/appeal` + flow en backoffice, pero no para esta iteración.
- La UI indica claramente al publicar: "tu reseña está en revisión, no podés editarla hasta que se resuelva".

**Referencias:**

- Relacionado con [ADR-0005](0005-reseña-anclada-al-enrollment.md) (anclaje a enrollment, `UNIQUE(enrollment_id)`).
- Flujo completo en [review-lifecycle.md](../domain/review-lifecycle.md).
