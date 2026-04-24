# ADR-0005: Reseña anclada al EnrollmentRecord

- **Estado**: aceptado
- **Fecha**: 2026-04-22

## Contexto

La reseña como entidad necesita un anchor: algo a lo que "pertenece". Las opciones naturales son:

1. **Subject** — reseña de la materia.
2. **Teacher** — reseña del docente.
3. **Commission** — reseña de la comisión (combinación específica de materia + cuatrimestre + docentes).
4. **Pair (Subject, Teacher)** — reseña de la materia con un docente específico.
5. **EnrollmentRecord** — reseña de *esa cursada específica del alumno*.

Cada opción tiene problemas con el caso recursada (el alumno cursa una materia, la reprueba, la recursa en otro cuatrimestre con otro docente):

- Subject → una sola reseña por materia, no distingue cursadas.
- Teacher → pierde el contexto de la materia.
- Commission → funciona pero crea N reseñas distintas por materia sin agregación clara.
- Pair → una comisión puede tener múltiples docentes (titular + JTP), ¿a quién asigna la reseña?

## Decisión

La reseña se ancla a `EnrollmentRecord`:

- `Review.enrollment_id` FK UNIQUE → una reseña por cursada.
- `Review.docente_reseñado_id` FK → Teacher, con la regla de que ese teacher debe pertenecer a la `CommissionTeacher` de la comisión del enrollment.

Implicaciones:

- Recursada = enrollment nuevo → reseña nueva. Sin colisión con la reseña vieja.
- El alumno elige al escribir la reseña **a cuál docente** de la comisión está reseñando (titular, JTP, el que más lo marcó). El texto libre del docente se refiere a ese.
- La reseña se puede filtrar desde la página de la materia (todas las reseñas del subject, agregadas) o desde la página del docente (solo las donde fue el `docente_reseñado`).

## Alternativas consideradas

### A. Ancla a Subject
Simple, pero no distingue recursadas ni docentes. Descartada.

### B. Ancla a (Subject, Teacher) pair
Modelado semántico más cercano al signal útil. Descartada porque el caso "materia con N docentes, ¿a cuál asigno?" fuerza al alumno a elegir igualmente, y entonces es más honesto anclar a la cursada específica y guardar el teacher elegido como FK explícito.

### C. Ancla a Commission
Granular pero genera tantas reseñas por materia como comisiones × cuatrimestres, sin noción de "la cursada de este alumno en particular". La UI se complica para el alumno ("¿dónde está mi reseña?").

## Consecuencias

**Positivas:**
- Caso recursada resuelto sin ambigüedad.
- La UI es explicable: "reseñaste Matemática I con Alice en 2025-C2". Cada reseña tiene contexto completo.
- Agregación doble fácil: por Subject (todas las reseñas de la materia) y por Teacher (todas las reseñas donde fue el docente reseñado).

**Negativas:**
- Requiere que exista un EnrollmentRecord antes de poder reseñar. No se puede reseñar "en abstracto".
- El CHECK de que `docente_reseñado_id` pertenece a la comisión del enrollment es una validación cross-table que no se puede expresar como CHECK de DB simple — vive en la capa de aplicación.

**Invariantes:**
- `Review.docente_reseñado_id` debe existir en `CommissionTeacher` con `commission_id = Review.enrollment.commission_id`.
- No se permite reseñar enrollments con `status = 'cursando'` — hay que esperar que termine el cuatrimestre.
