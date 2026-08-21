# ADR-0053: The shape of child collections in an aggregate

- **Estado**: aceptado
- **Fecha**: 2026-07-27

## Contexto

El proyecto venía guardando las colecciones hijas de sus aggregates de tres formas distintas sin criterio escrito:

- `reviews.tags` como `text[]` de Postgres.
- `commission_teachers` y `commission_schedules` como tablas hijas.
- `simulation_draft_items` como tabla hija.
- `historial_imports.raw_payload` y `career_plan_imports.payload` como `jsonb`.

Los dos últimos tienen su razón escrita ([ADR-0006](0006-jsonb-only-where-the-shape-is-variable.md): el shape es genuinamente variable). Los otros no. `tags` y `commission_schedules` cumplen exactamente el mismo test (lista corta de valores sin identidad propia, que nunca se filtra ni se joinea) y terminaron en formas opuestas, y nadie puede decir por qué.

La revisión de modelos de 2026-07-26 marcó esa inconsistencia como el síntoma de fondo: el proyecto **tenía** un criterio implícito y razonable, pero al no estar escrito se aplicaba distinto cada vez.

Además apareció el costo concreto de haber elegido tabla para las franjas de una comisión. Como `commission_teachers` y `commission_schedules` son dos tablas hijas independientes, joinear las dos en una sola query produce un cross product entre docentes y franjas. Los tres readers que las leen lo esquivaban igual: una segunda query plana y un reagrupado en memoria, con el mismo comentario explicando el workaround tres veces.

## Decisión

Una colección hija se guarda **embebida como documento `jsonb` en la fila del padre**, salvo que alguna lectura la **expanda a filas para joinear**. En ese caso va como tabla hija.

**El criterio se evalúa por colección, no por aggregate.** Un mismo aggregate puede tener una colección embebida y otra como tabla, porque la pregunta no es sobre el aggregate sino sobre cómo se lee cada colección.

### Por qué esa pregunta y no otra

Embeber gana cuando la colección se lee y se escribe entera con su padre: una query en lugar de dos, un `UPDATE` de una columna en lugar de `DELETE`-todos + `INSERT`-todos, y ningún reagrupado en memoria.

Embeber pierde en cuanto SQL necesita tratar cada hijo como una fila para cruzarlo con otra tabla, porque ahí hay que `jsonb_array_elements` antes de poder joinear: se paga la complejidad sin ganar nada.

### Cómo queda cada colección

| Colección | Forma | Por qué |
|---|---|---|
| `Commission.Schedules` | **Embebida** | Ninguna lectura las joinea: se leen por comisión y se formatean para display |
| `Commission.Teachers` | Tabla | Toda lectura las joinea contra `academic.teachers` para el nombre |
| `SimulationDraft.Items` | Tabla | El feed público los expande a filas para joinear contra materias, comisiones y cursadas |
| `Review.Tags` | `text[]` | Vocabulario cerrado de scalars sin identidad, nunca filtrado ni joineado. El array es la forma más simple que funciona; migrarlo a jsonb no compraría nada |
| `User.Tokens` | Tabla | **Contraejemplo importante**: `FindByVerificationTokenAsync` busca el aggregate **por el valor de un hijo**. Embeberlo convertiría un index scan en un scan de documentos |

`Commission` es el caso que muestra por qué el criterio va por colección: sus dos hijas se leen distinto, así que se guardan distinto. Partirla además resuelve el problema completo, porque el cross product existía por ser **dos** tablas hijas; con las franjas adentro de la fila, los docentes joinean normal y la doble query desaparece.

## Alternativas consideradas

### A. Todo tabla hija (el default de facto)

Rechazada porque es lo que produjo el costo actual: colecciones que nunca se joinean pagando una tabla, y aggregates con dos hijas independientes obligando al workaround del cross product. Además no explica `tags`, que ya era un array.

### B. Todo documento embebido

Rechazada. Aplicada a `Commission.Teachers` no ahorra el join: adentro del documento solo puede ir el `teacher_id`, porque las referencias cross-aggregate son ids planos ([ADR-0017](0017-persistence-ignorance.md)), así que igual hay que joinear contra `academic.teachers` para el nombre, ahora con un `jsonb_array_elements` en el medio. La única forma de que compensara sería embeber también el nombre, y ahí renombrar un docente obliga a reescribir el documento de todas sus comisiones: consistencia a cambio de nada.

### C. Caso por caso, sin regla

Es el status quo, y es lo que se está corrigiendo. Sin regla, la decisión la toma quien escribe la feature ese día, y el resultado es `tags` array y `schedules` tabla cumpliendo el mismo test.

### D. Extender ADR-0006 en lugar de un ADR nuevo

Rechazada porque responden preguntas distintas. ADR-0006 es sobre **shape desconocido** (el output de un parser, un diff de auditoría): ahí jsonb es la única opción razonable. Acá el shape se conoce perfectamente y lo que se decide es dónde vive.

## Consecuencias

### Positivas

- Desaparece la doble query y el reagrupado en memoria de los tres readers de comisiones, con su comentario repetido.
- Editar los horarios de una comisión pasa de `DELETE`-todos + `INSERT`-todos a un `UPDATE` de una columna.
- La próxima colección hija tiene una pregunta concreta que responder en lugar de un precedente contradictorio.

### Negativas

- **Se pierde el CHECK `end_time > start_time`** que la tabla hija tenía. Un CHECK de Postgres no puede recorrer un array `jsonb` sin una función `IMMUTABLE` aparte. Se compensa cerrando el bypass en vez de netearlo: `Commission.Hydrate` ahora valida y tira, y era el único camino de escritura que salteaba el aggregate (su único caller es el seeder). Es mejor que el CHECK, porque arregla el agujero en lugar de ponerle red, pero es un cambio de categoría respecto de [ADR-0052](0052-database-constraints-as-a-net-under-aggregate-invariants.md) y conviene tenerlo presente: **una colección embebida no puede tener red de DB barata**.
- El orden de las franjas dentro del documento es el de escritura, así que ordenarlas para display pasa a ser responsabilidad del lector (antes lo hacía un `ORDER BY`). Está resuelto en el parser de cada módulo.
- El shape del documento es un contrato entre la configuración EF que lo escribe y los readers Dapper que lo leen. Se fija explícitamente en el converter en lugar de dejar que EF elija, y se documenta en los dos lados.
- El parser del documento está duplicado entre Academic y Planning. Es deliberado: compartirlo obligaría a que Planning referencie infraestructura de otro módulo, que es lo que los boundaries impiden. Mismo criterio que la detección de solapes, duplicada a propósito en los dos dominios.

## Cuándo revisitar

- Si aparece una lectura que necesite filtrar comisiones **por franja** (por ejemplo "qué se dicta los martes a la mañana"), las franjas vuelven a ser candidatas a tabla: eso es exactamente la cláusula de excepción.
- Si `SimulationDraft.Items` deja de expandirse a filas en el feed público (por ejemplo si el feed pasa a un read model materializado), vuelve a ser candidato a embeberse.

## Refs

- [ADR-0006](0006-jsonb-only-where-the-shape-is-variable.md): jsonb cuando el shape es variable. Pregunta distinta, no se superpone.
- [ADR-0017](0017-persistence-ignorance.md): las referencias cross-aggregate son ids planos, que es lo que hace inútil embeber los docentes.
- [ADR-0052](0052-database-constraints-as-a-net-under-aggregate-invariants.md): la red de constraints, con la que este ADR tiene una tensión explícita (ver Consecuencias).
