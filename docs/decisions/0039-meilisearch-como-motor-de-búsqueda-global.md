# ADR-0039: Meilisearch como motor de búsqueda global

- **Estado**: aceptado
- **Fecha**: 2026-05-02

## Contexto

El rediseño UX (claude-design) suma una **búsqueda global** como dropdown desde el topbar: el usuario tipea "Brandt" o "ISW302" y obtiene resultados agrupados (Recientes / Docentes / Materias / Comisiones) con highlight del query y atajos de teclado.

Hoy el stack tiene **Postgres 17** + **pgvector 0.8** + **Redis 7**. La búsqueda básica se podría resolver con Postgres FTS + `pg_trgm` (fuzzy matching) + pgvector (similarity semantic). El producto necesita:

1. **Typo tolerance** ("brnadt" debe encontrar "Brandt").
2. **Ranking por relevancia** dependiente del query (no sólo recencia ni popularidad).
3. **Faceted search** (filtrar por universidad / carrera / tipo de entidad).
4. **Search-as-you-type** con baja latencia (≤ 50ms p95) en el dropdown.
5. **Multi-entity** (materias, docentes, comisiones, eventualmente reseñas).

Postgres + pg_trgm cubre 1, 2 y 3 con configuración no trivial; con índices GIN + `tsvector` y similarity threshold ajustable se puede llegar lejos. La pieza débil es la latencia de search-as-you-type bajo carga: cada keystroke dispara un query SQL y los rankings de relevancia se calculan en tiempo real.

Los motores dedicados (Elasticsearch, Meilisearch, Typesense) están diseñados específicamente para search-as-you-type con latencia baja, typo tolerance built-in y ranking tunable sin escribir SQL. El trade-off es operacional: servicio nuevo, mantener un índice sincronizado con Postgres, gestionar versiones / mappings.

## Decisión

**Adoptar Meilisearch como motor de búsqueda global**. Postgres se mantiene como source of truth; Meilisearch es derivación indexada para reads de búsqueda. Sincronización via outbox cross-BC (mismo pattern que ya está en Wolverine, ADR-0030).

### Características de Meilisearch que justifican la elección

- **Footprint chico**: ~50 MB RAM en idle, ~150 MB con índices del orden esperado en MVP (10k materias + 5k docentes + 50k reseñas). Compara contra ~1.5 GB de Elasticsearch en mínimos razonables.
- **Operación simple**: un único binario / container, sin cluster setup ni JVM tuning. Defaults sanos out of the box.
- **API HTTP RESTful** con SDK oficial .NET (`Meilisearch.NET`) y JS (`meilisearch-js`).
- **Open source**: licencia MIT. Stack completo self-hosted, alineado con la regla de no servicios pagados.
- **Typo tolerance**: configurable por field, sin tuning de analizadores. "brnadt" matchea "Brandt" out of the box.
- **Ranking tunable**: rules ordenadas (typos → words → proximity → attribute → sort → exactness → custom). Reordenable en runtime sin reindex.
- **Faceted search**: filtros boolean + ranges. Suficiente para "filtrar por universidad / tipo".
- **Latencia**: docs oficiales reportan p95 < 50ms para datasets < 10M documents. Para el volumen del MVP (~100k documents incluyendo reseñas) está sobrado.

### Pipeline de indexing

```
Postgres (source of truth)
  ↓
Domain events (Subject created, Teacher updated, Review approved, etc.)
  ↓
Wolverine outbox → handler que indexa en Meilisearch
  ↓
Meilisearch (read-side de búsqueda)
```

- Cada bounded context publica eventos cuando los datos buscables cambian (Subject, Teacher, Commission en Academic; Review en Reviews).
- Handlers en un módulo dedicado (probablemente `Planb.Search` o sumado a un cross-cutting layer) consumen los eventos y actualizan los índices.
- Los índices están separados por entidad: `subjects`, `teachers`, `commissions`, `reviews`. El frontend orquesta queries paralelos para resultados agrupados.

### Configuración por entorno

Per [ADR-0035](0035-configuración-de-entornos.md):

- **Dev local**: container Meilisearch en `docker-compose.yml`, master key en `.env`.
- **CI**: servicio Meilisearch en GitHub Actions matrix, key hardcoded en el workflow.
- **Prod**: container en Dokploy, master key en env vars del host.

## Alternativas consideradas

### A. Postgres FTS + pg_trgm + pgvector

Cero servicios nuevos. Tres motores combinados (full text con `tsvector`, fuzzy con trigrams, semantic con embeddings) cubren los 5 requirements arriba con SQL.

