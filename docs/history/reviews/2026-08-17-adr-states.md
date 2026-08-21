# Auditoría de estados de los ADRs (2026-08-17)

> Registro de revisión ([índice](README.md)). **Alcance**: los 16 ADRs que [ADR-0063](../../decisions/0063-the-product-is-a-pressure-instrument.md) declaró afectados por el viraje. **Método**: leer el `Estado` de cada uno contra lo que 0063 y los ADRs 0064 a 0068 decidieron.

| ID | Hallazgo | Estado |
|---|---|---|
| S01 | Once ADRs afectados por el viraje seguían diciendo `aceptado` (o un estado viejo): 0005, 0010, 0012, 0013, 0031, 0032, 0039, 0040, 0047, 0060, 0061. Documentación que mentía en la primera línea. | **Resuelto**: cada uno tiene su estado final con link (superado por 0064 / 0066 / 0067 / 0068, deprecado por 0063, diferido, revalidado); 0063 nombra esos estados; 0064 a 0068 dicen a quién completan o superan. |
| S02 | El README de decisiones no decía cuándo se taguea el ADR viejo, y por eso el paso se salteó. | **Resuelto**: regla escrita, "el commit que crea el ADR nuevo cambia el Estado de los viejos en el mismo diff", con los cuatro estados y su significado ([README](../../decisions/README.md)). |
| S03 | ADR-0063 fijaba en su cuerpo un piso anti-reidentificación (heredado de 0047) y una k-anonimidad "de día cero" que la mesa de "qué publicamos" descartó (grupo A de la [revisión del 16](2026-08-16-catalog.md)). | **Resuelto** en el mismo bloque del mismo día: 0063 dice lo que quedó ([ADR-0066](../../decisions/0066-derived-cards-sum-voices-and-gate-on-coverage-not-a-floor.md): no hay piso; se le dice al que reseña). |
