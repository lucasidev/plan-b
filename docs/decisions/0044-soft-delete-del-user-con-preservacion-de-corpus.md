# ADR-0044: Soft delete del User con preservación de corpus

- **Estado**: aceptado
- **Fecha**: 2026-05-24

## Contexto

US-038 (mergeada en S2) implementó el flow "dar de baja mi cuenta" como **hard delete** del User: `IUserRepository.Remove(user)` elimina el row; las owned collections del aggregate (verification tokens, student profiles) cascadean por configuración por default de EF; un integration event `UserAccountDeleted` notifica a otros BCs para que limpien sus referencias.

El comportamiento es razonable mientras el dominio del producto sea solo Identity + Academic + Enrollments, porque ninguno de esos BCs almacena contenido aportado por el user que tenga valor para terceros. Cuando aterrice Reviews (S5), el comportamiento se vuelve problemático: la suscripción razonable del módulo Reviews al event `UserAccountDeleted` sería cascade-deletear las reseñas del user, **y eso destruye el corpus crowdsourced que es la razón de existir del producto**.

El doc de US-047 ("Mi perfil") referenciaba US-075 como el flow para "dar de baja mi cuenta" con la intuición de que tenía que ser distinto del hard delete actual. US-075 fue descripta como "self-disable reversible" (estilo Twitter Deactivate de 30 días). Al revisar el caso de uso real ("alumno que se va o pierde interés en la app"), el patrón correcto no es disable reversible: es **anonimización irreversible de identidad + preservación del contenido**. Es lo que hacen Reddit (`[deleted]`), Stack Overflow ("user N"), Twitter ("Account suspended" para los anonimizados por compliance).

US-075 entonces queda cancelada. La discusión es: ¿cómo articulamos los dos casos legítimos (cierre user-driven que preserva corpus, hard delete reservado a operaciones internas)?

## Decisión

Coexisten **dos operaciones explícitas con semánticas distintas**, una user-facing y otra interna.

### 1. Soft delete con anonimización (user-facing)

Comando `DeactivateAccountCommand`. Endpoint user `/api/me/account` (DELETE). Disparado desde la "Zona peligrosa" de Mi perfil (US-047 frontend).

Efectos:

- Aggregate `User` ejecuta nuevo método `Deactivate(clock)`:
  - **PII anonimizada**: `Email` → hash determinístico (`deleted-<sha256(emailOriginal)>@anonymized.local`, o equivalente; ver "Notas de implementación"), `PasswordHash` → blank, `DisabledReason` / `DisabledBy` → null. El display name cuando exista (US-047) se setea a null.
  - **Flag temporal**: `DeactivatedAt = clock.UtcNow`.
  - **Owned collections borradas**: `VerificationToken[]`, `StudentProfile[]` (PII parcial: legajo, año). El audit log centralizado del usuario (cuando aterrice ADR-0042) decide si guarda referencia.
  - **Domain event**: `UserAccountDeactivatedDomainEvent`.
- Translator a integration: `UserAccountDeactivatedIntegrationEvent`. Otros BCs que se suscriben **no cascadean delete**; reemplazan referencias por la versión anonimizada. Ejemplos esperados:
  - **Reviews** (S5): la review queda en la tabla con `author_user_id` apuntando al user anonimizado. El proyecto/DTO público renderea autor como "Ex-miembro" (label canónico) o vacío. El `display_name_snapshot` de la review se setea a null o "Ex-miembro" si el campo existía.
  - **Moderation**: reports del user anonimizado quedan en el log; la PII del reporter desaparece naturalmente del User.
- `UserDeletionLog` (existente desde US-038) se mantiene con email hasheado. Es el audit que sobrevive a la anonimización.
- Refresh tokens del user revocados (Redis); el frontend cierra sesión local y redirige a `/sign-in?account-deactivated=1`.

Operación **irreversible**: una vez anonimizado, no se restaura el email/displayName. Si el user quiere volver, se registra de cero con un User nuevo. El partial unique index del email se ajusta para que el hash anonimizado (terminado en `@anonymized.local`) no impida re-registro: en la práctica, el filter pasa de `WHERE expired_at IS NULL` a `WHERE expired_at IS NULL AND deactivated_at IS NULL`.

### 2. Hard delete (uso interno)

Comando `DeleteAccountCommand` y handler `DeleteAccountCommandHandler` **quedan en el código** (no se borran). Mantienen el comportamiento actual: hard delete del row + cascade EF de owned collections + integration event `UserAccountDeletedIntegrationEvent`.

**No hay endpoint HTTP user-facing** que invoque este comando. El endpoint actual `DeleteAccountEndpoint` se elimina y `/api/me/account` se reapunta al soft delete (`DeactivateAccountCommand`).

Casos legítimos para el hard delete:

- **Tests de integración** que necesitan limpiar usuarios creados ad-hoc (aunque hoy los tests usan DB efímera per-class, mantener el handler es prudente).
- **Scripts de mantenimiento** (cleanup de cuentas duplicadas detectadas manualmente, fraude, dev cleanup).
- **Endpoint de backoffice futuro** (`DELETE /api/identity/users/{id}`, no en MVP). Cuando se construya esa feature (US-058+), podrá invocar el comando directamente, con permisos elevados y audit propio. Nota posterior ([ADR-0050](0050-backoffice-como-corte-transversal.md)): la redacción original decía `/api/admin/...` y "cuando aterrice el módulo de admin"; no existe tal módulo ni tal namespace, las features de backoffice viven en el módulo dueño del aggregate (acá Identity, que es donde vive `User`).

Operación **no se expone al user**. Si se llega a exponer en admin, el copy y la confirmación deben ser explícitos sobre la irreversibilidad y la pérdida del corpus aportado.

## Alternativas consideradas

