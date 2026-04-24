# ADR-0008: Roles exclusivos + profiles como unlockers de capacidades

- **Estado**: aceptado
- **Fecha**: 2026-04-22

## Contexto

El sistema tiene cuatro tipos de actor:

1. **Alumnos:** usuarios principales, pueden reseñar, simular, gestionar su historial.
2. **Docentes:** pueden responder a reseñas sobre ellos, si se verifican.
3. **Moderadores:** resuelven reports, remueven reseñas.
4. **Personal institucional:** acceden al dashboard agregado.

Dos complicaciones:

- Un mismo usuario puede ser **alumno y docente a la vez** (ej. alumno de posgrado que enseña). Esto parece sugerir multi-rol.
- Un docente **no debe poder moderar reseñas sobre sí mismo u otros**: conflicto de interés. "Quien te captura no te juzga."

Un modelo multi-rol naïve (`User.roles[]`) permite que la misma persona sea docente y moderador simultáneamente, habilitando el abuso.

## Decisión

**Roles exclusivos: un usuario tiene exactamente un rol.** Campo `User.role` con enum:

- `member`: comunidad académica: alumnos, docentes, o ambos.
- `moderator`: staff de moderación.
- `admin`: staff con permisos totales.
- `university_staff`: cliente comercial que accede al dashboard institucional.

**"Docente" no es un rol — es un profile.** Un `member` puede reclamar identidad de docente creando un `TeacherProfile` y verificándose (por email institucional o manual). Lo mismo con identidad de alumno via `StudentProfile`.

**Moderator/admin/university_staff no pueden tener profiles.** Sus cuentas existen exclusivamente para su función operativa, sin identidad académica en la plataforma. Un docente que quiera moderar debe tener una cuenta separada con rol `moderator` (distinta cuenta, distinto email).

**Permisos se resuelven como rol base + capacidades desbloqueadas por profile:**

- Capacidades como "crear reseña" requieren `StudentProfile` existente + enrollment existente.
- Capacidad "responder a reseña" requiere `TeacherProfile` verificado + reseña cuyo `docente_reseñado_id` coincide con el teacher reclamado.
- Capacidades de moderación son del rol base `moderator`, sin profiles requeridos.

## Alternativas consideradas

### A. `User.roles TEXT[]` multi-rol

Permite que la misma cuenta acumule capacidades. Descartada por dos razones:

- **Conflicto de interés estructural:** nada impide que un docente sume el rol `moderator` y modere reseñas sobre sí mismo.
- **Complejidad de permisos:** evaluar el permiso efectivo requiere unión de permisos por rol, y detectar combinaciones inválidas agrega reglas ad-hoc.

### B. Rol `teacher` dentro del enum

Distingue docente como rol de primera clase. Descartada porque no modela el caso "alumno que también enseña" sin volver a multi-rol. Además, fuerza a que el sistema conozca la identidad docente desde el registro, en vez de que el usuario la reclame cuando quiere.

### C. Tabla separada `Moderator` con auth independiente

Moderadores viven en otra tabla, con su propio login. Descartada para MVP: overkill. La exclusividad se mantiene con `User.role` enum y la validación de que moderators no tienen profiles.

## Consecuencias

**Positivas:**

- Separación de poderes garantizada estructuralmente: no hay combinación posible de columnas donde un moderador sea docente.
- El permiso "responder reseña" nunca se le otorga a un moderador porque estructuralmente no puede tener `TeacherProfile`.
- Un usuario comunidad que "se jubila de alumno y empieza a enseñar" no cambia de rol: agrega `TeacherProfile` y desactiva `StudentProfile`.
- Moderadores y admins se crean manualmente desde el backoffice — no hay flujo público de registro que los produzca, reduciendo superficie de ataque.

**Negativas:**

- Si un docente decidía ayudar con moderación, necesita crear una segunda cuenta con otro email. No se puede usar el email institucional para ambas.
- La evaluación de permisos requiere joins a `StudentProfile`/`TeacherProfile` además de leer `User.role`. Leve overhead en cada request autenticada (mitigable con inclusión de profile en el JWT).

**Invariantes a enforced en app:**

- `User.role != 'member'` → `NOT EXISTS(StudentProfile WHERE user_id = user.id)` AND `NOT EXISTS(TeacherProfile WHERE user_id = user.id)`.
- `User.role = 'member'` → puede tener 0, 1, o 2 profiles.

Estos invariantes se aplican en la capa de aplicación (servicios de registro, claim de profile). Un trigger de integridad opcional puede agregarse en etapa de endurecimiento.