Descartada porque:
- **Typo tolerance** con trigrams requiere similarity threshold tuning per use case y no es transparente al developer (cada query hay que decidir el threshold).
- **Ranking tunable** en runtime requiere reescribir queries; con Meili / ES es config en JSON.
- **Latencia search-as-you-type**: cada keystroke pega contra Postgres compartido con writes y otras reads. Bajo carga moderada (focus group con 50 alumnos concurrentes) la latencia variable se vuelve perceptible.
- **Faceted search** con SQL escala pobre cuando los filtros se combinan.

Útil como fallback si Meilisearch cae (ver "Consecuencias" abajo). Pero no como primario.

### B. Elasticsearch (descartado, era la primera elección)

La opción industrial de búsqueda. Cobertura completa de los 5 requirements + escalabilidad horizontal + ecosistema enorme.

Descartada para MVP solo-dev porque:
- **Footprint**: ~1.5 GB RAM en mínimos razonables. Triplica el RAM de Postgres + Redis combinados en dev. En CI suma 30-60 segundos de startup por job.
- **Operación**: JVM tuning, cluster setup, mappings explícitos, versiones (8.x todavía con licencia mixta SSPL/AGPL para algunos features).
- **Sobre-engineered** para el dataset esperado (100k documents). ES brilla a partir de 100M+ documents.

Si el producto crece a múltiples universidades + millones de reseñas, se reconsidera. Por ahora innecesario.

### C. Typesense

Similar a Meilisearch en filosofía (build-in defaults, footprint chico, search-as-you-type). C++ en lugar de Rust.

Descartada por marginal preferencia personal por Rust + Meilisearch tiene mejor doc oficial en español + comunidad LATAM más activa. Funcionalmente Typesense es equivalente y reconsiderar si Meili presenta limitaciones específicas.

### D. Algolia / Vercel Search / providers SaaS

Hosted, zero ops. Latencia óptima. Mejor DX que self-hosted.

Descartada por la regla de stack open-source self-hosted del proyecto. UNSTA comparte la propiedad sin aportar; servicios pagados fuera del scope.

## Consecuencias

### Positivas

- **DX sólida**: API simple, SDK .NET y JS estables, defaults razonables.
- **Latencia low** en search-as-you-type sin tuning manual.
- **Costo cero** en hosting.
- **Footprint chico** preserva el budget de RAM para Postgres y Redis.
- **Failover claro**: si Meilisearch cae, el frontend degrada a una búsqueda básica via endpoint `/api/search/fallback` que pega contra Postgres con `pg_trgm`. No óptima pero funcional.

### Negativas

- **Servicio nuevo en el stack**: 4 containers (Postgres, Redis, Mailpit, Meilisearch) en docker-compose. Más cosas que pueden fallar al levantar dev.
- **Sincronización Postgres ↔ Meilisearch**: si un evento se pierde (caso degenerado del outbox), el índice queda stale. Mitigación: job batch nocturno que reconcilia (read-from-DB, push-to-meili) — diferido hasta que aparezca incident real.
- **Multi-tenant queries**: el MVP es multi-universidad. Hay que filtrar resultados por `university_id` en cada query para que un alumno de UNSTA no vea reseñas de SIGLO 21. Eso es config de Meili, no es problema técnico, pero requiere disciplina al construir queries.
- **Bumps de versión**: Meilisearch hace bumps mayores ocasionales que requieren reindex. Aceptable para self-hosted con downtime planeable.

### Cuándo revisitar

- **Latencia degradada** consistentemente > 100ms p95 con datasets < 1M documents (síntoma de tuning incorrecto, no del motor).
- **Necesidad de aggregations complejas** que Meilisearch no cubre (Elasticsearch agg framework es superior). No esperable en MVP.
- **Crecimiento a > 10M documents** o multi-tenancy con > 100 universidades. En ese punto, evaluar shard / cluster (Meili tiene "Meilisearch Cloud" managed o se migra a Typesense / Elastic).

## Refs

- ADR-0030 (cross-BC consistency via Wolverine outbox): el patrón de sincronización aplica.
- ADR-0034 (Redis como cache + ephemeral state): Meilisearch es derivación, igual que Redis es derivación. No reemplazan a Postgres.
- ADR-0035 (configuración por entornos): Meilisearch sigue el mismo patrón de connection string + master key en env vars.
- US futura (no asignada): "Búsqueda global con Meilisearch" backend + frontend.
