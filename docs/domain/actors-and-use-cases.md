# Actors and Use Cases — planb

Lista completa de casos de uso del sistema, agrupados por actor. Cada UC tiene un ID estable que se referencia desde la API, desde diagramas de secuencia futuros y desde user stories cuando se extraigan.

La lista representa la **superficie funcional completa del MVP**. Cada UC mapea 1:1 a un application service (Clean Architecture) y a un endpoint de la API.

## Legend de actores

| Actor | Requisitos |
|---|---|
| **Visitante** | Sin sesión. Acceso de solo lectura a contenido público. |
| **Alumno** | `User.role='member'` + `StudentProfile` activo. |
| **Docente verificado** | `User.role='member'` + `TeacherProfile.verified_at NOT NULL`. |
| **Moderador** | `User.role='moderator'`. |
| **Admin** | `User.role='admin'`. |
| **University staff** | `User.role='university_staff'`, vinculado a una `University`. |

## Convenciones

- **Short form** para CRUDs y flujos triviales: actor + precondiciones + flujo + postcondiciones.
- **Full form** para flujos con ramas significativas: agrega flujos alternativos, motivación de producto y ADRs referenciados.
- **IDs son estables**. No renumerar. Al agregar UCs nuevos, usar el próximo número libre dentro del rango del actor.

## Ranges de IDs

| Actor | Range |
|---|---|
| Visitante | UC-001 a UC-009 |
| Alumno | UC-010 a UC-029 |
| Claim de identidad docente | UC-030 a UC-039 |
| Docente verificado | UC-040 a UC-049 |
| Moderador | UC-050 a UC-059 |
| Admin | UC-060 a UC-079 |
| University staff | UC-080 a UC-089 |

---

## Visitante anónimo

### UC-001: Explorar catálogo de universidades y carreras

- **Actor**: Visitante.
- **Pre**: Ninguna.
- **Flujo**: navega listado de Universities → elige una → ve sus Careers → elige una → ve los CareerPlans (con el vigente destacado) → elige un plan → ve materias del plan con año, cuatrimestre, correlativas.
- **Post**: Visitante tiene contexto para buscar reseñas o registrarse.

### UC-002: Ver página de una materia con reseñas

- **Actor**: Visitante.
- **Pre**: La Subject existe en el catálogo.
- **Flujo**: pide página de Subject → sistema muestra metadata (código, año, horas, correlativas) + agregados de reseñas (dificultad promedio, histograma, cantidad de reseñas) + lista de reseñas publicadas paginada, sin identidad del autor.
- **Post**: Visitante lee reseñas de la materia.

### UC-003: Ver página de un docente con reseñas

- **Actor**: Visitante.
- **Pre**: El Teacher existe en el catálogo.
- **Flujo**: pide página de Teacher → sistema muestra metadata (nombre con title case, title, bio, universidad) + agregados de reseñas donde fue `docente_reseñado` + lista paginada, sin identidad del autor.
- **Post**: Visitante lee reseñas del docente.

### UC-004: Buscar materia o docente por texto libre

- **Actor**: Visitante.
- **Pre**: Ninguna.
- **Flujo**: ingresa texto → sistema hace full-text search sobre `Subject.name`, `Subject.code`, `Teacher.first_name`, `Teacher.last_name` → ordena por relevancia.
- **Post**: Lista de matches con link a la página correspondiente.

---

## Alumno

### UC-010: Registrarse

- **Actor**: Visitante que quiere convertirse en member.
- **Pre**: Ninguna.
- **Flujo**: envía email + password → sistema valida formato + unicidad del email → hashea password → crea `User` con `role='member'`, `email_verified_at=NULL` → envía email de verificación vía SMTP.
- **Post**: Cuenta creada pendiente de verificación. No puede publicar ni crear profiles hasta verificar.

### UC-011: Verificar email