- **A. Mantener hard delete user-facing + cascade Reviews cuando aterricen**. Rechazada: destruye el corpus aportado, que es el activo principal del producto. Además, no cumple el espíritu de Ley 25.326 art. 6 mejor que el soft delete (la supresión razonable es de la identidad, no de las contribuciones).
- **B. Soft delete reversible (US-075 original: "self-disable" estilo Twitter Deactivate)**. Rechazada: el caso de uso real ("alumno se va o pierde interés") no es "pausa, vuelvo en 30 días"; es "me voy y no quiero ser identificable". La complejidad de un periodo de gracia con re-activación automática no se justifica para el MVP.
- **C. Solo soft delete (eliminar hard delete del código)**. Rechazada: el hard delete tiene casos legítimos internos (tests, scripts, cleanup manual de duplicados/fraude). Eliminarlo obligaría a inventar workarounds (`UPDATE users WHERE ...` directo a DB) que son peores arquitectónicamente.
- **D. Soft delete + flag de "retain content" opcional**. Rechazada: agrega un toggle al user que no aporta valor (¿en qué caso un user querría "borrarme completo incluyendo mis reseñas"?) y complica el mensaje. Mejor un solo flow con copy claro.

## Consecuencias

### Positivas

- Cumple Ley 25.326 art. 6 (derecho de supresión de PII) sin sacrificar el valor crowdsourced.
- Alinea con el patrón mainstream de apps con corpus (Reddit, Stack Overflow, Twitter).
- Mantiene auditabilidad: el `UserDeletionLog` con email hasheado permite trazar "este user existió y se dio de baja en esta fecha".
- El hard delete sigue disponible para necesidades operativas reales.

### Negativas

- El row `User` anonimizado **sobrevive forever** en la tabla. Crece el tamaño de la tabla sin upper bound. Mitigación: para una base académica de plan-b (~10k users a 5 años) es ruido. Si en algún momento el tamaño es problema, una rutina de hard delete batch post-N-años puede agregarse con políticas claras.
- Aumenta la complejidad del aggregate `User` (dos métodos terminales: `Delete` y `Deactivate`). Trade-off aceptable: cada método tiene un caso de uso explícito y nombre claro.
- El integration event nuevo (`UserAccountDeactivated`) obliga a los BCs futuros (Reviews, Moderation cuando aterricen su parte de US-047) a implementar el handler de anonimización correctamente. Riesgo: que un módulo nuevo subscriba `UserAccountDeleted` (hard) por error y cascade-deletee. Mitigación: el integration event hard-delete deja de tener subscribers user-facing; cuando aparezca un módulo nuevo, la convención debe ser suscribir el `UserAccountDeactivated`.

### Neutras / a vigilar

- La columna `deactivated_at` en `users` necesita índice si las queries de listado del catálogo público filtran por `deactivated_at IS NULL` con frecuencia. Por ahora no aplica (el catálogo expone Reviews, no Users).
- Los hashes anonimizados de email crecen como ruido en la columna `email`. El partial unique index (`expired_at IS NULL AND deactivated_at IS NULL`) garantiza que no bloqueen re-registro.

## Notas de implementación

- **Shape del email anonimizado**: la convención sugerida es `deleted-<sha256(emailLowercase)[:16]>@anonymized.local`. El hash determinístico permite, en un script de soporte, identificar si dos cuentas anonimizadas correspondían al mismo email (caso raro: investigación interna). El sufijo `.local` garantiza que nunca sea un email enviable. Alternativa más estricta: `null` directo en `Email` y mover el email original al `UserDeletionLog`; descartada porque el dominio tipa `EmailAddress` como required (cambiarlo a nullable es disruptivo); el hash determinístico es el mínimo cambio.
- **Migration**: agregar columna `deactivated_at TIMESTAMPTZ NULL` a `identity.users` + actualizar el partial unique index `ux_users_email_active` para incluir `deactivated_at IS NULL` en el filter.
- **Renombrado del feature frontend**: `features/delete-account/` pasa a `features/deactivate-account/` (componentes, schema, copy). El endpoint del backend mantiene el path `/api/me/account` (la diferencia es interna). El redirect post-204 va a `/sign-in?account-deactivated=1` (en lugar de `?deleted=1`); el banner del sign-in se actualiza con el copy correcto.
- **Integration event**: `UserAccountDeactivatedIntegrationEvent` lleva `UserId` + `DeactivatedAt`. NO lleva el email anonimizado (los subscribers no lo necesitan: ya leen del User si necesitan algo, o ignoran).
- **Tests**: la suite de integration debe cubrir (1) happy path deactivate y verificar email anonimizado en DB, (2) re-registro con el mismo email post-deactivate (debe funcionar), (3) repetir deactivate sobre user ya deactivated (devuelve 409 o 404, decidir en el handler), (4) auth gate (401 sin sesión).

## Refs

- US-038 (hard delete original, shipped S2): [docs/domain/user-stories/US-038-b.md](../domain/user-stories/US-038-b.md).
- US-047 (Mi perfil, S4) cuya "Zona peligrosa" consume este patrón: [docs/domain/user-stories/US-047.md](../domain/user-stories/US-047.md).
- US-075 ("self-disable" original): **cancelada por este ADR**. El doc queda como histórico.
- Ley 25.326 (Argentina, Protección de Datos Personales), art. 6 inc. 4: "Toda persona tiene derecho a obtener la supresión, rectificación, confidencialidad o actualización de los datos personales de los que sea titular."
- ADR-0042 (audit log per-BC): el `UserDeletionLog` actual queda como audit del flow, no se mueve a un módulo central.
- ADR-0017 (persistence ignorance): los integration events son la única forma cross-BC; ningún módulo lee la tabla `users` directamente.
