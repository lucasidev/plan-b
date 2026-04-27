# Redis key patterns

Catálogo canónico de patrones de keys, valores, TTLs y operaciones para los seis casos de uso autorizados por [ADR-0034](../decisions/0034-redis-como-cache-y-ephemeral-state.md). Si tu PR usa Redis y no encaja en ninguno de estos patrones, **antes** de inventar uno nuevo, abrir issue / discutir el ADR.

El "por qué" de Redis está en ADR-0034. Este doc es el "cómo": los shapes concretos.

## Convenciones generales

### Naming

```
<module>:<purpose>:<identifier>
```

- **module**: el bounded context que escribe la key (`identity`, `academic`, `enrollments`, `reviews`, `moderation`, `planning`). Sirve para namespacear: si en el futuro segmentamos por servidor Redis, el prefijo es la unidad de migración.
- **purpose**: tipo de uso del key (`refresh`, `ratelimit`, `idempotency`, `cache`, `insights`). Si ves un purpose nuevo en código, debería corresponder a uno de los seis patrones del ADR.
- **identifier**: lo que distingue una instancia de otra. Hash de token, ID de usuario, código de materia, etc. **Nunca PII en plano** (email, nombre): siempre hash o ID interno.

Separador siempre `:`. No usar `_` ni `/` ni kebab-case en este nivel — son consistentes con el ecosistema Redis (RedisInsight, MONITOR, KEYS pattern matching).

### TTL

- **Toda key tiene TTL explícito.** Si te encontrás escribiendo `SET key value` sin `EX`/`EXAT`, parar y pensar.
- **Convención de TTLs por uso** (orientativa, cada caso justifica el suyo):

| Caso | TTL típico |
|---|---|
| Refresh tokens | 30 días (= `JWT__RefreshTokenDays`) |
| Rate limiting windows | 1-15 minutos |
| Idempotency keys | 24 horas |
| Hot reads cache | 5-30 minutos |
| Crowd insights | 1-6 horas |
| Recently viewed | 30 días |

- **Máximo absoluto: 30 días.** Si necesitás algo más permanente, no es Redis, es Postgres.

### Falla / degradación

Patrón base para todos los casos de uso (envuelve cada operación en este shape):

```csharp
try
{
    return await redis.OperationAsync(...);
}
catch (RedisException ex)
{
    _log.LogWarning(ex, "Redis unavailable for {Operation}", op);
    return Fallback();   // ver columna "Si Redis muere" de cada patrón abajo
}
```

Nunca dejar que una excepción de Redis tumbe el handler. Cada caso de uso define qué significa "fallback".

### Anti-patrones

- Keys sin TTL.
- Keys con PII en plano (email, nombre, teléfono). Siempre hash.
- `KEYS *` en código de producción. Solo en debug interactivo.
- Pipelines sin batch boundaries claros (memoria del cliente puede explotar con miles de comandos).
- Usar Redis como queue (Wolverine outbox cubre eso).
- Usar Redis como source of truth (Postgres lo es).

---

## Patrón 1: Refresh token revocation list

**Caso**: validar que un refresh token presentado por el cliente no fue revocado por sign-out, password change, etc.

**Key shape**:
```
identity:refresh:{tokenHash}
```
- `tokenHash`: SHA-256 del refresh token raw, hex lowercase. Nunca el token raw.

**Valor**: el `userId` (Guid serializado como string). Permite recuperar al user sin un round-trip a la DB cuando el token está vivo.

**TTL**: igual al `JWT__RefreshTokenDays` (30 días por default). Cuando el token caduca por TTL, deja de ser válido automáticamente sin que nadie limpie nada.

**Operaciones**:

| Quién | Cuándo | Comando |
|---|---|---|
| Login handler | Al emitir refresh token | `SET identity:refresh:{hash} {userId} EX 2592000` |
| Refresh handler | Al validar refresh entrante | `GET identity:refresh:{hash}` → si null, 401 |
| Sign-out handler | Al cerrar sesión | `DEL identity:refresh:{hash}` |
| Password change | Al cambiar contraseña | `DEL` de todos los tokens del user — requiere índice secundario, ver abajo |

