# Correcciones (la pantalla)

> Ficha de pantalla, dueña: la épica [Sostener el catálogo](../../README.md). **Estado**: borrador escrito el 2026-08-19 con su [boceto mid-fi](sketch.html); revisión adversarial pendiente antes del hi-fi. Backoffice, rol catálogo (hoy Sofía). Sin slug hoy.

## Quién la usa

**Sofía** (contrasta contra la fuente antes de aceptar cualquier corrección: aceptar porque sí convierte el dato duro en otra opinión). Quien propone la corrección no está acá: la propone ahí mismo, desde la ficha pública, sin haber aportado antes (T1-2, [Cuidar lo publicado](../../../care-for-what-is-published/README.md)). El flujo entero: [`flow.md`](../../flow.md), sección BO-2.

## Qué stories resuelve

BO1-4 (dueña: la corrección muestra valor viejo y nuevo, y aplicarla queda registrada con quién la aprobó), T1-2 (de dónde llega: quien vuelve corrige un dato duro sin cambiar de pantalla, con cuenta y sin aporte previo). La letra de BO1-4: [README de la épica](../../README.md#stories); la de T1-2, en la épica que la implementa.

## Qué muestra

La cola de correcciones que llegaron desde una ficha: por cada una, el dato, el valor viejo y el valor nuevo propuesto, lado a lado, y la fecha en que se propuso. Al abrir una, se contrasta contra la fuente (el plan publicado, o "sin fuente oficial" si el campo ya venía marcado así, BO4-3) y quedan dos salidas: **Aplicar**, que registra quién la aprobó y cambia el dato para todos sin votación (BO1-4), o **Rechazar**, con un motivo.

**Estado "sin correcciones"**: la cola está al día, no hay nada esperando. **Estado "aplicada"**: el valor nuevo, con quién la aprobó y cuándo. **Estado "rechazada"**: el valor viejo se mantiene, con el motivo por el que no se aplicó.

## Lo que no muestra nunca

Un dato que cambia sin contrastarse contra la fuente (BO1-4: no es un voto, es un dato duro); un cambio anónimo, aplicar siempre queda con quién lo aprobó; en la ficha pública, quién propuso la corrección, eso vive acá, no ahí.

## Adónde va

Llega desde cualquier ficha con un dato duro editable: hoy solo existe el botón "Corregir un dato de la cátedra" en la [Ficha de cátedra](../../../../design/screens/chair/README.md); las fichas de materia, carrera e institución lo van a tener con el mismo patrón cuando se escriban. Aplicada, la corrección cambia el dato en [Catálogo](../catalog/README.md) y en la ficha pública correspondiente, sin pasar por votación.

## Decisiones que aplica

D07 ([registro del 17](../../../../reviews/2026-08-17-catalog-propagation.md): corregir pide cuenta, no aporte previo, y queda registrado quién), los tres planos del [mapa de producto](../../../../design/product-map.md) (el dato base no se crowdsourcea: se contrasta, no se vota).

## Lo que esta ficha deja abierto

- **Si Correcciones muestra qué cuenta propuso el cambio** (para frenar abuso) o queda anónimo como el resto del corpus: ninguna fuente lo dice.
- **Qué datos duros son editables inline y cuáles quedan reservados al catálogo** (correlativas, duración nominal, nombre de cátedra): abierto también en Cuidar lo publicado.
- **El criterio para rechazar**: BO1-4 y el flujo solo dibujan el camino de aplicar; si quien propuso se entera de que se rechazó tampoco está dicho.
