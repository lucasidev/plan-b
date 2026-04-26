# TeacherProfile (Identity)

**Tipo**: lean
**BC**: Identity
**Root ID**: `TeacherProfileId`
**Child entities**: ninguna por ahora

> Cuando se implemente el flow de institutional email (post-MVP), TeacherProfile va a tener una collection de `VerificationToken` con `purpose=TeacherInstitutionalVerification`. En ese momento pasa a aggregate **rich** y se actualiza este doc.

## Walkthrough Brandolini Software Design Level

### 1. Commands aceptados

| Command | Disparado por | Efecto |
|---|---|---|
| `InitiateClaim(userId, teacherId, clock)` | Member desde UI | Crea profile en estado pending. Emite `TeacherProfileClaimInitiated`. |
| `SubmitInstitutionalEmail(emailAddress, clock)` | Owner del profile | Setea `institutional_email`; valida dominio en `Teacher.University.institutional_email_domains`. Emite `TeacherProfileInstitutionalEmailSubmitted`. |
| `VerifyByInstitutionalEmail(rawToken, clock)` | Owner via link de mail | Valida token (vendrá del flow de VerificationToken una vez implementado), marca `verified_at=now`, setea `verification_method='institutional_email'`. Emite `TeacherProfileVerifiedByInstitutionalEmail`. |
| `SubmitEvidence(evidenceFileIds, clock)` | Owner del profile | Adjunta evidencia para verificación manual. Emite `TeacherProfileEvidenceSubmitted`. |
| `VerifyManually(approvedByAdminId, clock)` | Admin desde backoffice | Setea `verified_at=now`, `verification_method='manual'`, `verified_by=admin`. Emite `TeacherProfileVerifiedManually`. |
| `RejectVerification(reason, rejectedByAdminId, clock)` | Admin desde backoffice | Marca como rechazado. Emite `TeacherProfileVerificationRejected`. |

### 2. Events emitidos

| Event | Cuándo | Consumido por |
|---|---|---|
| `TeacherProfileClaimInitiated` | Tras `InitiateClaim` | Identity (audit) |
| `TeacherProfileInstitutionalEmailSubmitted` | Tras `SubmitInstitutionalEmail` | Identity (envío de mail), telemetría |
| `TeacherProfileVerifiedByInstitutionalEmail` | Tras `VerifyByInstitutionalEmail` | Identity local + traducido a `TeacherProfileVerifiedIntegrationEvent` para Reviews (capability `review:respond`) |
| `TeacherProfileEvidenceSubmitted` | Tras `SubmitEvidence` | Identity (cola para admin) |
| `TeacherProfileVerifiedManually` | Tras `VerifyManually` | Identity local + traducido a `TeacherProfileVerifiedIntegrationEvent` |
| `TeacherProfileVerificationRejected` | Tras `RejectVerification` | Identity (notificación al user) |

### 3. Invariantes que protege

- `(UserId, TeacherId)` UNIQUE.
- `(TeacherId)` UNIQUE entre profiles con `verified_at NOT NULL`: un Teacher tiene un solo TeacherProfile verificado.
- `verification_method='institutional_email'` requiere `institutional_email NOT NULL` y dominio en `Teacher.University.institutional_email_domains`.
- `verification_method='manual'` requiere `verified_by NOT NULL` apuntando a un User con `role='admin'`.

### 4. Cómo se carga / identifica

- Root ID: `TeacherProfileId`.
- Lookup primario: por ID.
- Lookup secundario: por `UserId` (listar profiles del user), por `(UserId, TeacherId)`, por `TeacherId` (verified) para Reviews.
- Persistencia: EF Core schema `identity`. Tabla `teacher_profiles`.

### 5. Boundary

- Cross-aggregate validations (Teacher existe, dominio del email matchea University) en app service vía `IAcademicQueryService`.
- `User` está afuera (aggregate separado en mismo BC).

## Value Objects propios

Ninguno específico hoy. Cuando se incorporen VerificationTokens propios, hereda de `TokenPurpose=TeacherInstitutionalVerification`.

## Refs

- BC: [Identity](../../strategic/bounded-contexts.md#identity)
- ADRs: [ADR-0008](../../../decisions/0008-roles-exclusivos-profiles-como-capacidades.md), [ADR-0033](../../../decisions/0033-verification-token-como-child-entity.md)
- User Stories: [US-017](../../user-stories/US-017.md), [US-018](../../user-stories/US-018.md), [US-019](../../user-stories/US-019.md), [US-020](../../user-stories/US-020.md), [US-021](../../user-stories/US-021.md), [US-022](../../user-stories/US-022.md)