**Índice secundario (revocar todos los tokens del user)**: además del key principal, mantener un set por user:

```
identity:refresh-by-user:{userId}  →  SET<tokenHash>
```

- Al emitir: `SADD identity:refresh-by-user:{userId} {hash}` con el mismo TTL que el token principal.
- Al revocar todos: `SMEMBERS` para obtener todos los hashes, `DEL` cada uno + `DEL` el set.

**Si Redis muere**: refresh devuelve 401 (fail safe). El user se relogea y obtiene tokens nuevos. Acceptable: peor caso es N usuarios re-logueando.

---

## Patrón 2: Rate limiting (sliding window log)

**Caso**: limitar intentos de login fallidos por email + IP, prevenir abuse.

**Key shape**:
```
identity:ratelimit:login:{emailHash}:{ipHash}
```
- `emailHash`: SHA-256 del email lowercased.
- `ipHash`: SHA-256 de la IP del request.

**Tipo**: sorted set. Score = timestamp Unix ms del intento. Member = un identificador único del intento (puede ser `requestId` o el timestamp con sufijo).

**TTL**: 15 minutos (window size). Cada intento agrega un member; al consultar, primero limpiamos members fuera del window.

**Operaciones (atomic via Lua o `EVAL`)**:

```
ZREMRANGEBYSCORE key 0 (now - window_ms)   # limpia entries vencidas
ZADD key now requestId                       # agrega el intento actual
ZCARD key                                    # cuenta intentos vivos en el window
EXPIRE key window_seconds                    # renueva TTL
```

Si `ZCARD > 5` (umbral), retornar 429 antes de procesar el login.

**Umbrales sugeridos** (revisar al observar tráfico real):

| Acción | Window | Max intentos |
|---|---|---|
| Login fallido | 15 min | 5 |
| Register | 1 hora | 3 |
| Resend verification email | 1 hora | 3 |

**Si Redis muere**: fail open con warning log. Preferimos servir un poco más vs cortar todo el login. Mitigación: GitHub Actions / monitoring alerta si Redis está down.

---

## Patrón 3: Idempotency keys

**Caso**: el cliente reintenta un POST porque la red falló entre request y response. Sin idempotency, duplicamos el side effect (segunda reseña creada, segundo email enviado).

**Key shape**:
```
{module}:idempotency:{operation}:{idempotencyKey}
```

- `idempotencyKey`: lo provee el cliente vía header `Idempotency-Key`. UUID por convención.
- `operation`: nombre del endpoint o use case (`reviews.create`, `identity.register`).

**Tipo**: string (JSON serializado de la response original).

**TTL**: 24 horas. Suficiente para cubrir un retry razonable; más largo es overkill.

**Operaciones (SETNX pattern)**:

```csharp
var existing = await redis.GetAsync(key);
if (existing != null) return Deserialize(existing);   // idempotent hit, devolver la response anterior

var locked = await redis.SetAsync(key, "in-flight", expiry: TimeSpan.FromSeconds(30), When.NotExists);
if (!locked) return 409;   // otro request en vuelo con el mismo key

try
{
    var response = await ExecuteHandler();
    await redis.SetAsync(key, Serialize(response), expiry: TimeSpan.FromHours(24));
    return response;
}
catch
{
    await redis.DeleteAsync(key);   // libera el lock para que el cliente pueda reintentar
    throw;
}
```

**Si Redis muere**: skip idempotency check, ejecutar el handler. Riesgo: duplicación si cliente reintenta. Aceptable como degradación temporal.

---

## Patrón 4: Hot reads cache (cache-aside)

**Caso**: reads de catálogo (Subject, Teacher, Commission, agregados como `pass_rate`, `avg_rating`). Read-100x:write-1.

**Key shape**:
```
{module}:cache:{entity}:{id}
```

Ejemplos:
- `academic:cache:subject:{subjectId}`
- `academic:cache:teacher:{teacherId}`
- `academic:cache:commission:{commissionId}`
- `reviews:cache:subject-stats:{subjectId}` (agregado: avg_rating, pass_rate, review_count)

**Tipo**: string (JSON serializado del DTO de read).

