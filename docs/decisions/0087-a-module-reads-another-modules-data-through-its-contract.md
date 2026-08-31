# 0087: A module reads another module's data through its contract

- **Estado**: aceptado
- **Fecha**: 2026-08-31

## Contexto

[ADR-0017](0017-persistence-ignorance.md) sacó las FK y la navegación EF entre módulos, y dejó abierto cómo un módulo obtiene datos que otro posee. Sus consecuencias nombran dos caminos, "read models denormalizados mantenidos por integration events, o Dapper cross-schema saltando el DbContext", y dicen que ambos son válidos. El ejemplo que los motivaba era el dashboard institucional, que se retiró con la versión anterior del producto ([ADR-0063](0063-the-product-is-a-pressure-instrument.md)).

Esa apertura se leyó como permiso general. Al 2026-08-31, dos de los cinco reads de `reviews` cruzaban a `academic`: el de la ficha de carrera, para contar, y el de "mis aportes", solo para traer nombres. El segundo lo justificaba un comentario: pedírselos al contrato sería un N+1. Es N+1 pidiéndolos de a uno; con la lista de ids es una llamada.

El costo de cruzar no es teórico. Un `JOIN academic.subjects` es una dependencia al esquema físico de otro módulo que ningún compilador chequea: cuando `academic` renombra una columna, rompe `reviews`, en runtime, en producción, en un módulo que nadie tocó.

## Decisión

**Para mostrar, contrato. Para filtrar, ordenar o paginar, proyección propia. El JOIN cross-schema no se usa.**

1. Si un módulo necesita datos de otro **solo para mostrarlos** (un nombre, un código, una etiqueta), se los pide a su contrato `I<Module>QueryService`, **en lote**, con la lista de ids que la pantalla ya sabe que necesita. Nunca de a uno.
2. Si necesita **filtrar, ordenar o paginar** por un dato ajeno, el contrato no alcanza: obligaría a traerse el otro módulo entero a memoria. Ahí corresponde una proyección propia, mantenida por integration events.
3. **Un valor que gatilla una regla del producto no se sirve desde una proyección.** El conteo de reseñas decide si una cátedra publica ([ADR-0082](0082-the-review-captures-the-cursada-in-three-layers.md)): un valor viejo publica una cátedra que todavía no debía, y eso expone a quien reseñó. Ese número se cuenta en el momento.
4. Cuando el contrato queda al límite (el filtro cruza pero está acotado por una entidad, como las materias de una carrera), se resuelve componiendo dos llamadas en el handler. El módulo que posee el dato decide qué cuenta como vigente; el otro cuenta sobre los ids que recibe.

## Alternativas consideradas

**A. JOIN cross-schema en el read de Dapper.** Lo que había. Una sola consulta y ningún viaje extra, y por eso se eligió. Se descarta como default porque la dependencia que crea es invisible: no la ve el compilador, no la ven los tests de arquitectura (que analizan ensamblados, no strings de SQL), y no la ve la query estándar de foreign keys sin índice del wiki de Postgres, porque acá no hay constraints que cruzar. Se manifiesta cuando el otro módulo cambia, y ahí ya es tarde.

**B. Proyección desnormalizada mantenida por eventos, como default.** Es la recomendación de una de las tres fuentes consultadas, y desacopla de verdad. Se descarta **como default** por el costo: duplica el dato, necesita un contrato de evento por cada cosa que se copia, un camino de rebuild cuando la proyección driftea, y vuelve todo eventualmente consistente. Para un nombre esa consistencia eventual es gratis; para un número que gatilla una regla, no (punto 3 de la decisión). Sigue siendo la respuesta correcta al caso 2, y ahí se usa.

**C. Que el frontend componga.** Pedir los ids a un endpoint y los nombres a otro, y unirlos en la pantalla. Se descarta porque mueve una decisión del backend a cada consumidor: dos pantallas que muestran lo mismo pueden unirlo distinto, y el contrato deja de ser una sola cosa.

## Consecuencias

**Positivas:**

- La frontera entre módulos pasa a ser una interfaz de C#. Un renombre en `academic` rompe en compilación y no en producción.
- El contrato dice qué expone cada módulo. Un JOIN no dice nada: cualquiera puede leer cualquier tabla y nadie se entera.
- Cada módulo puede cambiar su esquema físico sin avisarle a nadie, que es lo que ADR-0017 buscaba y esta decisión termina de cerrar.

**Negativas:**

- Un viaje más a la base por pantalla. Acotado y medible: una llamada en lote, no una por fila.
- El contrato del módulo crece. Se contiene con la regla que ya tiene `IAcademicQueryService`: cada método responde a un caller real, y devuelve lo que ese caller necesita, no la entidad entera.
- Un id que el otro módulo no tiene deja de romper la consulta y pasa a ser una ausencia que el handler decide cómo mostrar. Es más código, y es más honesto: la materia declarada y todavía sin vincular ([US-197](../product/team/sustain-the-catalog/stories/US-197-link-declared-subjects-to-canonical/README.md)) existe, y su reseña tiene que poder verse igual.

**Reglas derivadas:**

- Un read de Dapper nombra tablas de **un solo** schema. Si nombra dos, o le falta una llamada al contrato, o le corresponde una proyección.
- Los métodos de contrato que traen etiquetas reciben **colecciones de ids**, no ids sueltos.
- La consecuencia de ADR-0017 que decía "ambos son válidos" queda reemplazada por este registro.

## Cuándo revisitar

Cuando una pantalla necesite ordenar o paginar por un dato de otro módulo. Ese es el caso 2 y todavía no existe construido: lo va a traer publicar las voces y la cobertura en cada fila del catálogo ([US-222](../product/student/choose-where-to-study/stories/US-222-browse-what-there-is-to-study/README.md)), donde la clave de orden la posee `reviews` y la lista de entidades `academic`. Ahí se escribe la primera proyección y se decide con qué evento se mantiene.
