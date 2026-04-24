# ADR-0004: EnrollmentRecord guarda hechos, no estados derivados

- **Estado**: aceptado
- **Fecha**: 2026-04-22

## Contexto

El UI del grafo de carrera muestra seis estados posibles por materia:

- Aprobada
- Regular (regularizada pero sin final)
- Disponible para cursar
- Bloqueada por correlativas
- Reprobada
- Cursando

De estos, solo cuatro son **hechos** del historial del alumno: aprobada, regular, reprobada, cursando (y abandonada como quinto). Los otros dos — "disponible" y "bloqueada" — son estados **derivables** cruzando correlativas con el historial actual.

La tentación es guardar los seis estados como columna en `EnrollmentRecord` y actualizarlos con triggers o jobs cuando cambian las correlativas. Esta tentación debe resistirse.

## Decisión

`EnrollmentRecord.status` tiene solo valores que representan hechos: `cursando`, `regular`, `aprobada`, `reprobada`, `abandonada`. Acompañado de `approval_method` (cursada, promoción, final, final libre, equivalencia) cuando aplica.

Los estados derivados ("disponible para cursar", "bloqueada") se computan en query cuando el UI los necesita, cruzando:
- Materias del `CareerPlan` del alumno.
- `Prerequisite` por tipo.
- `EnrollmentRecord.status` actual para correlativas requeridas.

La derivación usa CTEs recursivos o joins explícitos. No se materializa en columna.

## Alternativas consideradas

### A. Guardar todos los estados en la columna, actualizar con triggers
Cuando el alumno aprueba una materia, disparar trigger que recalcule "disponible/bloqueada" para todas las demás. Descartada por:

- **Riesgo de inconsistencia:** el trigger puede fallar silenciosamente o ejecutarse fuera de orden en escenarios de concurrencia.
- **Complejidad de triggers:** Postgres triggers con recursive CTEs son frágiles y difíciles de debuggear.
- **Costos de escritura amplificados:** una aprobación actualiza potencialmente N rows.
- **No gana nada:** la derivación es barata en lectura dado que un alumno tiene típicamente <100 materias.

### B. Guardar estados derivados en una vista materializada
Menos acoplada que triggers. Descartada porque la invalidación sigue siendo un problema: hay que refresharla ante cada cambio de historial, y el alumno espera verlo actualizado inmediatamente.

### C. Cachear en aplicación con invalidación manual
El backend calcula y cachea estados derivados. Descartada para MVP por el mismo motivo que (A): añade complejidad sin ganancia de performance mensurable.

## Consecuencias

**Positivas:**
- Cero riesgo de drift entre estado guardado y realidad actual del historial/correlativas.
- Si el plan cambia (correlativas se modifican), los estados derivados se reajustan automáticamente sin migración de datos.
- Menos complejidad en escritura; concentra la complejidad en lectura, donde es más fácil de testear.

**Negativas:**
- Queries del grafo de carrera son más complejas. Requieren al menos un join con `Prerequisite` y recursive CTE si se quiere validar cascada.
- Más carga de CPU por request del grafo vs lectura de columna directa.

**Cuándo revisitar:**
- Si el grafo se vuelve lento con planes de 100+ materias, evaluar vista materializada o cache con invalidación por evento.
