# ADR-0052: Database constraints as a net under the aggregate invariants

- **Estado**: aceptado
- **Fecha**: 2026-07-26

## Contexto

El proyecto venía replicando invariantes del dominio como constraints de Postgres, con la razón escrita en el código. `SubjectConfiguration` lo dice explícito ("los inserts via seed bypassean `Subject.Create`"), `ReviewConfiguration` lo llama "defensa adicional contra writes que bypassean el aggregate", y `ReviewConfiguration` / `EnrollmentRecordConfiguration` / `CommissionConfiguration` / `ReviewReportConfiguration` usan índices únicos parciales como "belt + suspenders".

Pero se aplicaba por costumbre, no por criterio, y la revisión de modelos de 2026-07-26 encontró los agujeros que eso deja:

- **Planning**: "un solo plan vigente por (alumno, período)" lo sostenía solamente el handler, que lee "¿hay otro Active?" y después escribe. Dos promotes concurrentes de borradores distintos ven los dos que no hay ninguno y commitean los dos. El estado que queda es pegajoso: el próximo promote archiva uno solo, así que el segundo activo sobrevive para siempre.
- **Identity**: "un solo token activo por (user, purpose)" (ADR-0033) estaba documentado en el data-model con su shape exacto y no existía en la base. Dos resend concurrentes dejan dos tokens vivos, lo que rompe la garantía que hace seguro reenviar un mail: pedir un link nuevo mata el anterior.
- **Enrollments**: el `UNIQUE(alumno, materia, período)` no restringía nada cuando el período era nulo, porque en Postgres dos NULL son distintos entre sí.
- **Reviews**: el rango de largo del texto era el único invariante del aggregate sin CHECK, y el read path lo asumía: el value converter hace `.Value` sobre un `Result` que puede fallar, así que una fila fuera de rango no daba un error de dominio, reventaba al materializar.
- **Planning y Moderation**: CHECKs que el data-model declaraba y la base no tenía, con un reader desreferenciando uno de ellos.

El patrón común: **el aggregate no puede sostener lo que no ve.** No ve las otras filas, y no ve los caminos de escritura que no pasan por él.

## Decisión

Un invariante lleva red en la base cuando cae en alguna de estas dos categorías. Si no cae en ninguna, alcanza el aggregate.

### 1. Cruza filas

El aggregate valida una instancia; la unicidad entre instancias es, por definición, algo que no puede ver. Todo invariante de la forma "no puede haber dos X con la misma Y" va con **índice único** (parcial si aplica solo a un subconjunto).

El chequeo previo en el handler **se queda**: es el que produce el error específico y accionable ("ya reportaste esta reseña"). El índice es el piso para cuando la carrera gana, no su reemplazo.

### 2. Hay un camino de escritura que no pasa por el aggregate

Seeders que usan `Hydrate`, SQL manual, backfills, migraciones de datos. Va con **CHECK**, y con más razón si algún read path asume el invariante: ahí la violación no se manifiesta como dato raro sino como excepción de materialización o como 500 de una página entera.

### Las violaciones son 409, no 500

Un `UniqueViolationExceptionHandler` en el host traduce SQLSTATE 23505 a 409 con ProblemDetails. Sin él, la red se manifestaba como un 500 con stack en el log, y dos comentarios del código prometían un 409 que nadie producía.

### Lo que NO lleva red

Invariantes puramente intra-aggregate, alcanzables solo a través del aggregate, cuya violación tiene consecuencia acotada. Ejemplo que se dejó afuera a propósito: el no-solape entre franjas horarias de una comisión necesitaría un `EXCLUDE` con `btree_gist`, y la extensión no se justifica para algo que hoy solo el seeder puede violar. El rango invertido (`end_time > start_time`) sí lleva CHECK, porque su consecuencia no es acotada: el detector de choques compara `a.Start < b.End && b.Start < a.End`, así que contra un rango invertido nunca marca conflicto y el alumno ve una grilla imposible sin ninguna señal.

## Alternativas consideradas

### A. Solo el aggregate (el status quo de Planning e Identity)

Rechazada por lo que la revisión encontró: un aggregate no puede enforcar unicidad entre filas ni alcanzar a los writes que no pasan por él. No es una cuestión de rigor, es que la información no está ahí.

### B. Solo la base, sacando los chequeos de aplicación

