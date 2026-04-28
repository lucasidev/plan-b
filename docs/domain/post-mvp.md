# Post-MVP backlog (placeholders)

Stories que reconocemos como valor futuro pero NO están en el catálogo activo (`docs/domain/user-stories/`). Cuando se aborden, se promueven a una US numerada con AC + sub-tasks concretos basados en las decisiones que estén disponibles en ese momento.

Mantener acá evita ensuciar la lista de US ejecutables con placeholders que nadie puede pickear.

---

## Recibir simulación recomendada

**Idea**: el sistema le propone al alumno una combinación inicial de materias para el próximo cuatrimestre, basada en su historial + simulaciones similares públicas, para que arranque con algo razonable en lugar de una hoja en blanco.

**Insumos potenciales**:
- Historial del alumno (Enrollments).
- Corpus de simulaciones públicas (US-024 + US-027).
- Embeddings de reviews (ADR-0007) si querés ranking semántico.

**Decisiones pendientes (que la promoción a US tiene que cerrar)**:
- Algoritmo: collaborative filtering, heurísticas reglas-based, o embedding-based.
- Métrica de éxito: ¿qué define "buena recomendación"? (¿no recurse? ¿matchea decisión final del alumno?)
- Scope inicial: ¿una recomendación completa o varias alternativas con scoring?

**Por qué no está en el catálogo activo**: es feature de producto madura, no parte del MVP. Sin un algoritmo elegido y métricas, los AC son falsos.

---

## Re-habilitar cuenta member (enable)

**Idea**: contraparte de US-068 (deshabilitar cuenta). Endpoint que el admin puede usar para revertir un disable.

**Decisiones pendientes**:
- ¿Reset automático del flag `must_change_password=true` o no?
- ¿Notificación por email al user re-habilitado?
- Audit log: cómo se loguea quién y por qué.

**Por qué no está en el catálogo activo**: el caso real (admin disabled por error y necesita revertir) es lo suficientemente raro para resolverse manualmente en DB hasta que aparezca el primer caso real.

---

## Migrar StudentProfile entre planes (US-070 referenciada)

**Idea**: cuando un CareerPlan se cierra (ver US-061), los StudentProfile asociados quedan en el plan viejo. Eventualmente algún flow tendría que permitir al alumno (o al staff) migrar al plan nuevo con mapeo de equivalencias.

**Decisiones pendientes**:
- ¿Migración automática 1:1 o el alumno elige qué materias se equivalen?
- Mapeo de `EnrollmentRecord` históricos al nuevo plan (subjects con códigos cambiados).
- ¿Notificación cuando un plan vigente se cierra?

**Por qué no está en el catálogo activo**: requiere primero tener el caso real de plan que se cierra (US-061 implementada) y muestras de cómo se ven los mapeos.

---

## Combinaciones de cursada con peores tasas (split de US-080)

**Idea**: en el dashboard institucional (US-080), ranking de combinaciones de materias en la misma cuatrimestre que históricamente correlacionan con peores tasas de aprobación / mayor abandonment.

**Decisiones pendientes**:
- Heurística de scoring: ¿peso de pass_rate vs abandonment_rate vs sample_size?
- Threshold mínimo de samples para ser considerado.
- Privacy: ¿cómo evitar inferir alumnos individuales si el sample size es chico?

**Por qué no está en el catálogo activo**: el dashboard base (US-080) tiene que aterrizar primero con métricas simples para ver si hay volumen suficiente.

---

## Federación OAuth multi-provider

**Idea**: si Google OAuth (US-035) tiene tracción, sumar Microsoft, GitHub, SSO institucional con SAML.

**Decisiones pendientes**:
- ¿Vale la pena agregar más providers o saltar a Keycloak?
- Qué linking strategy aplicar para múltiples identidades sobre el mismo email.

**Por qué no está en el catálogo activo**: depende de si Google solo es suficiente. Sin uso real, agregar providers es premature optimization.