- **Actor**: User recién registrado.
- **Pre**: Tiene un token de verificación válido recibido por email.
- **Flujo**: click en link → sistema valida token → setea `email_verified_at=now()`.
- **Post**: Cuenta habilitada para crear profiles y publicar contenido.

### UC-021: Reenviar email de verificación

- **Actor**: User pendiente de verificar.
- **Pre**: Tiene cuenta no verificada (email_verified_at=null, expired_at=null).
- **Flujo**: pide reenvío vía formulario con su email → sistema valida que existe user no verificado → invalida tokens activos del purpose=UserEmailVerification → emite token nuevo → envía email.
- **Post**: User recibe nuevo email. Token previo queda invalidated.
- **Notas**: rate-limited (≤ 3 reenvíos/hora). Anti-enumeration: si email no existe o ya verificado, retorna 200 sin revelar diferencia. Ver ADR-0033 (VerificationToken como child entity).

### UC-022: Expirar registro no verificado (system action)

- **Actor**: Sistema (scheduled job).
- **Pre**: Existen Users con email_verified_at=null y registered_at > 7 días atrás.
- **Flujo**: job daily corre, query identifica candidates, setea expired_at=now() en cada uno → emite event `UnverifiedRegistrationExpired`.
- **Post**: Email queda re-claimable (índice único parcial WHERE expired_at IS NULL). Audit log registrado.

### UC-012: Crear StudentProfile eligiendo CareerPlan

- **Actor**: Member con email verificado.
- **Pre**: Logueado, `email_verified_at NOT NULL`, no tiene un StudentProfile activo para esa carrera.
- **Flujo**: elige University → Career → CareerPlan (por default el vigente) → `enrollment_year` → sistema crea `StudentProfile` con `status='active'`.
- **Post**: Member gana capacidades de alumno para esa carrera.

### UC-013: Cargar historial manualmente

- **Actor**: Alumno.
- **Pre**: Tiene StudentProfile.
- **Flujo**: selecciona Subject de su plan → elige `status` y `approval_method` → ingresa `grade` si corresponde → elige `term_id` (salvo equivalencia) → sistema valida invariantes del EnrollmentRecord → persiste.
- **Post**: Historial actualizado. Afecta estados derivados del grafo de carrera (disponibles / bloqueadas).

### UC-014: Importar historial desde PDF/texto

- **Actor**: Alumno.
- **Preconditions**: Tiene StudentProfile.

**Motivación**: cargar 30 materias a mano es inviable para un alumno avanzado. El parser permite el onboarding rápido.

**Flujo principal:**

1. Alumno elige `source_type` (`pdf`, `text`) y sube el contenido.
2. Sistema crea `HistorialImport` con `raw_payload` (output del parser) y `status='pending'`.
3. Worker de background procesa el payload: extrae materias, estados, notas.
4. Por cada entrada, el sistema resuelve contra `Subject` del `CareerPlan` del alumno usando código de materia.
5. Sistema crea `EnrollmentRecord` por cada materia resuelta (o actualiza si ya existía).
6. `HistorialImport.status='parsed'`, `parsed_at=now()`.

**Flujos alternativos:**

- A1 (paso 3): Si el parser falla, `status='failed'`, `error=<msg>`. El alumno puede reintentar o caer al flujo manual (UC-013).
- A2 (paso 4): Si una materia no se puede resolver (código desconocido, typo), queda marcada en un reporte del import; el alumno decide mapear manualmente.
- A3 (paso 5): Si hay colisión con un `EnrollmentRecord` existente, se respeta el existente y se registra la colisión en el reporte.

**Postconditions**: Historial cargado masivamente. El `HistorialImport` queda como auditoría del proceso y base para reprocesar si el parser mejora.

**ADRs referenciados**: [ADR-0006](../decisions/0006-jsonb-solo-donde-el-shape-es-variable.md).

### UC-015: Editar una entrada del historial

