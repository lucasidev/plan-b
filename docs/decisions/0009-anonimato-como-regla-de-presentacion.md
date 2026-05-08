# ADR-0009: Anonimato de reseñas como regla de presentación, no de storage

- **Estado**: aceptado
- **Fecha**: 2026-04-22

## Contexto

Las reseñas en MVP son anónimas por defecto. La carpeta del proyecto lo plantea como decisión de producto para bajar la barrera de aporte y proteger al reseñador.

A nivel de implementación hay dos caminos posibles:

1. **Anonimato en storage:** al crear la reseña, no se guarda vinculación con el autor. O se guarda un hash/identificador opaco. La identidad se pierde al momento de persistir.

2. **Anonimato en presentación:** se guarda la identidad vía `Review.enrollment_id → StudentProfile`, pero la capa pública jamás la expone. Endpoints, UI, dashboard institucional: todos omiten la identidad.

La elección tiene implicaciones en moderación, prevención de abuso, y features futuras.

## Decisión

**Anonimato como regla de presentación.** El schema retiene siempre la identidad del reseñador via el enrollment:

```
Review.enrollment_id → EnrollmentRecord.student_id → StudentProfile.user_id → User
```

La capa pública (API GET de reseñas, UI, dashboard institucional) nunca serializa información que permita identificar al autor. La identidad solo es accesible a:

- El propio autor (para ver/editar sus reseñas).
- Moderadores (para detectar patrones de abuso: múltiples reseñas del mismo autor, reseñas mass-posted, etc.).
- Procesos internos de auditoría (ReviewAuditLog).

## Alternativas consideradas

### A. Anonimato en storage (identidad hasheada o nula)
Opción más fuerte en términos de privacidad. Descartada por:

- **Moderación ciega:** sin poder vincular reseñas a autores, es imposible detectar un alumno que crea 50 cuentas para inflar reseñas malas contra un docente. Los filtros automáticos solo pescan spam obvio.
- **Sin reversibilidad:** si aparece una orden judicial legítima (difamación con daño real), no hay forma de responder. La política del proyecto plantea cooperar con orden judicial: storage anonimizado lo vuelve imposible aunque se quisiera.
- **Feature bloqueada:** "firmar con nombre opcional" como mejora post-MVP requiere identidad retenida. Con storage anonimizado habría que migrar.

### B. Identidad expuesta con flag `is_anonymous`
Las reseñas con `is_anonymous = true` se muestran sin autor, las demás con autor. Descartada para MVP porque todas las reseñas son anónimas y no hay feature de firma opcional todavía. Se puede agregar después como columna sin migración dolorosa.

## Consecuencias

**Positivas:**
- Moderación robusta: detección de sockpuppets, rate limiting por autor, análisis de patrones.
- Base lista para feature "firmar con nombre opcional": se agrega como flag sin migrar identidades.
- Cumplimiento con orden judicial posible si alguna vez aparece.
- Auditoría completa (quién escribió qué, cuándo, qué editó) para uso interno de moderación.

**Negativas:**
- Riesgo de leak accidental: un bug en serialización o en el dashboard podría exponer `student_id`. Mitigación: DTOs explícitos en la capa pública que excluyen el campo por omisión; tests que verifiquen que endpoints públicos no incluyen identidades.
- Promesa de anonimato débil legalmente: la plataforma técnicamente conoce al autor. Para satisfacer reseñadores que quieran anonimato real irreversible, necesitarían no reseñar.

**Cuándo revisitar:**
- Si aparece presión regulatoria o reputacional para que el anonimato sea irreversible, se puede migrar reseñas viejas a un hash one-way y deshabilitar la retención de identidad. Pero hasta entonces, mantener la identidad es la opción más útil operativamente.

**Controles técnicos para prevenir leak:**
- DTOs de reseña en la capa API jamás incluyen `student_id`, `user_id`, `email`, ni el objeto anidado `StudentProfile`.
- Tests de integración que verifican la ausencia de estos campos en respuestas públicas.
- Code review específicamente atento a cambios en serializadores de Review.
