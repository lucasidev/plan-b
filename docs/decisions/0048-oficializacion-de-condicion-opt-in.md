# ADR-0048: Oficialización de condición (alumno/docente) opt-in, desacoplada del email

- **Estado**: aceptado
- **Fecha**: 2026-07-17

## Contexto

El producto se posiciona como independiente: "proyecto independiente, no afiliado oficialmente a ninguna universidad" (disclaimer compartido, `lib/copy.ts`). Pero lo construido y el copy asumen que el producto **verifica la condición** de alumno o docente, y eso contradice el posicionamiento.

Estado real, verificado en código (auditoría 2026-07-17):

- **Alumnos**: el registro es **abierto**. `RegisterUserValidator` solo valida formato y longitud del email; los tests registran con `@planb.local`. `StudentProfile` no tiene ningún flag de "verificado". Publicar reseña solo exige un `StudentProfile` activo, y el "cursó" que respalda una reseña es **100% self-reported** (el usuario carga su historial vía PDF/texto, `HistorialImport`). O sea: **no verificamos nada de alumnos**. Pero el copy afirma "Validamos que seas alumno", "Confirmamos que sos alumno", "verificado que cursó", "alumnos verificados".
- **Docentes**: sí hay verificación automática por **email institucional**. `TeacherProfile.SubmitInstitutionalEmail` valida que el dominio del email esté en `University.institutionalEmailDomains` y setea `VerifiedAt` (US-031). Esto asume que controlar un email de dominio universitario prueba ser docente, y que ese dominio "avala" la condición.

Ambas cosas son incoherentes con la independencia: afirmar que verificamos condición implica una relación o aval con la institución que no tenemos. Y validar por email institucional asume que la universidad da emails usables (falso para muchas universidades argentinas) y que controlar ese email prueba la condición (no lo prueba).

## Decisión

1. **El email es solo credencial de cuenta** (registro, login, recuperación). El registro es abierto: cualquier email válido por formato. No se gatea por dominio.
2. **El producto no afirma verificar condición** de alumno ni docente. Es una comunidad abierta: reseñas anónimas, historial self-reported. El copy dice lo que el sistema realmente hace, nada más.
3. **La oficialización de condición (alumno o docente) es opcional y self-initiated**: el usuario aporta evidencia de su condición (o, a futuro, una afiliación con la universidad la respalda), un revisor la evalúa, y recién ahí se otorga un badge "oficial". **Nunca por el email.**
4. Se **deprecia el email institucional** como verificación automática de docente.

La verificación de que el **email es tuyo** (el link de verify-email) se mantiene: es honesta y distinta de "sos alumno". El copy debe distinguir "cuenta verificada" (el email) de "condición oficializada" (el badge).

## Alternativas consideradas

- **A. Verificar por email institucional (dominio).** Estado actual para docentes. Rechazada: contradice "no avalados", asume que la universidad da emails usables y que controlar el email prueba la condición.
- **B. Afiliación / convenio con universidades** (la institución valida matrícula). Diferida, no rechazada: hoy no depende de nosotros. El modelo la admite como una fuente futura del badge oficial cuando exista una afiliación real.
- **C. Oficialización opcional por evidencia, self-initiated (elegida).** El usuario prueba su condición, se revisa, gana el badge. No requiere aval de la institución para operar; la oficialización es un extra opcional, no un gate.

## Consecuencias

### Positivas

- El mensaje es honesto y coherente con la independencia.
- El registro abierto de alumnos **ya está implementado**: el backend de alumnos no cambia.
- Un mecanismo de oficialización genérico sirve a alumno y docente (mismo motor, dos consumidores reales).

### Negativas / lo que hay que virar

- El copy actual miente y hay que reescribirlo: landing "Cómo verificamos", `sign-up`, badges "verificado que cursó" / "docente verificado", carnet, FAQ. → **US-090-f**.
- La verificación de docente por email institucional está cableada en backend (`TeacherProfile.SubmitInstitutionalEmail`), US-031, `verification-flows.md`, `data-model.md`, ubiquitous-language, y hay que migrarla. → **US-092**.
- `University.institutionalEmailDomains` (US-060) queda sin uso si se deprecia el email institucional; evaluar deprecarlo o repurpose en US-092.

### A vigilar

- La revisión de evidencia arranca manual (admin) en el MVP; evaluar automatización si el volumen crece.
- No reintroducir la confusión entre "cuenta verificada" (email) y "condición oficializada" (badge) en el copy.

## Refs

- Auditoría de impacto: 2026-07-17 (backend identity/academic/reviews/enrollments + frontend copy + docs).
- US derivadas: [US-090-f](../domain/user-stories/US-090-f.md) (copy honesto), [US-091](../domain/user-stories/US-091.md) (oficialización por evidencia), [US-092](../domain/user-stories/US-092.md) (migrar verificación docente).
- Código actual: `TeacherProfile.SubmitInstitutionalEmail` (verificación docente por dominio), `RegisterUserValidator` (registro abierto), `HistorialImport` (cursó self-reported).
- Docs a reconciliar: US-031, `docs/domain/verification-flows.md`, `docs/architecture/data-model.md`, `docs/domain/ubiquitous-language.md`.
- Decisiones relacionadas: [ADR-0001](0001-multi-universidad-desde-dia-1.md), [ADR-0008](0008-roles-exclusivos-profiles-como-capacidades.md), [ADR-0023](0023-auth-flow-jwt-cookie-layout-guards.md), [ADR-0033](0033-verification-token-como-child-entity.md).