- **Actor**: Alumno.
- **Pre**: Tiene un `EnrollmentRecord` propio.
- **Flujo**: abre entrada → modifica `status`/`grade`/`approval_method` → sistema valida invariantes → actualiza.
- **Post**: EnrollmentRecord actualizado. Puede invalidar reseñas asociadas si la edición la hace inconsistente (ej. vuelve a `cursando`).

### UC-016: Simular inscripción

- **Actor**: Alumno.
- **Preconditions**: Tiene StudentProfile. Puede tener o no historial cargado.

**Motivación**: el caso central del producto. Probar combinaciones tentativas de materias para el próximo cuatrimestre y ver métricas antes de decidir.

**Flujo principal:**

1. Alumno elige `AcademicTerm` objetivo (próximo cuatrimestre del CareerPlan).
2. Sistema muestra materias `disponible` (cumple correlativas `para_cursar` según su historial actual) y `bloqueada` (no las cumple).
3. Alumno selecciona un subset de las disponibles.
4. Sistema computa y muestra: carga horaria total, dificultad promedio combinada (ponderada por cantidad de reseñas), histograma de combinaciones similares que otros alumnos cursaron antes con sus resultados reportados.
5. Alumno itera modificando la selección hasta que le cierra.
6. Sistema NO crea inscripción real — el simulador es editor, no inscribe.

**Flujos alternativos:**

- A1 (paso 3): Si el alumno intenta seleccionar una materia `bloqueada`, la UI la rechaza y muestra qué correlativa le falta.

**Postconditions**: Ninguna persistente en este UC. La persistencia ocurre solo si el alumno ejecuta UC-023 (guardar simulación) — esa es una capability premium.

**ADRs referenciados**: [ADR-0003](../decisions/0003-correlativas-con-dos-tipos.md), [ADR-0004](../decisions/0004-enrollment-guarda-hechos.md), [ADR-0028](../decisions/0028-resenas-opcionales-y-premium-features-como-reward.md), [ADR-0029](../decisions/0029-planning-bc-separado.md).

### UC-023: Guardar simulación como draft (premium)

- **Actor**: Alumno con StudentProfile activo.
- **Pre**: Tiene una simulación en curso desde UC-016. Tiene contribuciones suficientes (al menos 1 reseña publicada — threshold revisable en focus group).
- **Flujo**: confirma "guardar" → sistema crea `SimulationDraft` con `visibility='private'`, `materias[]`, `term_id`.
- **Post**: Draft accesible solo al owner.
- **ADRs**: [ADR-0028](../decisions/0028-resenas-opcionales-y-premium-features-como-reward.md), [ADR-0029](../decisions/0029-planning-bc-separado.md).

### UC-024: Editar simulación draft (premium)

- **Actor**: Alumno (owner del draft).
- **Pre**: Tiene un `SimulationDraft` propio.
- **Flujo**: modifica composición de materias → sistema actualiza el draft.
- **Post**: Draft con nuevas materias. Si era shared, queda shared con la nueva composición.

### UC-025: Borrar simulación draft (premium)

- **Actor**: Alumno (owner).
- **Pre**: Tiene `SimulationDraft` propio.
- **Flujo**: confirma "borrar" → sistema hard-delete.
- **Post**: Draft eliminado. Sin auditoría (privado, sin valor de retención).

### UC-026: Compartir simulación al corpus público (premium)

- **Actor**: Alumno (owner).
- **Pre**: Tiene `SimulationDraft` con `visibility='private'`.
- **Flujo**: clickea "compartir" → sistema setea `visibility='shared'`. Queda en el corpus público anonimizado.
- **Post**: Draft visible a otros alumnos del mismo plan + cuatrimestre vía UC-027.

### UC-027: Ver simulaciones públicas de otros (premium)

