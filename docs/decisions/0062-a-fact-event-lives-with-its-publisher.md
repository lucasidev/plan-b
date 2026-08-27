# ADR-0062: A fact event lives with its publisher; a request event lives with its receiver

- **Estado**: aceptado
- **Fecha**: 2026-07-31

## Contexto

[ADR-0045](0045-owned-by-receiver-for-cross-module-integration-events.md) fijó dónde vive el tipo de un integration event cross-módulo: en el bounded context que **recibe** la acción, no en el que la dispara. La restricción que lo forzó está declarada ahí: el grafo de assemblies tiene que quedar acíclico, y `Moderation` ya referenciaba `Reviews` para una lectura síncrona.

Al implementar US-015 apareció un evento donde esa regla no se puede aplicar.

`Enrollments` publica que el alumno editó una cursada; `Reviews` reacciona poniendo en revisión la reseña anclada a ella. Aplicando ADR-0045 al pie de la letra, el tipo tendría que vivir en `Planb.Reviews.Application` y `Enrollments` importarlo. Pero **una reseña se ancla a un `EnrollmentRecord`** (el anclaje del modelo anterior, que es el que este código implementa), así que `Planb.Reviews.Application` ya referencia a `Planb.Enrollments.Application`. Poner el tipo del lado de Reviews cerraría exactamente el ciclo que ADR-0045 existe para evitar.

Podría leerse como un choque entre dos ADRs. No lo es, y mirando los dos casos juntos se ve por qué: **no son la misma clase de evento.**

- `ReviewQuarantineRequestedIntegrationEvent` es un **pedido**. Moderation decidió que una reseña tiene que ocultarse y le pide a Reviews que lo haga. Hay un solo destinatario posible: el que es dueño del aggregate que se va a tocar.
- `EnrollmentRecordEditedIntegrationEvent` es un **hecho**. Enrollments anuncia algo que pasó en su propio dominio. Que Reviews reaccione es decisión de Reviews, y mañana puede reaccionar otro módulo sin que Enrollments se entere.

El codebase ya los venía nombrando distinto sin que nadie lo hubiera hecho explícito: los pedidos terminan en `Requested`, los hechos en participio del verbo que ocurrió (`Edited`, `Published`, `Deleted`).

## Decisión

**La clase de evento decide dónde vive el tipo.**

1. **Evento-pedido** (el publisher decide que algo tiene que pasarle a un aggregate del consumer): el tipo vive en el **consumer**. Es ADR-0045 sin cambios.
2. **Evento-hecho** (el publisher anuncia algo que ocurrió en su propio dominio): el tipo vive en el **publisher**.

**Cómo se distinguen, sin depender del gusto de cada uno:** preguntar si tiene sentido que dos módulos distintos lo consuman con reacciones distintas. Un pedido tiene un solo destinatario por construcción, porque nombra el aggregate que hay que tocar. Un hecho puede tener N, incluido cero.

**La aciclicidad del grafo sigue siendo el límite duro, y es un síntoma, no el criterio.** Si ubicar el evento según su clase cerraría un ciclo, lo que está mal es la clasificación o la dependencia, y hay que arreglar eso en vez de mover el archivo hasta que compile.

**Nota sobre el alcance de ADR-0045, para que no quede como contradicción:** aquel ADR ya se había acotado solo, en su propia redacción, a los eventos "donde el publisher pertenece a un BC distinto y el objetivo es actuar sobre un aggregate del consumer". Eso es precisamente el caso del pedido. Este ADR no lo supera ni lo corrige: nombra el caso complementario, que hasta ahora no había aparecido.

### Dónde aplica hoy

| Evento | Clase | Vive en |
|---|---|---|
| `ReviewQuarantineRequestedIntegrationEvent` | pedido | `Planb.Reviews.Application` |
| `ReviewRemovalRequestedIntegrationEvent` | pedido | `Planb.Reviews.Application` |
| `EnrollmentRecordEditedIntegrationEvent` | hecho | `Planb.Enrollments.Application` |

## Alternativas consideradas

### A. Romper la dependencia `Reviews → Enrollments` para poder cumplir ADR-0045

Invertir o cortar esa referencia y dejar el evento del lado de Reviews, como manda la regla existente.

Descartada porque esa dependencia **no es un accidente de implementación**: existe porque la reseña se ancla al `EnrollmentRecord`, que era la decisión de dominio vigente cuando se escribió este ADR. Reacomodar el modelo para que entre la ubicación de un tipo de evento es la cola moviendo al perro.

### B. Todos los eventos cross-módulo en `SharedKernel`

Neutral, sin ciclos posibles, sin tener que clasificar nada.

Descartada, y ADR-0045 ya la había descartado por lo mismo: el SharedKernel se convierte en un basurero de contratos sin dueño, y cada módulo termina compilando contra los eventos de todos los demás. El acoplamiento no desaparece, se esconde detrás de un assembly que nadie mira.

### C. Invertir ADR-0045 y poner todos los eventos en el publisher

La regla más simple de todas: el que publica define el contrato.

Descartada porque para un pedido la semántica se pierde. "Cuarentená esta reseña" es un contrato del dominio de reseñas: describe algo que se le puede pedir a una reseña, y que lo emita Moderation es un detalle de dónde vive la lógica del threshold. ADR-0045 ya argumentó esto y sigue siendo cierto.

### D. Dejarlo como está y resolverlo caso por caso

No escribir nada y que cada quien mire los precedentes.

Descartada porque los precedentes ahora se contradicen a simple vista: dos eventos cross-módulo, dos ubicaciones opuestas, y la razón solo visible leyendo el grafo de referencias. El próximo que agregue un evento va a leer ADR-0045, ponerlo en el receptor, chocarse con un ciclo, y no tener cómo saber si el precedente que hizo lo contrario estaba bien o mal.

## Consecuencias

**Positivas:**

- El nombre del evento pasa a cargar la información: un `...Requested` va del lado del receptor, un participio va del lado del publisher. Se puede revisar de un vistazo en un PR.
- Los hechos dejan de tener un consumer privilegiado. Sumar un segundo módulo que reaccione a que una cursada cambió no toca a Enrollments ni al tipo.
- Deja de haber un precedente inexplicable en el repo.

**Negativas:**

- **Hay que clasificar, y clasificar admite error.** El riesgo concreto es alguien llamando "hecho" a un pedido para esquivar un ciclo que en realidad denuncia una dependencia mal puesta.
- **No está enforceado.** Los architecture tests (NetArchTest) chequean boundaries entre assemblies, no la intención de un tipo. Esto queda como convención sostenida por revisión, no por CI.
- **Un hecho puede quedar sin consumer y nadie se entera.** Es la contracara de que el publisher no sepa quién escucha: si el handler del consumer se borra, el evento se sigue publicando al vacío sin que falle nada.

## Refs

- [ADR-0045](0045-owned-by-receiver-for-cross-module-integration-events.md): la regla original, que este ADR complementa sin superar.
- [ADR-0030](0030-cross-bc-consistency-via-wolverine-outbox.md): el transporte (outbox durable de Wolverine) es el mismo para las dos clases.
- El anclaje de la reseña al `EnrollmentRecord`: la decisión del modelo anterior que crea la dependencia `Reviews → Enrollments`. Su ADR se retiró con esa versión, y hoy la reseña ancla a la cursada ([ADR-0082](0082-the-review-captures-the-cursada-in-three-layers.md)).
- La edición destructiva de una cursada que invalida su reseña: el caso que destapó la distinción. Su ADR también se retiró con la versión anterior.