Rechazada. El error de Postgres es genérico y llega cuando la transacción ya está condenada; no puede decir "ya reportaste esta reseña" ni distinguir cuál de tres uniques falló en términos del dominio. Además obligaría a mapear cada constraint a un mensaje, que es peor duplicación que el chequeo previo.

### C. Constraints deferrables para que el orden de escritura no importe

Rechazada por una limitación real de Postgres: los índices únicos **parciales** no se pueden diferir (solo los unique constraints, que a su vez no pueden ser parciales). Y casi todas las redes que hacían falta acá son parciales, porque aplican a un subconjunto (solo los Active, solo los tokens vivos).

Consecuencia a tener presente, y no es teórica: **dentro de una misma transacción el orden de escritura importa, y EF no garantiza cuál elige.**

- **Token de verificación**: el aggregate invalida el anterior e inserta el nuevo en el mismo `SaveChanges`. Se verificó que EF emite el UPDATE antes del INSERT y el índice no se viola. Cubierto por `A_second_request_for_the_same_user_invalidates_the_first_resent_token`.
- **Promote de borrador**: acá sí mordió. El handler marcaba el borrador nuevo como `Active` y archivaba el anterior en el mismo `SaveChanges`. EF ordena los UPDATE por clave, que es un Guid aleatorio, así que **cerca de la mitad de las veces** emitía primero el que crea el segundo `Active` y el índice abortaba. El síntoma era un promote que fallaba de forma intermitente con un 409 indistinguible de un conflicto legítimo, y apareció recién al correr la suite completa dos veces.

  El arreglo es archivar primero y flushear, y recién después promover: la ventana pasa por cero `Active`, nunca por dos. Los dos `SaveChanges` siguen dentro de la misma transacción, así que la atomicidad no cambia.

La lección general: cuando un índice parcial cubre una transición de estado que mueve **dos filas a la vez**, el handler tiene que ordenar las escrituras de forma explícita en lugar de confiar en el orden que elija el ORM.

### D. Advisory locks o SERIALIZABLE en los handlers con carrera

Rechazada: mueve una garantía de integridad de datos a una configuración de concurrencia, que es más fácil de desactivar sin querer y más difícil de auditar. Un índice es declarativo y visible en el schema.

## Consecuencias

**Positivas**

- Los invariantes que el data-model declara pasan a ser verdad verificable contra `pg_constraint` y `pg_indexes`, no promesas del doc.
- Las carreras que el chequeo previo no puede cerrar dejan de producir estado corrupto silencioso y pasan a producir un 409.
- Los caminos de escritura que saltean el dominio (seeders, fixes manuales) dejan de poder introducir datos que el dominio rechazaría.

**Negativas**

- `NULLS NOT DISTINCT` en el unique de cursadas convierte "sin cuatrimestre conocido" en un solo bucket por (alumno, materia): un alumno que cursó dos veces la misma materia sin saber ninguno de los dos períodos no puede cargar la segunda. Se eligió así porque esa segunda fila es indistinguible de un duplicado (el dato no lleva la diferencia), y admitirla es admitir duplicados sin límite ni forma de detectarlos, que es lo que ensucia el pass rate público. La salida es informar el período, que hoy exige un alta nueva porque no existe edición de cursadas.
- Un CHECK nuevo puede fallar al migrar si hay datos viejos que lo violan. Es una característica, no un defecto, pero obliga a mirar los datos antes de agregarlo.
- El orden de escritura dentro de una transacción pasa a importar donde antes no importaba (ver alternativa C).

## Cuándo revisitar

- Si aparece un invariante de no-solape con consecuencias reales fuera del seeder, evaluar `btree_gist` y un `EXCLUDE`.
- Si aterriza la edición de cursadas, revisar el trade-off de `NULLS NOT DISTINCT`: con una forma de corregir el período, rechazar la segunda carga deja de ser un callejón.

## Refs

- [ADR-0017](0017-persistence-ignorance.md): sin FK cross-schema. Este ADR es sobre constraints **intra**-schema, que ADR-0017 explícitamente mantiene.
- [ADR-0033](0033-verification-token-as-a-child-entity.md): el invariante de un token activo por purpose, que acá recibe su red.
- [ADR-0047](0047-public-pass-rate-from-private-enrollment-history.md): el pass rate público, que es lo que los duplicados de cursada ensucian.
