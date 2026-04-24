# ADR-0002: Versionado explícito de planes de estudio

- **Estado**: aceptado
- **Fecha**: 2026-04-22

## Contexto

Los planes de estudios universitarios cambian con el tiempo. UNSTA puede lanzar "Plan 2024" para reemplazar "Plan 2019": cambian materias, correlativas, cargas horarias. Los alumnos ingresados bajo el plan viejo siguen regidos por el plan viejo hasta recibirse.

Si modelamos "Carrera" como una entidad única con sus materias colgando directo, un cambio de plan obliga a elegir entre:

1. Sobreescribir materias/correlativas y romper el historial de alumnos que cursaron el plan anterior.
2. Duplicar la carrera ("TUDCS-2019" y "TUDCS-2024" como rows separados de Career), perdiendo la noción de continuidad institucional.

Ambas soluciones son malas.

## Decisión

Tabla intermedia `CareerPlan` entre `Career` y `Subject`:

```
Career (1) ──< (N) CareerPlan (1) ──< (N) Subject
```

- `Career` representa la carrera como concepto institucional estable.
- `CareerPlan` representa una versión específica con su `version_label` ("Plan 2024"), `effective_from`, `effective_to`.
- `Subject` pertenece a un `CareerPlan` puntual, no a `Career` directamente.
- `StudentProfile.career_id` apunta a `CareerPlan`, no a `Career`. Cada alumno queda pinneado a su plan.

Planes vencidos (`effective_to IS NOT NULL`) siguen referenciables por alumnos que se recibieron bajo ellos.

## Alternativas consideradas

### A. Sin versionado, un solo plan vigente por carrera

Más simple. Descartada porque no sobrevive al primer cambio de plan real.

### B. Sobreescribir materias con auditoría externa

Mantener solo el plan vigente en `Subject`, usar `ReviewAuditLog` o similar para reconstruir planes históricos. Descartada: un plan viejo no es una "historia de cambios", es una estructura activa que rige cursadas actuales hasta que el último alumno del plan se recibe.

### C. Junction table `PlanSubject` con materias compartidas

Si "Matemática I" es idéntica en Plan 2019 y Plan 2024, compartir la row de Subject vía junction. Descartada para MVP: aunque modela el caso "materia inmutable entre planes", complica el modelo y en la práctica las materias evolucionan incluso sin renombrar el plan. Reseñas contextualizadas al plan del reseñador dan más precisión que agregación cross-plan.

## Consecuencias

**Positivas:**

- Un cambio de plan es agregar un `CareerPlan` nuevo con sus Subjects. Los alumnos existentes quedan en el plan viejo sin intervención.
- Equivalencias entre planes se pueden modelar explícitamente (materia X del Plan 2019 equivale a materia Y del Plan 2024) cuando aparezca el caso.
- Reseñas siempre contextualizadas al plan que cursó el reseñador.

**Negativas:**

- "Matemática I" en Plan 2019 y Plan 2024 son dos rows distintos aunque el contenido sea idéntico. Reseñas no se agregan automáticamente entre planes.
- Queries del dashboard institucional necesitan saber si quieren agregación por carrera (cross-plan) o por plan.

**Cuándo revisitar:**

- Si aparece el caso real de materias formalmente compartidas entre planes/carreras, evaluar junction table o vista materializada que consolide reseñas "equivalentes".