- **Actor**: Alumno con StudentProfile activo + contribuciones.
- **Pre**: Logueado, ha publicado al menos una reseña.
- **Flujo**: pide listado vía `GET /api/simulations/public?planId=&termId=` → sistema retorna drafts shared del mismo plan/term, anonimizados, con composición + métricas agregadas.
- **Post**: Alumno tiene social proof / inspiración para sus propias decisiones.

### UC-017: Publicar reseña de una cursada

- **Actor**: Alumno.
- **Preconditions**: Tiene un `EnrollmentRecord` con `status != 'cursando'` y no tiene ya una `Review` para ese enrollment.

**Motivación**: el alumno aporta información para futuros cursantes. La publicación es el motor del crowdsourcing y el loop de reciprocidad.

**Flujo principal:**

1. Alumno abre la cursada elegida (un EnrollmentRecord finalizado).
2. Sistema muestra formulario: `difficulty_rating` (1..5), `subject_text`, `teacher_text`, `final_grade` (si no estaba cargada), selector de `docente_reseñado_id` (constrained a los Teachers del `CommissionTeacher` de la comisión del enrollment).
3. Alumno completa al menos uno de los dos textos, elige difficulty y docente_reseñado.
4. Sistema valida invariantes (rating en rango, grade en rango, textos combinados no vacíos, docente pertenece a la comisión).
5. Sistema ejecuta el filtro automático sobre `subject_text` y `teacher_text`.
6. Si el filtro no marca, `Review.status='published'`, `created_at=now()`.
7. Sistema encola job async para computar `ReviewEmbedding` (feature UI gated, pero pipeline corre desde día 1).
8. Sistema registra `ReviewAuditLog` con `action='published'`.

**Flujos alternativos:**

- A1 (paso 5): Si el filtro marca (insultos obvios, longitudes anómalas, links sospechosos), `Review.status='under_review'` y no se expone públicamente hasta que un moderador la revise.
- A2 (paso 4): Si `docente_reseñado_id` no pertenece a la comisión del enrollment, rechazo (400).
- A3 (paso 3): Si ya existe una Review para ese enrollment, redirigir a UC-018.

**Postconditions**: Reseña visible en página de la materia y del docente, con anonimato del autor.

**ADRs referenciados**: [ADR-0005](../decisions/0005-resena-anclada-al-enrollment.md), [ADR-0007](../decisions/0007-pgvector-implementado-ui-gated-off.md), [ADR-0009](../decisions/0009-anonimato-como-regla-de-presentacion.md).

### UC-018: Editar reseña propia

- **Actor**: Alumno (autor de la reseña).
- **Pre**: Tiene Review propia con `status != 'removed'`.
- **Flujo**: abre reseña → modifica campos → sistema valida → ejecuta filtro automático sobre los nuevos textos (mismo criterio que UC-017) → actualiza `updated_at` → registra `ReviewAuditLog` con `action='edited'` y `changes={before, after}`.
- **Post**: Reseña editada. UI muestra marca "editada" cuando `updated_at > created_at`. Si había `TeacherResponse`, el docente ve un badge "la reseña fue editada después de tu respuesta".

### UC-019: Reportar una reseña

- **Actor**: User logueado (cualquier role que no sea el autor de la Review).
- **Preconditions**: Logueado. No ha reportado esta Review antes (UNIQUE `(review_id, reporter_id)`).

**Flujo principal:**

1. Usuario abre la reseña y elige "reportar".
2. Sistema muestra formulario: `reason` (enum), `details` (texto libre opcional).
3. Usuario confirma.
4. Sistema crea `ReviewReport(status='open')`.
5. Si `COUNT(reports open sobre esa review) >= threshold`, el sistema automáticamente setea `Review.status='under_review'`.

**Flujos alternativos:**

- A1 (paso 4): Si el usuario ya reportó la reseña, error 409.
- A2 (paso 4): Si el usuario es el autor de la reseña, error 403.

**Postconditions**: Report persistido. Cola de moderación eventualmente resuelve (UC-051).

### UC-020: Ver el estado de sus reports

