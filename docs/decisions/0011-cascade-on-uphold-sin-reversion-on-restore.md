# ADR-0011: Cascade on uphold sin reversión on restore

- **Estado**: aceptado
- **Fecha**: 2026-04-23

## Contexto

Una reseña puede acumular múltiples `ReviewReport` abiertos antes de que un moderador la resuelva. Cuando el moderador abre uno de esos reports y decide `upheld` (la reseña infringe y debe removerse), hay que decidir qué pasa con:

1. Los demás reports abiertos sobre la misma reseña.
2. El caso posterior donde un moderador restaura la reseña (UC-052) tras apelación.

Dos dimensiones de decisión, con implicaciones en UX de moderadores, UX de reporters, y trazabilidad.

## Decisión

**Cascade on uphold:** cuando un `ReviewReport` pasa a `upheld` y la `Review` se mueve a `removed`, todos los demás reports abiertos sobre esa misma reseña se marcan automáticamente como `upheld`, heredando la `resolution_note` del que disparó la cascade y con el mismo `moderator_id` y `resolved_at`.

**Sin reversión on restore:** si posteriormente la reseña se restaura vía UC-052, los reports que quedaron `upheld` por cascade **no** vuelven a `open`. Permanecen `upheld` como registro histórico de la decisión en el momento en que se tomó. La cronología completa se reconstruye vía `ReviewAuditLog`.

## Alternativas consideradas

### A. Sin cascade: cada report se resuelve individual

Moderador upholda un report → la reseña se remueve → los demás reports quedan `open` con la reseña ya removida. Hay que entrar a cada uno y resolverlo.

Descartada: la reseña ya no existe como entidad pública removida. Los otros reports no tienen objeto. Forzar la resolución individual es burocracia sin valor. Los reporters ven su report pendiente aunque la reseña ya no esté, lo cual es confuso.

### B. Cascade con reversión on restore

Los reports cascade-upheld vuelven a `open` si la reseña se restaura, para que los reporters sigan pudiendo ver su caso como "pendiente" y ser reevaluados.

Descartada: la decisión que se tomó en el momento fue "upheld". Que un moderador posterior haya restaurado la reseña (por apelación, por criterio distinto, o porque se levantó la ambigüedad) no invalida históricamente la decisión original. Mantenerlos upheld es consistente con la cronología real. Los reporters ven "su report fue upheld en su momento": no es engañoso. El estado actual de la reseña es visible separadamente.

Además, revert introduce complejidad no trivial: ¿qué si varios reports se cascade-upholdearon con razones distintas y el restore fue por una apelación que contradice solo algunas? ¿Se revierten todos o selectivamente? Evita el problema eligiendo no revertir.

### C. Cascade con UI que muestra "reports upheld sobre reseña restaurada"

Mantiene el modelo de "sin revert" pero agrega UI que indica la situación ambigua. Descartada como decisión separada: esto es un detalle de presentación, no de modelo. Puede hacerse si se considera necesario, sin cambiar el ADR.

## Consecuencias

**Positivas:**

- Un moderador atiende un report; el sistema cierra el resto. Sin trabajo redundante.
- Los reporters que participaron reciben feedback inmediato vía UC-020 (status `upheld`).
- La cronología completa queda en `ReviewAuditLog`: cuándo se removió, cuándo se restauró, con qué notas y moderadores.
- Análogo al patrón de "ban + cleanup" en moderación de plataformas sociales y juegos.

**Negativas:**

- Si los reports tenían razones estructuralmente distintas (ej. uno por spam, otro por datos personales), la cascade los nivela bajo la misma `resolution_note`. Se pierde granularidad de análisis post-hoc.
- Un reporter cuyo report se cascadeó por una razón distinta a la que él mismo planteó podría ver "upheld" con una nota que no menciona su reason: leve disonancia.

**Mitigaciones:**

- El `reason` original del report se preserva: solo se comparte la `resolution_note`. Análisis por reason sigue siendo posible.
- En la UI de reporter (UC-020), se puede mostrar el reason original junto a la resolution_note, clarificando que la decisión fue holística.