**TTL**: 5-30 minutos según volatilidad. Subject info cambia rara vez → 30 min. Subject-stats cambia con cada review → 5 min.

**Operaciones (cache-aside)**:

```csharp
var cached = await redis.GetAsync<SubjectDto>(key);
if (cached != null) return cached;

var subject = await db.QuerySubjectAsync(id);
await redis.SetAsync(key, subject, expiry: TimeSpan.FromMinutes(30));
return subject;
```

**Invalidación explícita en writes**: cuando un handler actualiza una entidad cacheable, **antes** de devolver hace `DEL` de la key:

```csharp
await db.UpdateSubjectAsync(...);
await redis.DeleteAsync($"academic:cache:subject:{id}");
return Result.Success();
```

Si la write ocurre en otro módulo (cross-module event-driven invalidation), no lo hacemos por ahora — TTL se encarga, y el costo de staleness aceptable (max 30 min).

**Si Redis muere**: cache miss → query a DB. Latencia de la primera request degrada, pero funciona. Sin error al usuario.

---

## Patrón 5: Crowd insights cache (heavy aggregation)

**Caso**: agregaciones que recorren miles de filas y querés evitar calcular en cada render. Ejemplo: en el simulador, "combinaciones de materias que más recursan", "tu percentile de carga vs alumnos en tu nivel".

**Key shape**:
```
planning:insights:{insightType}:{hashOfInputs}
```

Ejemplos:
- `planning:insights:fail-combinations:{hashOf(careerId,subjectCodes)}`
- `planning:insights:percentile:{hashOf(careerId,year,materiasCount)}`

`hashOfInputs`: SHA-256 (hex truncado a 16 chars) de los inputs de la consulta. Garantiza que misma query produce misma key sin meter inputs largos en la key.

**Tipo**: string (JSON del resultado).

**TTL**: 1-6 horas. La data subyacente cambia lento (las recursadas históricas no cambian; reseñas nuevas tardan en mover el agregado).

**Operaciones**: cache-aside igual que el Patrón 4.

**Si Redis muere**: query directo a DB (puede tardar varios segundos en agregaciones pesadas). Mostrar loading state extra en UI; aceptable para un caso degradado.

---

## Patrón 6: Recently viewed + autocomplete

**Caso**: lista de últimas materias / docentes que un user vio. Sugerencias de autocomplete en el search box.

**Key shapes**:

```
member:{userId}:recent-viewed:{entityType}    → ZSet<entityId> con score = timestamp
academic:autocomplete:{entityType}:{prefix}   → ZSet<entityId> con score = popularidad
```

**Recently viewed**:
- Tipo: sorted set, score = timestamp ms del view, member = entityId.
- Operaciones:
  - Al ver una materia: `ZADD member:{userId}:recent-viewed:subject {now} {subjectId}`. Después `ZREMRANGEBYRANK key 0 -11` (mantiene solo los últimos 10).
  - Al consultar: `ZREVRANGE key 0 9` para los 10 más recientes.
- TTL: 30 días desde el último update (refrescar TTL en cada `ZADD`).

**Autocomplete**:
- Tipo: sorted set por prefijo. Score = un proxy de popularidad (review count, search count).
- Operaciones:
  - Al cargar el catálogo: precomputar y poblar prefijos de 1, 2, 3 chars.
  - Al consultar `ISW`: `ZREVRANGEBYSCORE academic:autocomplete:subject:isw +inf -inf LIMIT 0 10`.
- TTL: 24 horas. Recomputar diariamente desde Postgres.

**Si Redis muere**:
- Recently viewed: lista vacía. UX pobre pero no roto.
- Autocomplete: query LIKE a DB con paginación pequeña. Lento pero funcional.

---

## Cuándo este doc se actualiza

- Aparece un caso de uso nuevo aprobado por ADR-0034 → agregar sección.
- Cambian umbrales de rate limiting o TTLs por observación de prod → editar las tablas.
- Sale un anti-patrón observado en code review → agregar a la sección "Anti-patrones".
- Si se decide deprecar Redis (per "cuándo revisitar" del ADR-0034), este doc se archiva en `reference/`.
