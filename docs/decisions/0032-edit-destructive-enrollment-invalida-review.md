# ADR-0032: Edit destructive de EnrollmentRecord invalida la Review correspondiente

- **Estado**: aceptado
- **Fecha**: 2026-04-25

## Contexto

Una `Review` se ancla a un `EnrollmentRecord` específico (ver [ADR-0005](0005-reseña-anclada-al-enrollment.md)). El alumno puede editar el EnrollmentRecord ([UC-015](../domain/actors-and-use-cases.md#uc-015)) — corregir status, grade, approval_method, etc. Eso introduce un riesgo:

**Caso problemático**: alumno reseñó la cursada cuando estaba en status='aprobada'. Después edita el record a status='cursando' (porque "perdí la final, vuelvo a cursar"). La Review sigue ancla — pero ahora habla de una cursada que aún no terminó. Inconsistente.

Tres respuestas posibles:

- **A — Rechazar la edit**: el EnrollmentRecord no se puede editar mientras tenga Review. El alumno debe primero borrar la Review.
- **B — Invalidar la Review automáticamente**: la edit es válida; la Review pasa a `under_review` con razón `enrollment_changed`. UI confirma al alumno antes.
- **C — Permitir la edit, dejar la Review inconsistente**: zero validation, el frontend muestra "esta reseña habla de una cursada que aún no terminó". Desastre de UX.

## Decisión

**Opción B — invalidar la Review automáticamente (con UI confirmation).**

Concretamente:

1. **Detección de "edit destructive"**: el handler de `UpdateEnrollmentRecord` chequea, antes de aplicar cambios, si:
   - El EnrollmentRecord tiene una Review asociada (UNIQUE per record), Y
   - El cambio mueve a `status='cursando'` desde otro status, O
   - El cambio quita `grade` cuando antes existía, O
   - Cualquier otro cambio que vuelva inconsistente la Review.

2. **UI confirmation**: si es destructive, el frontend muestra un confirm: "Editar va a marcar tu reseña como pendiente de revisión. ¿Seguro?". Si el alumno cancela, no hay edit.

3. **Si el alumno confirma**: el handler emite `EnrollmentRecordEdited` con un flag/payload identificando qué cambió. Reviews escucha el integration event vía Wolverine outbox ([ADR-0030](0030-cross-bc-consistency-via-wolverine-outbox.md)) y dispara el command interno `InvalidateReview(reviewId, reason='enrollment_changed')`.

4. **Review invalidada**: pasa a `status='under_review'`. El alumno la ve marcada como "necesita revisión". Puede:
   - Editarla para reflejar el nuevo estado del EnrollmentRecord (ej. ahora "estoy cursando de nuevo, mi opinión es ...") — vuelve a `published` después de pasar el filter.
   - Borrarla.
   - Esperar — no queda visible al público.

### Cross-BC integration

```
Enrollments BC                          Reviews BC
─────────────────                       ──────────
EnrollmentRecord.Update(...)
  emits domain event:
  EnrollmentRecordEdited
                                        ─── outbox ───►
                                                       Reviews handler:
                                                       InvalidateReviewIfEnrollmentNoLongerValid
                                                         |
                                                         ▼
                                                       Review.Invalidate(reason)
                                                         emits ReviewInvalidated
                                                         persists state
```

Eventual consistency. La Review queda inconsistente por unos ms hasta que el outbox dispatcha. Tolerable porque el alumno ve inmediatamente el confirm "tu reseña queda pendiente" antes de la transición real.

## Alternativas consideradas

### A — Rechazar la edit

Pros: simplifica el modelo (no hay states inconsistentes intermedios).

Contras (decisivos):

- Fricción enorme: el alumno tiene que primero borrar la Review (que tal vez le costó tiempo escribir), después editar el record, después re-escribir la Review. Tres pasos vs uno con confirm.
- No hay forma de "preservar la Review original como historia". Borrar + re-escribir pierde la versión vieja.
- Atrapa al alumno: si quiere reflejar un cambio real (perdió una final), tiene que destruir su contribución previa.

### B — Invalidar automáticamente (elegido)

Pros: balance entre consistency y UX. La Review no se borra, queda preservada. El alumno decide qué hacer (re-publicar editada, borrar, ignorar).

Contras: complejidad cross-BC. Pero ya está pagada por [ADR-0030](0030-cross-bc-consistency-via-wolverine-outbox.md).

### C — Dejar inconsistente

Pros: zero work.

Contras (decisivos): UX broken. Audit log show inconsistencia. Visitors anónimos ven reseñas que no tienen sentido. Descartado de plano.

## Consecuencias

**Positivas**:

- Modelo consistente: nunca hay una Review `published` ancla a un EnrollmentRecord en estado que la invalida.
- UX honesta: el alumno tiene control. Confirm explícito antes de invalidar.
- Audit trail: `ReviewInvalidated` queda como entry del audit log (Moderation), referenciando el `EnrollmentRecordEdited` que la disparó.

**Negativas**:

- Complejidad cross-BC. Mitigada por el patrón estándar del outbox.
- Eventual consistency: hay una ventana (ms a segundos) donde la Review sigue `published` pero el EnrollmentRecord ya cambió. En esa ventana, un visitor anónimo podría ver la review inconsistente. Mitigación: ventana es corta (outbox dispatcha rápido); plus, el alumno acaba de confirmar el cambio, así que el riesgo de "view temprana" es bajo.
- El moderador puede recibir cola de `under_review` con casos auto-invalidated (no son maliciosos, son administrativos). Mitigación: filtrar por `reason='enrollment_changed'` en la cola para tratarlos distinto (alta prioridad de auto-resolve cuando el alumno re-publica).

**Casos edge cubiertos**:

- Alumno edita ANTES de que la Review fuera publicada (status=under_review por filter): la edit destructive no cambia nada relevante, la Review sigue under_review. OK.
- Alumno edita el EnrollmentRecord DESPUÉS de que la Review fue removed por moderación: la Review sigue removed. La invalidation policy se ejecuta pero no tiene efecto (Review.Invalidate desde 'removed' es no-op). OK.

## Cuándo revisitar

- Si los falsos positivos (edits inocentes que disparan invalidation) crecen mucho: refinar la heurística de "destructive". Hoy es conservadora.
- Si el moderador termina con mucha cola de auto-invalidated waiting alumno: agregar un grace period (ej. 7 días para re-publicar) y auto-restore si el alumno no actuó.

Refs: [ADR-0005](0005-reseña-anclada-al-enrollment.md), [ADR-0011](0011-cascade-on-uphold-sin-reversion-on-restore.md), [ADR-0012](0012-edicion-de-resena-solo-desde-published.md), [ADR-0030](0030-cross-bc-consistency-via-wolverine-outbox.md).