- **Actor**: Usuario que reportó.
- **Pre**: Tiene al menos un ReviewReport propio.
- **Flujo**: pide `GET /me/reports` → sistema devuelve sus reports con `status`, `reason`, `resolution_note` si están resueltos.
- **Post**: Usuario ve seguimiento. Cierra el ciclo de confianza en la moderación.

---

## Claim de identidad docente

### UC-030: Iniciar claim de TeacherProfile

- **Actor**: Member con email verificado.
- **Pre**: No tiene ya un `TeacherProfile` para ese Teacher.
- **Flujo**: busca al Teacher en el catálogo → inicia claim → sistema crea `TeacherProfile(verified_at=NULL)`.
- **Post**: Claim creado pero sin desbloquear capacidades. Elige cómo verificar (UC-031 o UC-032).

### UC-031: Verificar por email institucional

- **Actor**: Member con claim pendiente.
- **Preconditions**: Tiene `TeacherProfile` con `verified_at=NULL`.

**Flujo principal:**

1. Alumno ingresa su email institucional (ej. `alice@unsta.edu.ar`).
2. Sistema valida que el dominio del email esté en `Teacher.university.institutional_email_domains`.
3. Sistema guarda `institutional_email` y genera un token de verificación único con expiración.
4. Sistema envía email al `institutional_email` con el link de confirmación.
5. Alumno hace click en el link.
6. Sistema valida el token y setea `verified_at=now()`, `verification_method='institutional_email'`.

**Flujos alternativos:**

- A1 (paso 2): Si el dominio no pertenece a la universidad del Teacher, rechaza y sugiere verificación manual (UC-032).
- A2 (paso 5): Si el token está expirado o ya usado, error 400; puede reiniciar el flujo desde UC-031.
- A3 (paso 6): Si ya existe un TeacherProfile verificado para ese Teacher (UNIQUE parcial), rechaza con mensaje "este docente ya fue reclamado por otra cuenta".

**Postconditions**: TeacherProfile verificado. Capacidad `review:respond` desbloqueada para reseñas donde el Teacher es el `docente_reseñado`.

**ADRs referenciados**: [ADR-0008](../decisions/0008-roles-exclusivos-profiles-como-capacidades.md).

### UC-032: Solicitar verificación manual

- **Actor**: Member con claim pendiente sin email institucional o cuyo dominio no está registrado.
- **Pre**: Tiene `TeacherProfile` sin verificar.
- **Flujo**: sube evidencia (DNI, contrato, comprobante de designación, etc.) → sistema guarda referencia a la evidencia → el claim queda en cola de admin.
- **Post**: Admin revisa en UC-066. Mientras tanto, no tiene capacidades de docente.

---

## Docente verificado

### UC-040: Responder reseña sobre sí mismo

- **Actor**: Docente verificado.
- **Pre**: Existe una Review con `docente_reseñado_id` coincidente con su Teacher, y no hay ya una `TeacherResponse` para esa reseña.
- **Flujo**: abre la reseña → escribe `response_text` → sistema valida que es el docente_reseñado y que su TeacherProfile está verificado → crea `TeacherResponse(status='published')`.
- **Post**: Respuesta visible públicamente bajo la reseña.

### UC-041: Editar respuesta propia

- **Actor**: Docente autor de la respuesta.
- **Pre**: Tiene `TeacherResponse` propia con `status='published'`.
- **Flujo**: modifica `response_text` → sistema actualiza `updated_at`.
- **Post**: Respuesta actualizada. En MVP no se guarda history de respuestas (solo la versión actual).

---

## Moderador

### UC-050: Ver cola de reseñas under_review

- **Actor**: Moderador.
- **Pre**: Logueado como moderator o admin.
- **Flujo**: pide cola → sistema devuelve Reviews con `status='under_review'` ordenadas por prioridad (cantidad de reports open, antigüedad).
- **Post**: Moderador puede atacar la cola.

