# ADR-0001: Multi-universidad como dominio raíz desde día 1

- **Estado**: aceptado
- **Fecha**: 2026-04-22

## Contexto

La carpeta inicial del proyecto planteó UNSTA como única universidad en el MVP, con "soporte multi-universidad" catalogado como feature post-MVP.

Al bajar el diseño a esquema de datos, quedó claro que:

- Varias universidades argentinas operan con sistemas académicos distintos: UNSTA/USPT son cuatrimestrales; SIGLO 21 es bimestral; otras son semestrales o mixtas.
- Si la entidad raíz del dominio académico es implícita (un "UNSTA" hardcodeado), agregar la segunda universidad después implica retrofit en toda entidad con referencia indirecta: Career, Subject, Teacher, AcademicTerm, Commission, y sus FKs.
- Una migración futura de este alcance toca datos en producción y reorganiza queries. Riesgo innecesario cuando el costo de modelarlo bien ahora es una tabla `University` y un FK por entidad.

## Decisión

Modelar `University` como entidad raíz del dominio académico desde el inicio. Cada entidad académica (Career, Teacher, AcademicTerm) referencia directamente a una universidad. Career → CareerPlan → Subject cuelgan transitivamente.

`AcademicTerm` se generaliza con un campo `kind ENUM('bimestral','cuatrimestral','semestral','anual')` que define la duración del período. Permite representar cualquier calendario académico sin cambiar el esquema.

`University.institutional_email_domains TEXT[]` habilita la validación automática de verificación de docentes por email institucional, con lógica específica por universidad.

## Alternativas consideradas

### A. Solo UNSTA, universidad implícita
Más simple inicialmente. Descartada por el costo de retrofit cuando llegue la segunda universidad: cada entidad académica necesita ganar un FK, se rehace la API, se migran datos.

### B. `University` desde el inicio, pero `AcademicTerm` atado a un solo kind
Modela la universidad raíz pero pierde la flexibilidad de calendarios. Descartada porque SIGLO (bimestral) ya entra en el scope declarado del proyecto.

## Consecuencias

**Positivas:**
- Agregar SIGLO, USPT, o cualquier otra universidad es una inserción de datos, no una migración estructural.
- El dominio queda correctamente modelado: una materia siempre "es de" una universidad.
- La verificación de docentes por email institucional se resuelve con datos (el dominio está en `University`), no con código hardcodeado.

**Negativas:**
- +1 tabla al inicio, +1 FK en cada entidad académica.
- Las queries del dashboard institucional tienen que filtrar por `university_id` siempre: los clientes del dashboard solo ven datos de su universidad.

**Invariantes a mantener en app:**
- `Career.university_id = Teacher.university_id` cuando un teacher está en `CommissionTeacher` de una comisión de esa carrera.
- `AcademicTerm.university_id = CareerPlan.career.university_id` cuando se arma una Commission de una Subject del plan.
