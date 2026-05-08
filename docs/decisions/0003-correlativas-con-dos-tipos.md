# ADR-0003: Correlativas con dos tipos (para cursar / para rendir)

- **Estado**: aceptado
- **Fecha**: 2026-04-22

## Contexto

El sistema universitario argentino (y UNSTA en particular) distingue dos tipos de correlatividad:

- **Para cursar:** la materia X requiere que la materia Y esté regularizada (cursada con regularidad aprobada) antes de poder inscribirse.
- **Para rendir:** la materia X requiere que la materia Y esté aprobada (final aprobado) antes de poder rendir su final.

Son dos grafos dirigidos distintos sobre las mismas materias, con semánticas distintas. Ignorar la diferencia limita al simulador a cálculos imprecisos sobre qué materias puede cursar o rendir un alumno.

## Decisión

Tabla `Prerequisite(subject_id, required_subject_id, type)` donde `type` es un enum con dos valores: `para_cursar` y `para_rendir`. La primary key es `(subject_id, required_subject_id, type)`: permite que una misma pareja aparezca en los dos grafos si así lo define el plan.

El UI del grafo de carrera pinta dos tipos de arista (p.ej. línea sólida vs punteada) según el tipo. Cálculos de "materias disponibles para cursar" filtran por `type = 'para_cursar'`, y "materias disponibles para rendir" filtran por `type = 'para_rendir'`.

## Alternativas consideradas

### A. Un solo tipo genérico de correlativa
Más simple de modelar. Descartada porque pierde la granularidad real del dominio. Un alumno que tiene Matemática I regular (no aprobada) puede cursar Matemática II pero no puede rendir su final. Sin el tipo, el simulador no puede decidir esto.

### B. Dos tablas separadas: `PrerequisiteToEnroll` y `PrerequisiteToTakeFinal`
Más explícito. Descartada porque duplica la estructura por una distinción que es mejor expresada como enum. Las queries de grafo terminan siendo `UNION ALL` sobre las dos tablas, menos elegante que `WHERE type = ...`.

## Consecuencias

**Positivas:**
- El simulador puede computar con precisión qué materias puede cursar el alumno (correlativas para cursar cumplidas) y qué finales puede rendir (correlativas para rendir cumplidas).
- El UI del grafo muestra ambos tipos de dependencia, útil para alumnos planificando a largo plazo.

**Negativas:**
- La carga inicial de planes de estudios es más laboriosa: hay que capturar ambos tipos de correlativa para cada materia, no uno.
- El CHECK de aciclicidad debe considerar los dos grafos por separado.

**Invariantes:**
- `subject_id != required_subject_id` (CHECK en DB).
- Ambas materias pertenecen al mismo `CareerPlan` (validado en app al insertar).
- Cada uno de los dos grafos (por tipo) debe ser acíclico (validado al cargar el plan en el backoffice, no como CHECK de DB).