### UC-051: Resolver un report

- **Actor**: Moderador.
- **Preconditions**: Existe un `ReviewReport` con `status='open'`.

**Flujo principal:**

1. Moderador abre el report.
2. Sistema muestra: reseña completa, `reason`, `details` del reporter, otros reports abiertos sobre la misma reseña, historial del autor en audit log (identidad visible para moderación interna).
3. Moderador decide:
   - **Upheld**: la reseña infringe. Setea `ReviewReport.status='upheld'`, `moderator_id`, `resolution_note`, `resolved_at=now()`. Sistema actualiza `Review.status='removed'` y marca los otros reports abiertos de la misma reseña como `upheld` con la misma nota. Registra `ReviewAuditLog` con `action='removed'`.
   - **Dismissed**: el report no procede. Setea `ReviewReport.status='dismissed'`, con note. Si era el único report open y la reseña estaba `under_review`, vuelve a `published`.

**Flujos alternativos:**

- A1: Si la reseña ya fue removida por resolución de otro report, el nuevo report se marca automáticamente como `upheld` referenciando la resolución previa.

**Postconditions**: Report resuelto. Autor del report ve el resultado en UC-020. Reseña en estado correspondiente.

### UC-052: Restaurar reseña removida

- **Actor**: Moderador (típicamente ante apelación del autor).
- **Pre**: Review con `status='removed'`.
- **Flujo**: abre reseña → justifica restauración → sistema setea `Review.status='published'`, registra `ReviewAuditLog` con `action='restored'`.
- **Post**: Reseña visible de nuevo. Los reports `upheld` históricos no se revierten.

### UC-053: Ver audit log de una reseña

- **Actor**: Moderador.
- **Pre**: Existe la Review.
- **Flujo**: pide log → sistema devuelve entradas de `ReviewAuditLog` ordenadas por `at`.
- **Post**: Moderador ve historial completo (edits, reports, removes, restores) con actors.

---

## Admin

### UC-060: Gestionar University

- **Actor**: Admin.
- **Pre**: Logueado como admin.
- **Flujo**: CRUD sobre `University`. Campos: name, short_name, slug único, country, city, `institutional_email_domains`.
- **Post**: Catálogo actualizado.

### UC-061: Gestionar Career + CareerPlan

- **Actor**: Admin.
- **Pre**: Existe la University.
- **Flujo**: crea Career → agrega CareerPlan asociado (version_label, duration_terms, default_term_kind, effective_from/to, notes). Puede tener múltiples CareerPlans por Career a lo largo del tiempo.
- **Post**: Estructura lista para cargar materias.

### UC-062: Gestionar Subject + Prerequisite

- **Actor**: Admin.
- **Pre**: Existe el CareerPlan.
- **Flujo**: CRUD sobre Subject dentro del plan. Agrega correlativas `para_cursar` y `para_rendir` como rows de `Prerequisite`. Sistema valida aciclicidad de cada grafo (por tipo) al insertar.
- **Post**: Plan de estudios cargado y listo para ser usado por alumnos.

### UC-063: Gestionar Teacher

- **Actor**: Admin.
- **Pre**: Existe la University.
- **Flujo**: CRUD sobre Teacher (nombre, title con normalización lowercase en DB / title case en display, bio, photo_url).
- **Post**: Docente disponible para asignar a comisiones y para ser reclamado (UC-030).

### UC-064: Gestionar AcademicTerm

- **Actor**: Admin.
- **Pre**: Existe la University.
- **Flujo**: crea AcademicTerm con year, number, kind, start_date/end_date, enrollment_opens/closes. El `label` se computa al insertar según el kind.
- **Post**: Cuatrimestre/bimestre/etc. disponible para asignar comisiones.

### UC-065: Gestionar Commission + CommissionTeacher

