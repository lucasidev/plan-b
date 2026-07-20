# US-038-bis: Soft delete con anonimización de cuenta

**Status**: Done (S4, 2026-05-24)
**Sprint**: S4
**Epic**: [EPIC-02: Identidad y autenticación](../epics/EPIC-02.md)
**Priority**: High
**Effort**: M
**ADR refs**: [ADR-0044](../../decisions/0044-soft-delete-del-user-con-preservacion-de-corpus.md)

> US agregada mid-sprint en S4 (bonus, PR #125). Cambió el approach de baja de cuenta: de **hard delete** (US-038, S2) a **soft delete con anonimización irreversible del PII + preservación del corpus**. Canceló a [US-075](US-075.md) (self-disable reversible), que era el paso intermedio que sobraba. La decisión completa, con alternativas, vive en [ADR-0044](../../decisions/0044-soft-delete-del-user-con-preservacion-de-corpus.md).

## Como member que se va de la plataforma, quiero dar de baja mi cuenta anonimizando mi identidad pero sin destruir las reseñas que aporté, para ejercer mi derecho de supresión (Ley 25.326) sin romper el corpus crowdsourced

El flow original de US-038 hacía hard delete del `User`. Al aterrizar Reviews (S5), la suscripción razonable de ese módulo al event `UserAccountDeleted` habría cascadeado el borrado de las reseñas del user, destruyendo el corpus que es la razón de existir del producto. ADR-0044 cambia el patrón a soft delete con anonimización, alineado con Reddit (`[deleted]`), Stack Overflow ("user N") y Twitter.

## Acceptance Criteria

- [x] `User.Deactivate(clock)` (domain): anonimiza `Email` a hash determinístico (`deleted-<sha256(email)>@anonymized.local`), blanquea `PasswordHash`, limpia owned collections (`VerificationToken[]`, `StudentProfile[]`), setea `DeactivatedAt`, raise `UserAccountDeactivatedDomainEvent`. Guarda `AlreadyDeactivated`.
- [x] `DeactivateAccountCommand` + endpoint `DELETE /api/me/account` reapuntado del hard delete al soft delete.
- [x] `DeleteAccountCommand` + handler (hard delete) quedan en el código para uso interno (tests, scripts, admin futuro), sin endpoint user-facing.
- [x] Migration: columna `deactivated_at TIMESTAMPTZ NULL` en `identity.users` + partial unique index `ux_users_email_active` actualizado a `expired_at IS NULL AND deactivated_at IS NULL` (permite re-registro con el mismo email tras la baja).
- [x] `UserAccountDeactivatedIntegrationEvent` (`UserId` + `DeactivatedAt`): los subscribers anonimizan referencias, no cascade-deletean. Reviews renderea el autor anonimizado como "Ex-miembro".
- [x] Frontend: `features/delete-account/` renombrado a `features/deactivate-account/` (modal anti-accidental). Redirect post-204 a `/sign-in?account-deactivated=1` + banner del sign-in actualizado.
- [x] Refresh tokens del user revocados (Redis). `UserDeletionLog` (existente desde US-038) se mantiene con email hasheado como audit que sobrevive a la anonimización.

## Out of scope

- **Endpoint de backoffice para hard delete** (`DELETE /api/identity/users/{id}`, dueño del aggregate `User`): diferido. No hay "módulo admin" donde aterrizarlo: las features de backoffice viven en su módulo dueño ([ADR-0050](../../decisions/0050-backoffice-como-corte-transversal.md)).
- **Rutina de hard delete batch** post-N-años para los rows anonimizados que sobreviven en la tabla: no en MVP (para la escala de plan-b es ruido).

## Refs

- Decisión completa (contexto + alternativas A/B/C/D + consecuencias): [ADR-0044](../../decisions/0044-soft-delete-del-user-con-preservacion-de-corpus.md)
- US-038 (hard delete original, shipped S2): [US-038-b](US-038-b.md)
- US-047 (Mi perfil, cuya "Zona peligrosa" dispara este flow): [US-047](US-047.md)
- US-075 (self-disable reversible, cancelada por este trabajo): [US-075](US-075.md)
