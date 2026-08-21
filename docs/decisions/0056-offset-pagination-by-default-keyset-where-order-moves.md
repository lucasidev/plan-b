# ADR-0056: Offset pagination by default, keyset where the order moves

- **Estado**: aceptado
- **Fecha**: 2026-07-27 (registra una decisión ya vigente, tomada de a pedazos entre S9 y S11)

## Contexto

planb tiene tres listados paginados y no usan la misma técnica:

| Listado | Técnica | Orden |
|---|---|---|
| Feed de reseñas (`GET /api/reviews`, US-048) | `OFFSET`/`LIMIT` + `COUNT(*) OVER ()` | `created_at DESC` |
| Cola de moderación (`GET /api/moderation/reports`, US-050) | `OFFSET`/`LIMIT` | `created_at` |
| Feed de simulaciones compartidas (`GET /api/planning/simulations/public`, US-027) | keyset sobre `(shared_at, id)` | `shared_at DESC, id DESC` |

La diferencia no estaba escrita en ningún lado. Se decidió dos veces, en dos sprints distintos, y quien mira el código hoy no tiene cómo saber si el keyset del feed público es la técnica preferida que todavía no se propagó, o si es la excepción. La revisión de modelos de 2026-07-26 lo marcó como decisión sin registro: no está mal implementado, está sin decidir.

El punto no es de performance. Con los volúmenes del MVP (decenas de reseñas por materia, una cola de moderación que si tiene 200 items ya es una emergencia operativa) `OFFSET 40` no le cuesta nada a Postgres. El punto es de **corrección de la lectura**: con offset, si entran filas nuevas arriba mientras el usuario pagina, la página 2 repite lo que ya vio y se saltea lo que no. El usuario no ve un error, ve un feed que le miente.

## Decisión

**Offset por default. Keyset cuando el tope de la lista se mueve mientras el usuario está paginando.**

El discriminador es una sola pregunta: **¿entran filas nuevas por el mismo extremo por el que el usuario está leyendo?**

- **Sí** (feed público ordenado por lo más reciente): keyset. Cada reseña o simulación nueva empuja todo hacia abajo, así que un offset fijo apunta a otra fila en cada request.
- **No** (cola de moderación, listados de backoffice, cualquier cosa que el admin recorre entera): offset. Es más simple, permite saltar a una página arbitraria y devolver el total, que es exactamente lo que necesita una vista de gestión ("hay 47 reportes abiertos, mostrame el 3 de 5").

Corolarios que forman parte de la decisión:

1. **El cursor de keyset es compuesto y lleva un desempate.** `(shared_at, id)` y no `shared_at` solo: dos simulaciones compartidas en el mismo milisegundo dejarían filas invisibles o repetidas. Cualquier keyset nuevo tiene que terminar en una columna única.
2. **Keyset no devuelve total.** Contar la lista entera para dárselo al cliente anula la razón por la que se eligió keyset. El feed responde "hay más" con la presencia de un cursor siguiente, no con un número.
3. **El total del offset sale de `COUNT(*) OVER ()`**, en la misma query y no en una segunda. Es un window function sobre el mismo scan.

## Alternativas consideradas

### A. Keyset en todos lados

Rechazada por costo sin beneficio en las vistas de gestión. El backoffice necesita "página 3 de 12" y saltar a la última; con keyset eso exige recorrer las páginas intermedias o inventar un esquema de cursores por página. La cola de moderación además se ordena por antigüedad ascendente y las filas nuevas entran por el otro extremo del que se lee, así que el problema que keyset resuelve ahí no existe.

### B. Offset en todos lados

Rechazada porque es exactamente el bug que motiva la distinción. El feed público de simulaciones se ordena por `shared_at DESC`: es el caso de libro donde offset saltea filas. Y no es hipotético en un producto cuyo valor depende de que varios alumnos compartan su plan en la misma semana de inscripción.

### C. Cursor opaco (base64 del último registro) en vez de parámetros explícitos

Rechazada para el MVP. Un cursor opaco es mejor contrato público (el cliente no puede fabricarlo ni depender de su forma) pero agrega codificación, validación y un modo de falla nuevo, para un frontend que es el único consumidor y vive en el mismo repo. Si aparece un consumidor externo o un cambio de clave de orden, vale revisarla.

### D. Paginación por rango de fechas ("mostrame la semana pasada")

Rechazada: no es paginación, es filtro. Resuelve navegar el archivo, no leer una lista larga de corrido, y no evita ninguno de los dos problemas de arriba.

## Consecuencias

**Positivas**

- La pregunta "¿qué técnica uso acá?" tiene una respuesta de una línea que no depende de quién esté escribiendo el endpoint.
- El feed público no repite ni saltea reseñas mientras alguien pagina, que es el único lugar donde el usuario podía notar el problema.

**Negativas**

- Conviven dos técnicas, así que hay dos formas de leer un listado paginado en el código. Es el costo de que el discriminador sea real y no una preferencia uniforme.
- Un endpoint que hoy es offset y mañana pasa a ordenarse por recencia hay que migrarlo, y migrar cambia el contrato HTTP (de `page` a `cursor`). No hay forma de que ese cambio sea invisible para el frontend.

**A vigilar**

- Si el feed de reseñas gana un orden "más recientes primero" como default real (hoy es `created_at DESC` pero el volumen por materia es chico), pasa a cumplir el criterio de keyset y hay que migrarlo. Es el candidato más probable a cambiar de lado.
- `COUNT(*) OVER ()` deja de ser gratis cuando el `WHERE` no está indexado y el scan es grande. Con volumen real, medir antes de asumir que el total sale gratis.

## Refs

- [`DapperPublicSimulationsReader`](../../backend/modules/planning/src/Planb.Planning.Infrastructure/Persistence/Queries/DapperPublicSimulationsReader.cs): el keyset, con el desempate por id explicado en el propio SQL.
- [`DapperBrowseReviewsQueryService`](../../backend/modules/reviews/src/Planb.Reviews.Infrastructure/Persistence/Queries/DapperBrowseReviewsQueryService.cs) y [`DapperReportQueueReader`](../../backend/modules/moderation/src/Planb.Moderation.Infrastructure/Reading/DapperReportQueueReader.cs): los dos offset.
- [ADR-0018](0018-ef-core-writes-dapper-reads.md): por qué estos tres listados son SQL a mano y no LINQ.
