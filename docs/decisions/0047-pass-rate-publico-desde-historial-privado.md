# ADR-0047: Pass-rate público (aprobación histórica) desde el historial privado de enrollments

- **Estado**: aceptado
- **Fecha**: 2026-06-23

## Contexto

El mockup de la página de materia (US-002) muestra una **"Aprobación histórica"**: el porcentaje de alumnos que aprobó esa materia. Es el dato más objetivo de la página: las reseñas son subjetivas, pero "42% aprueba" es un hecho duro y de alto valor para el alumno que decide si anotarse. Pega de lleno en la tesis del producto ("antes de inscribirte, mirá").

El problema es la **procedencia del dato**. El pass-rate sale del **historial de enrollments**, que es **dato privado**:

- Las **reseñas** son **opt-in público** (ADR-0009): el alumno elige publicarlas, anónimas.
- El **historial** NO es público. El alumno carga sus cursadas (manual o import de PDF) para **planificar lo suyo**. Nadie consintió que su "reprobé Análisis" alimente un número que ve todo el mundo.

Exponer el historial privado agregado como stat público es una **decisión de política de datos** que hasta ahora no estaba documentada, y es una **puerta de una vía**: una vez que el dato se expone, no se "des-expone". Por eso amerita ADR.

Dos riesgos concretos:

1. **Re-identificación**: con pocos alumnos, el agregado filtra dato individual. Si solo 2 personas tienen MAT102 cargada y el stat dice 50%, sabés que una aprobó y una reprobó.
2. **Sesgo de self-report**: el historial es auto-reportado. El que reprobó tiende a no cargar esa cursada (o la omite); el que aprobó la carga. Resultado probable: el pass-rate sale **inflado** vs la realidad. Mostrar "85%" cuando es 50% es peor que no mostrarlo: da falsa sensación de facilidad.

## Decisión

Se expone el pass-rate como stat público en la página de materia, **agregado, anonimizado y gateado**, con las siguientes reglas:

**Definición** (aprobación de examen, no completion rate):

```
pass_rate = aprobadas / (aprobadas + reprobadas)
```

- **Numerador**: enrollments con `status = Aprobada` y `approval_method != Equivalencia` (rindió o promocionó acá; equivalencia no rindió en esta universidad, es ruido).
- **Denominador**: numerador + enrollments con `status = Reprobada`.
- **Excluidos del cálculo**: `Cursando` y `Regular` (sin verdicto todavía), `Abandonada` (es deserción, no un verdicto de examen) y las aprobadas por `Equivalencia`.

**Gate de muestra mínima**: si el denominador (cursadas con verdicto) es **< 5**, el número **no se muestra**: la UI muestra "datos insuficientes". Mitiga la re-identificación y el ruido estadístico de muestras chicas.

**Manejo del sesgo de self-report**: se muestra el porcentaje con un **disclaimer** explícito ("orientativo, basado en los historiales que cargaron los alumnos"). El número es **direccional, no autoritativo**. Se recalibra post-deploy con volumen real (revisar este ADR cuando aterrice el primer deploy).

**Consentimiento**: el copy del flujo de cargar historial (manual + import) suma una línea: "tus cursadas pueden usarse de forma anonimizada y agregada para estadísticas de comunidad". Pre-deploy es solo un cambio de copy; cuando haya usuarios reales, esto es el consentimiento informado del uso.

**Anonimato**: el agregado nunca expone identidad ni cursadas individuales, solo el porcentaje y el N de la muestra.

**Frontera de módulo**: el pass-rate agrega dato del módulo `enrollments`; se consume en la página de materia vía un read cross-BC (Dapper o contract), sin FK ni navigation cross-schema (ADR-0017).

## Alternativas consideradas

- **A. No mostrarlo.** Rechazada: pierde el dato más objetivo y demoable de la página, justo el que mejor sirve la tesis del producto.
- **B. Bucket grueso (aprobación alta/media/baja)** en vez del porcentaje. Evita la falsa precisión de un número inflado, pero pierde impacto y el alumno igual infiere un rango. Descartada para el MVP; se puede revisitar si el sesgo resulta peor de lo esperado.
- **C. Gate alto (N >= 10-15) + porcentaje.** Más estable pero recorta mucho la cobertura pre-deploy (pocas materias llegarían al umbral). El gate de 5 + disclaimer da mejor balance ahora.
- **D. Diferir a post-deploy con dato real.** Lo más conservador, pero pierde el dato más fuerte para el demo del jurado ahora, y la política igual hay que fijarla antes de que entre dato real.
- **E (elegida). Disclaimer + gate N >= 5 + porcentaje.** Conserva el dato fuerte, acota la re-identificación con el gate, y es honesto sobre el sesgo con el disclaimer. Direccional, a recalibrar con volumen.

## Consecuencias

### Positivas

- El alumno tiene un dato objetivo y fuerte para decidir, además de las reseñas subjetivas.
- Demoable para el jurado: es el número más vendible de la página de materia.
- La política queda documentada antes de que entre dato real (la puerta de una vía se cruza con criterio explícito, no por defecto).

### Negativas / a vigilar

- **El número puede estar inflado** por el sesgo de self-report. El disclaimer lo acota pero no lo elimina. Si post-deploy el sesgo resulta severo, revisitar (bucket grueso, gate más alto, o quitar).
- **Cobertura recortada**: materias con < 5 cursadas con verdicto no muestran el dato. Pre-deploy, con el seed demo, hay que sembrar algunas Reprobada/Abandonada para que el número no dé 100% en todo y se vea creíble.
- **Carga cross-módulo**: la página de materia ahora depende de un read de enrollments, no solo de reviews/academic.
- **Consentimiento**: el copy nuevo debe estar en producción ANTES de que se cargue historial real bajo este régimen.

## Notas de implementación

- Query de agregación trivial sobre `enrollments.enrollment_records` agrupando por `subject_id`, contando por `status`/`approval_method`. Aplicar el gate en el read (devolver null si N < 5) para que la UI no tenga que conocer el umbral.
- El seed demo (PR #159) hoy crea solo cursadas Aprobada: extenderlo con Reprobada/Abandonada para que el pass-rate demo sea realista.
- UI: sumar el stat al panel de insights de la materia, con el disclaimer y el estado "datos insuficientes".

## Refs

- [ADR-0009](0009-anonimato-como-regla-de-presentacion.md) (anonimato opt-in de reseñas, el contraste con el historial privado).
- [ADR-0017](0017-persistence-ignorance.md) (no FK ni navigation cross-schema).
- US-002 (página de materia con crowd insights).
