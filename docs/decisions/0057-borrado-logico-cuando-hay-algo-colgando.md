# ADR-0057: Borrado lógico cuando hay algo colgando, borrado real cuando no

- **Estado**: aceptado
- **Fecha**: 2026-07-27 (registra una decisión ya vigente, aplicada de forma implícita desde S6)

## Contexto

En planb casi nada se borra de verdad, y las cosas que se borran lo hacen de tres formas distintas:

| Entidad | Cómo desaparece | Marca |
|---|---|---|
| University, Career, Subject, Teacher, Commission | Archivar / reactivar | `is_active BOOLEAN` |
| CareerPlan | Deprecar / reactivar | `status` (`active` / `deprecated`) |
| Review | Borrado del autor o remoción de moderación | `status` (`deleted` / `removed`) + `deleted_at` + `deleted_reason` |
| User | Baja de cuenta con anonimización de PII | `disabled_at` + hash del email ([ADR-0044](0044-soft-delete-del-user-con-preservacion-de-corpus.md)) |
| Prerequisite | `DELETE` | ninguna |
| SimulationDraft | `DELETE` | ninguna |

Tres mecanismos (`is_active`, un `status` del ciclo de vida, y `DELETE`) sobre el mismo verbo de la UI ("eliminar"). Nunca se escribió cuál corresponde a qué, así que cada entidad nueva se resuelve por imitación de la más cercana, y la revisión de modelos de 2026-07-26 lo listó entre las decisiones sin registro.

El costo de no tenerlo escrito no es estético. Se manifestó dos veces:

- El catálogo público **no filtraba `is_active`** en universidades ni carreras. Archivar una universidad no tenía ningún efecto visible y un alumno podía seguir haciendo onboarding contra ella. La columna existía, la acción del admin existía, y no significaba nada.
- Un docente archivado **se podía asignar a comisiones nuevas**, porque el handler chequeaba `subject.IsActive` y no `teacher.IsActive`. Archivar lo sacaba de la búsqueda y lo devolvía a la superficie por la puerta de atrás.

Los dos son la misma falla: soft delete es un contrato entre la escritura y **todas** las lecturas, y sin el contrato escrito las lecturas se olvidan de cumplirlo.

## Decisión

**Se borra de verdad solo lo que nadie referencia y nadie va a querer ver después. Todo lo demás se archiva.**

El discriminador es una sola pregunta: **¿queda algo apuntando a esta fila, o algo que se calcula a partir de ella?**

- **Sí** (una cursada apunta a la comisión, una reseña apunta al docente, un plan apunta a la materia): archivar. Borrar deja referencias colgando que ninguna FK protege, porque las refs cross-módulo son Guids planos sin constraint ([ADR-0017](0017-persistence-ignorance.md)).
- **No** (una correlativa, un borrador privado de simulación): `DELETE`. Guardar una fila que nadie va a leer nunca es acumular ruido y un caso más que filtrar en cada query.

Y tres reglas de cómo se archiva:

1. **`is_active` para "existe pero ya no se ofrece"; un `status` cuando el ciclo de vida tiene más de dos estados.** `CareerPlan` es `active`/`deprecated` porque deprecar no es lo mismo que archivar (el plan sigue siendo el de los alumnos que ya cursan). `Review` tiene `status` porque distingue quién lo bajó: `deleted` es el autor, `removed` es moderación, y esa diferencia decide qué se puede hacer después.
2. **Toda lectura pública filtra la marca. Toda lectura de backoffice no.** El admin necesita ver lo archivado para poder reactivarlo, así que los readers de admin traen todo con su estado. Los públicos filtran. Cuando un reader admin y uno público conviven, el docstring de cada uno dice cuál es cuál.
3. **Archivar no libera el identificador.** Los UNIQUE del catálogo son sobre todas las filas, no parciales sobre las activas. Archivar la comisión "A" de una materia y un período no permite crear otra "A": la salida correcta es reactivar la que ya existe, y para eso está el listado admin. El único parcial es el de `Review`, y ahí es deliberado: una reseña borrada libera la cursada para volver a reseñarla, que es la funcionalidad.

## Alternativas consideradas

### A. Soft delete universal (todo lleva `deleted_at`)

Rechazada. Es la opción que parece más consistente y termina siendo la más cara: cada query del sistema arrastra un `WHERE deleted_at IS NULL` que alguien se va a olvidar, y esa omisión es silenciosa (muestra de más, no falla). Con la tabla de arriba, los dos casos de hard delete son entidades que nadie referencia; pagar el filtro global por ellas no compra nada.

### B. Query filter global de EF Core (`HasQueryFilter`)

Rechazada, y es la que más tentaba porque automatiza la regla 2. No aplica acá: los reads que importan son Dapper ([ADR-0018](0018-ef-core-writes-dapper-reads.md)), y un query filter de EF no toca una línea de SQL escrita a mano. Habría automatizado el camino donde el problema no estaba, dando la sensación de que estaba resuelto en todos.

### C. Tabla de archivo (mover la fila a `*_archived` al borrar)

Rechazada. Duplica el schema, y las referencias colgadas apuntarían a filas que ya no están en la tabla original: sería un hard delete disfrazado, con el mismo problema y el doble de mantenimiento.

### D. Hard delete con `ON DELETE RESTRICT`

Rechazada porque no es implementable: las referencias que importan cruzan schemas de módulos distintos y por ADR-0017 no llevan FK. No hay constraint que restrinja, así que el borrado real no tendría ninguna red.

## Consecuencias

**Positivas**

- La pregunta "¿esto se borra o se archiva?" se responde mirando si algo la referencia, no imitando a la entidad de al lado.
- Queda explícito que el soft delete obliga a las lecturas, que es donde se rompió las dos veces.

**Negativas**

- Cada lectura pública nueva sobre una entidad archivable tiene que acordarse de filtrar, y olvidarse no falla: muestra de más. Es el modo de falla que hay que aceptar al no tener un filtro global.
- Los UNIQUE sobre todas las filas hacen que un nombre archivado quede tomado. Para el admin eso se lee como un 409 confuso hasta que encuentra la fila archivada en el listado.

**A vigilar**

- Si aparece una entidad archivable cuyo nombre **sí** deba poder reusarse después de archivar, ahí el UNIQUE tiene que pasar a parcial, y con eso hay que revisar qué otra cosa se apoyaba en su unicidad total (como se apoya hoy la reseña en su índice parcial).
- Reactivar no revalida nada. Reactivar una comisión de un período que ya pasó, o un docente de una universidad que se archivó, hoy no lo frena nadie.

## Refs

- [ADR-0044](0044-soft-delete-del-user-con-preservacion-de-corpus.md): el caso más elaborado (baja de cuenta con anonimización de PII y preservación del corpus de reseñas), que este ADR generaliza al resto.
- [ADR-0052](0052-constraints-de-db-como-red-de-invariantes.md): por qué los UNIQUE viven en la base además del aggregate.
- [`docs/architecture/data-model.md`](../architecture/data-model.md): qué marca lleva cada entidad.
