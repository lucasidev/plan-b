# ADR-0007: pgvector deferred until there is a real consumer, UI gated off until there is volume

- **Estado**: aceptado, con la infraestructura diferida (ver [Revisión](#revisión-2026-07-26))
- **Fecha**: 2026-04-22
- **Nota**: el filename conserva el slug original (`pgvector-implementado-ui-gated-off`) porque los links del repo apuntan a él. El título dice el estado vigente, no el original.

## Contexto

La carpeta del proyecto lista "análisis de temas recurrentes en reseñas" como feature MVP tardío: clustering semántico y búsqueda por similitud sobre texto libre de reseñas. La implementación natural es con embeddings y un vector store.

Hay tres decisiones anidadas:

1. ¿Se habilita la infraestructura (extension, tabla, pipeline de generación de embeddings) desde el inicio, o recién cuando se implemente la feature UI?
2. ¿Qué modelo de embeddings se usa?
3. ¿Cómo se controla que la feature no se exponga en UI mientras no haya data suficiente para producir resultados útiles?

## Decisión

**Infraestructura completa desde el inicio, feature UI gated off:**

- Extensión `pgvector` habilitada en la migración inicial.
- Tabla `ReviewEmbedding(review_id, source, model_name, model_version, embedding, created_at)` creada desde day 1. Tabla aparte de Review (no columna embebida) para permitir re-embeber al cambiar modelo sin tocar la reseña original.
- Pipeline de generación: al publicar reseña, se encola un job async que genera el embedding y lo persiste. Worker implementado como `IHostedService` in-process con `Channel<Guid>` (sin infra externa).
- **Modelo**: `intfloat/multilingual-e5-base`: 768 dimensiones, open source, multilingüe (español incluido), ejecución local sin costos por token.
- **Gating de UI**: los endpoints que usan embeddings (búsqueda semántica, clustering) retornan `404` o `"feature not available"` mientras `COUNT(Reviews WHERE status='published') < threshold` (configurable, default 200). Cuando se supera el umbral, se levanta el gate con un config change, sin deploy de código.

## Alternativas consideradas

### A. No meter pgvector hasta que se implemente la feature
Más simple al inicio. Descartada porque:

- El pipeline de generación de embeddings debe correr desde que se publica la primera reseña, sino hay que backfilllear N reseñas cuando se active la feature. Backfill tiene sus propios problemas (rate limits si se usa API externa, presión sobre DB).
- Tener la infra lista desde el inicio permite iterar sobre el pipeline y detectar issues temprano con data real de reseñas.

### B. OpenAI `text-embedding-3-small` (1536 dims)
Calidad ligeramente superior. Descartada por costo (la universidad comparte la propiedad del proyecto sin aportar recursos: ver memoria de contexto de Lucas). El modelo open source e5-multilingual es suficiente para el caso de uso (clustering de reseñas en español).

### C. Embedding como columna en Review
Más simple, menos joins. Descartada porque:

- No permite versionar modelos: si se cambia de e5-base a e5-large-v2, se pierde el embedding viejo al sobreescribir.
- Bloatea lecturas de Review que no necesitan el vector.
- Impide múltiples embeddings por reseña (ej. `subject_text` y `teacher_text` embebidos por separado) sin migración.

### D. Feature UI prendida desde el inicio
Descartada porque con 5-10 reseñas, el clustering produce ruido. El output le hace daño a la credibilidad del producto. El gate garantiza que la feature se presenta cuando ya funciona.

## Consecuencias

**Positivas:**
- El día que haya volumen suficiente, la feature se prende con un config change. No hay backfill, no hay deploy, no hay sorpresas.
- Versionado de modelos desde el inicio: cambiar modelo es agregar una row con `model_name` distinto y re-embeber selectivamente.
- Costo monetario de operación: $0 (el modelo corre local).

**Negativas:**
- Se invierte tiempo de desarrollo en infraestructura cuya feature UI no se expone inmediatamente. El profesor puede preguntar por qué.
- Storage: ~3 KB por embedding de 768 dims (float32). Con 10.000 reseñas, ~30 MB. Manejable pero no despreciable.
- Hay que decidir dónde corre el modelo (ONNX en proceso .NET vs sidecar Python). Decisión pendiente para la fase de implementación.

**Cuándo revisitar:**
- Si la ejecución del modelo local resulta demasiado costosa en CPU/latencia para el tráfico esperado.
- Si aparece un modelo open source claramente superior para español.
- Si el threshold default (200 reseñas) resulta muy bajo o muy alto en la práctica.

## Revisión (2026-07-26)

**Lo que este ADR decidió no se construyó, y el argumento que lo justificaba dejó de sostenerse.**

Lo que sí existe en el código: la extensión `vector` habilitada, `UseVector()` en el wiring de Npgsql, un handler stub que loguea y sale, y la tabla documentada en el data model. Lo que no existe: la tabla `review_embeddings`, la entidad, el repositorio, el índice HNSW y el pipeline de generación. Una consulta a `pg_attribute` por columnas de tipo `vector` devuelve cero filas.

El argumento central para rechazar la alternativa A era: "si no arranca desde la primera reseña, hay que backfillear N reseñas cuando se active la feature". Ese backfill ya es inevitable, porque ninguna reseña publicada desde la migración inicial tiene embedding. Y la premisa se dio vuelta: mientras el corpus siga chico, el backfill es barato, así que la razón para pagar la infra temprano se debilitó en lugar de crecer.

**Decisión: se borra el andamiaje** (extensión, `UseVector()`, el handler stub y la sección de `ReviewEmbedding` del data model) hasta que exista un consumidor real. Prender `Reviews:Embeddings:Enabled` hoy no hacía nada más que loguear un warning por reseña publicada: el andamiaje no era una feature gateada, era una feature ausente con apariencia de gateada, y eso es peor que no tener nada, porque quien lee el ADR asume que activarla es cambiar un flag.

Lo que **sigue en pie** para cuando la feature se retome: el modelo elegido y su razón de costo (alternativa B), la tabla aparte en lugar de columna embebida (alternativa C), y el gating por volumen (alternativa D). Nada de eso se cuestiona. Lo único que cambia es cuándo se construye, y que el backfill pasa de "evitado" a "asumido".
