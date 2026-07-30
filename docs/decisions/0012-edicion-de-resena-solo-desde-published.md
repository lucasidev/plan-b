# ADR-0012: Edición de reseña bloqueada mientras la modera un reporte

- **Estado**: aceptado, con la regla ampliada el 2026-07-29 (ver [Revisión](#revisión-2026-07-29))
- **Fecha**: 2026-04-23
- **Nota**: el filename conserva el slug original (`solo-desde-published`) porque los links del repo apuntan a él. El título dice la regla vigente, no la original.

## Contexto

Los alumnos pueden editar sus reseñas propias (UC-018). Esto se acordó porque es irrazonable pedirles que no puedan corregir typos, matizar opiniones escritas con rage, o actualizar cuando cambia su perspectiva.

La pregunta de diseño: **¿desde qué estados de `Review.status` se permite editar?**

Los estados son `published`, `under_review`, y `removed`.

Permitir edición desde `under_review` parece útil a primera vista: el alumno podría corregir lo que disparó el flag y evitar el veredicto de moderación. Pero abre un vector de abuso concreto: **edit-bombing como evasión**.

Escenario de edit-bombing:

1. Alumno publica contenido problemático (insultos, datos personales, difamación).
2. Filtro automático o reports lo marcan, `Review.status = 'under_review'`.
3. Antes de que un moderador llegue a revisar, el alumno edita la reseña reemplazando el contenido por algo inocuo.
4. Moderador abre el caso, ve contenido limpio, dismissea el report.
5. El contenido original fue efectivamente publicado durante horas/días y la evidencia desaparece.

## Decisión

La edición vía UC-018 solo se permite cuando `Review.status = 'published'`. Intentos de edición sobre `under_review` o `removed` retornan 403 Forbidden con mensaje explicativo. ([Ampliado el 2026-07-29](#revisión-2026-07-29): desde `under_review` se puede editar cuando la cuarentena no la pusieron los reportes, y el status real es 409, no 403.)

Si un alumno quiere corregir una reseña que está en `under_review`, debe esperar a que un moderador la resuelva:

- Si se dismissea y vuelve a `published`, puede editar normalmente.
- Si se uphold y pasa a `removed`, puede apelar al admin por canal out-of-band (email).

## Alternativas consideradas

### A. Edit permitido desde cualquier estado

Descartada por el vector de edit-bombing descrito arriba. La trazabilidad en `ReviewAuditLog.changes` (que guarda before/after de cada edit) podría mitigar parcialmente, pero deja carga en el moderador de leer el diff histórico para detectar la evasión: no resuelve la causa raíz.

### B. Edit permitido con re-filter automático + mantener `under_review`

El alumno puede editar pero el status no cambia automáticamente: sigue pendiente de moderación con el contenido nuevo + el histórico disponible para el moderador. El moderador decide si la edición repara o no.

Descartada: aunque más flexible, complica el flow de moderación. El moderador ahora tiene que leer N ediciones posibles y determinar si el original era problemático pese al "final cleanup". Agrega carga sin resolver completamente el problema: el alumno sigue pudiendo retrasar el veredicto con ediciones sucesivas.

### C. Edit permitido con bloqueo temporal post-moderation

El alumno puede editar pero no si hay reports open. Variante menos restrictiva que la decisión.

Descartada: similar a B en que el moderador sigue viendo contenido cambiante. Además, se crea un comportamiento inconsistente ("a veces puedo editar, a veces no") que requiere explicación en UI.

## Consecuencias

**Positivas:**

- Edit-bombing bloqueado como vector de evasión.
- El moderador siempre ve el contenido original que disparó el flag, salvo que ya haya pasado moderación y esté en `published` editable: en ese caso la edición es visible vía `ReviewAuditLog` y los usuarios que reporten el nuevo contenido vuelven a escalarlo a `under_review`.
- La regla es simple y explicable en UI: "no podés editar mientras está en revisión".

**Negativas:**

- Un alumno bien intencionado que genuinamente quiere corregir un error (ej. typo que el filtro catcheó) no puede hacerlo: tiene que esperar al moderador.
- Si el moderador upholdea por contenido que podría haberse arreglado con un edit, el alumno pierde la reseña. Debe apelar out-of-band o volver a publicar (pero UC-017 requiere el `UNIQUE(enrollment_id)`: así que efectivamente no puede volver a publicar; necesita restore vía UC-052).

**Mitigaciones:**

- El flujo de apelación queda out-of-band en MVP (email al admin). Si el volumen lo amerita, se formaliza con un endpoint `POST /reviews/{id}/appeal` + flow en backoffice, pero no para esta iteración.
- La UI indica claramente al publicar: "tu reseña está en revisión, no podés editarla hasta que se resuelva".

**Referencias:**

- Relacionado con [ADR-0005](0005-reseña-anclada-al-enrollment.md) (anclaje a enrollment, `UNIQUE(enrollment_id)`).
- Flujo completo en [review-lifecycle.md](../domain/review-lifecycle.md).

## Revisión (2026-07-29)

**Esta decisión no se equivocó sobre el edit-bombing. Se equivocó suponiendo que siempre llega un moderador.**

El ADR dejó una sola salida para la cuarentena: esperar el veredicto ("debe esperar a que un moderador la resuelva"), y anotó el costo en sus propias Negativas ("un alumno bien intencionado que genuinamente quiere corregir un error (ej. typo que el filtro catcheó) no puede hacerlo"). Esa espera es infinita cuando la cuarentena la puso el filtro de contenido: la cola de moderación se arma desde `moderation.review_reports`, una reseña frenada por el filtro nace con cero reports, y `Review.Edit` exigía `published`. Ningún moderador la ve y el autor no la puede tocar. No es revisión pendiente, es shadow-ban permanente.

**Regla vigente:** se puede editar desde `under_review` cuando `under_review_reason` es `content_filter` o `enrollment_changed`. Sigue bloqueado cuando es `reports`, y sigue bloqueado en `removed`. Editar vuelve a correr el filtro sobre el texto nuevo, y esa reevaluación decide si la reseña sale a `published` o se queda en cuarentena.

**Eso es la alternativa C de este mismo ADR** ("el alumno puede editar pero no si hay reports open"), con un refinamiento: el candado no cuelga de "hay reports abiertos" sino de la razón por la que la reseña entró a cuarentena. Esa razón pasa de un bool a `under_review_reason` con tres valores (`content_filter`, `reports`, `enrollment_changed`, el último de [ADR-0032](0032-edit-destructive-enrollment-invalida-review.md)). De los dos motivos por los que C se descartó en abril, uno no aplica y el otro se paga:

- "El moderador sigue viendo contenido cambiante": no aplica. Cuando la cuarentena viene de reports, el bloqueo se mantiene igual que antes, así que el moderador nunca juzga una reseña editable.
- "Comportamiento inconsistente que requiere explicación en UI": se mantiene tal cual, y es el costo que aceptamos. La UI ahora tiene que decir **por qué** una reseña está en revisión, no solo que lo está.

**Sobre el 403 de la Decisión:** el código devuelve 409 con `reviews.review.invalid_status_transition`. No es un typo del ADR: editar en un estado que no lo permite es un conflicto de estado y no una falta de permisos, así que 409 es la elección correcta. Lo que faltó fue registrar ese cambio cuando se implementó.

**Sigue en pie:** el edit-bombing como vector real, el rechazo de la alternativa A (editar desde cualquier estado, sin condición), y la apelación out-of-band para `removed`.