- **Actor**: Admin.
- **Pre**: Existen Subject y AcademicTerm coherentes (mismo university_id, `term_kind` match).
- **Flujo**: crea Commission (Subject + AcademicTerm + name + modality + capacity). Asigna Teachers con `role` (titular, adjunto, jtp, ayudante, invitado) vía `CommissionTeacher`.
- **Post**: Comisión disponible para alumnos al cargar historial.

### UC-066: Verificar TeacherProfile manualmente

- **Actor**: Admin.
- **Preconditions**: Existe un `TeacherProfile` con `verified_at=NULL` y evidencia cargada.

**Flujo principal:**

1. Admin abre la cola de verificaciones pendientes.
2. Revisa la evidencia subida por el member.
3. Decide:
   - **Aprobar**: setea `verified_at=now()`, `verification_method='manual'`, `verified_by=admin.id`.
   - **Rechazar**: setea `rejection_reason=<motivo>`, `verified_at` sigue NULL.

**Flujos alternativos:**

- A1: Si ya existe otro TeacherProfile verificado para el mismo Teacher (UNIQUE parcial), no puede aprobar. Debe contactar al solicitante o primero de-verificar el claim anterior.

**Postconditions**: Claim resuelto. Si se aprobó, el member gana capacidad `review:respond`.

**ADRs referenciados**: [ADR-0008](../decisions/0008-roles-exclusivos-profiles-como-capacidades.md).

### UC-067: Crear/deshabilitar cuentas staff

- **Actor**: Admin.
- **Pre**: Logueado como admin.
- **Flujo**: crea User con `role IN ('moderator','admin','university_staff')` desde backoffice. **No existe auto-registro para estos roles**. Deshabilita seteando `disabled_at`.
- **Post**: Staff habilitado/deshabilitado.

### UC-068: Deshabilitar cuenta member

- **Actor**: Moderador o admin.
- **Pre**: Existe el User target con `role='member'`.
- **Flujo**: setea `User.disabled_at=now()`, `disabled_reason`, `disabled_by=actor.id`.
- **Post**: Usuario no puede loguearse. Sus reseñas y datos quedan en DB (soft delete). El anonimato público se mantiene.

---

## University staff

### UC-080: Ver dashboard institucional

- **Actor**: University staff.
- **Pre**: Logueado, vinculado a una `University` específica.
- **Flujo**: pide dashboard → sistema devuelve **solo datos de su universidad**, agregados y anónimos:
  - Reseñas agregadas por Subject y Teacher: dificultad promedio, distribución de ratings, volumen.
  - Tasas de abandono y recursadas por Subject.
  - Combinaciones de cursada que más fallan (las que tienen peores tasas de aprobación según reseñas).
- **Post**: Staff ve su panel. Sin acceso a reseñas individuales ni a identidades.

**ADRs referenciados**: [ADR-0009](../decisions/0009-anonimato-como-regla-de-presentacion.md).

---

## Totales

- **41 casos de uso** cubren el MVP completo (34 originales + 7 nuevos del discovery DDD: UC-021, UC-022, UC-023, UC-024, UC-025, UC-026, UC-027).
- **7 en full form** (flujos con ramas significativas): UC-014, UC-016, UC-017, UC-019, UC-031, UC-051, UC-066.
- **34 en short form** (CRUDs y flujos triviales).

**UCs nuevos del discovery DDD** (ver `eventstorming.md` para captura del proceso):

- UC-021 Reenviar email de verificación.
- UC-022 Expirar registro no verificado (system).
- UC-023 Guardar simulación como draft (premium).
- UC-024 Editar simulación draft (premium).
- UC-025 Borrar simulación draft (premium).
- UC-026 Compartir simulación al corpus público (premium).
- UC-027 Ver simulaciones públicas de otros (premium).

Cada UC se traduce a un application service en la capa `Application/` de Clean Architecture y a un endpoint en `Api/`. La API puede organizarse en controllers por actor o por recurso — ese es el tema del próximo doc (`architecture/api-design.md`).
