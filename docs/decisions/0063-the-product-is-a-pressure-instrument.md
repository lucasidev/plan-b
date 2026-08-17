# ADR-0063: The product is a pressure instrument, not a planner

- **Estado**: aceptado
- **Fecha**: 2026-08-16

## Contexto

El producto anterior era un planificador de cuatrimestre alimentado por reseñas. Tenía un lazo fatal que ningún sprint logró cerrar: el planificador necesitaba corpus para ser mejor que una lapicera, y el corpus necesitaba alumnos que llegaran por el planificador. S12 ("cerrar el lazo que produce el corpus") fue la admisión operativa de ese lazo: cada US del sprint fabricaba un momento de extracción de datos (el cierre de cursada, la reseña al confirmar un import, la valoración en el picker de comisión) para un producto al que nadie llegaba con ganas de darle datos.

El 2026-08-16 quedó fijada una tesis nueva, con texto completo en [`docs/THESIS.md`](../THESIS.md): plan-b es un instrumento de presión que convierte lo que los alumnos saben por haberlo vivido en datos agregados que aguantan una discusión. Este ADR registra lo que ese viraje hace con el repo: qué gobierna ahora, qué se retira, qué sobrevive, y en qué estado quedan las decisiones previas.

## Decisión

1. **`docs/THESIS.md` gobierna todo lo demás.** Sus cinco decisiones (dos números nunca promediados, atribución por frase, leer sin cuenta, la materia como unidad, el catálogo cargado por el equipo) son el marco contra el que se evalúa cualquier trabajo futuro. Un doc o un módulo que las contradiga está mal él, no la tesis.

2. **El planificador se retira.** El módulo `planning` (simulaciones, borradores), la superficie `/plan` (evaluación de combinaciones, publicar plan, feed de comunidad) y las features de frontend que la sirven pertenecen a la versión anterior. La poda es trabajo consciente que se planifica en [`docs/STATUS.md`](../STATUS.md), no un borrado de pasada: mientras el código exista, los docs que lo espejan siguen siendo válidos como descripción de código.

3. **El testimonio deja de ser texto libre con puntajes.** El modelo nuevo (frases predefinidas curadas, con atribución, de las que se derivan exigencia y gestión con encogimiento por muestra) se diseñará con sus propios ADRs. Este ADR no anticipa ese diseño; solo registra que el modelo anterior (reseña texto-libre + estrellas anclada a la cursada) queda en retiro con la versión anterior.

4. **El catálogo lo escribe solo el equipo.** Muere el import de planes propuesto por alumnos como mecanismo de escritura del catálogo. El backoffice existente pasa de periférico a herramienta central, y el importador CSV (US-007, todavía en backlog) se vuelve su pieza más urgente. "Si una carrera no está, se pide y la cargamos."

5. **Rankings quedan fuera por tesis**, no por prioridad: "no es un buscador de carreras, ni un ranking".

### Estado de las decisiones previas

Con la convención del repo (el ADR viejo marca su `Estado`; el archivo nunca se borra):

- **Intacto y extendido**: [ADR-0048](0048-oficializacion-de-condicion-opt-in.md). La tesis resolvió la verificación por el lado que 0048 ya había elegido: aportar pide cuenta, no constancia (exigirla a todos pondría el muro antes del valor), y la condición probada de alumno es una señal opcional que viaja con el dato en vez de habilitar el acto. La oficialización por evidencia (nunca por email institucional) pasa de badge de perfil a semilla del mecanismo de esa señal (US-091/US-092); el cómo exacto (desglose junto al número, umbrales de los datos más finos) es diseño del sistema de frases.
- **Superados enteros por este ADR**: [ADR-0028](0028-resenas-opcionales-y-premium-features-como-reward.md) (las dos mitades del modelo, reseñas opcionales y premium del simulador como reward, pertenecen al producto anterior) y [ADR-0029](0029-planning-bc-separado.md) (el BC que separaba se retira).
- **Superados por el sistema de frases** ([ADR-0064](0064-phrases-with-voices-not-scores.md), [ADR-0065](0065-attribution-is-the-axis-not-a-split.md), [ADR-0066](0066-derived-cards-sum-voices-and-gate-on-coverage-not-a-floor.md), [ADR-0067](0067-trajectory-from-declared-facts-by-closed-cohort-and-side-by-side-comparison.md)), que hereda su doctrina y retira su superficie: [ADR-0047](0047-pass-rate-publico-desde-historial-privado.md) (publicar proporciones con su n sigue, como proporción de voces con encogimiento, y su definición de aprobación sigue desde lo que cada reseña declara; el piso de cinco personas no: se publica desde la primera voz, y la sospecha en grupos chicos se declara en vez de esconderse detrás de un umbral) y [ADR-0061](0061-ratings-aggregate-by-commission-and-roll-up-on-coverage.md) (los ratings por comisión se reemplazan por frases con voces; el gate de cobertura para derivar carrera e institución, que 0061 dejó sin umbral, queda fijado).
- **Intactos y reforzados por la tesis**: [ADR-0009](0009-anonimato-como-regla-de-presentacion.md) (anonimato como regla de presentación) y [ADR-0054](0054-metrica-sin-sustento-viaja-null-nunca-cero.md) (métrica sin sustento viaja null). El encogimiento por muestra de la tesis es la continuación directa de los dos.
- **Superados por la reseña nueva** ([ADR-0064](0064-phrases-with-voices-not-scores.md)): [ADR-0005](0005-reseña-anclada-al-enrollment.md) (la reseña ya no ancla a un `EnrollmentRecord`: ancla a la cursada, cuenta × materia × período) y [ADR-0060](0060-review-names-the-teacher-it-remembers.md) (ya no hay reseña de texto libre con docente reseñado; la cátedra como sujeto propio sobrevive en el glosario).
- **Superado por el sistema de frases**: [ADR-0010](0010-threshold-auto-hide-configurable-por-env-var.md) (el auto-ocultar por umbral de reportes; en el producto nuevo ninguna cantidad de reportes baja nada sola: [ADR-0068](0068-comment-publishes-as-testimony-below-the-phrases.md)).
- **En retiro junto con la versión anterior**, sin reemplazo directo hasta que el sistema de frases traiga el suyo: [ADR-0012](0012-edicion-de-resena-solo-desde-published.md), [ADR-0013](0013-embedding-gated-en-transiciones-a-published.md), [ADR-0031](0031-review-audit-log-como-projection.md), [ADR-0032](0032-edit-destructive-enrollment-invalida-review.md). Describen código que todavía existe.
- **Diferido a revisión contra la tesis**: [ADR-0039](0039-meilisearch-como-motor-de-búsqueda-global.md) (la búsqueda del lector sigue teniendo sentido; el motor dedicado se re-evalúa cuando el producto nuevo la necesite). **Revalidado contra la tesis**: [ADR-0040](0040-notifications-como-bounded-context.md), porque los avisos sostienen cinco stories del producto nuevo (el que pidió una carrera se entera de que la cargamos; quien aportó se entera antes de que se publique la réplica) y son infraestructura del primer bloque, aunque arranquen solo por mail.

## Alternativas consideradas

- **A. Seguir parchando el lazo (el plan S12+).** Rechazada: el problema vivía en la motivación del que contribuye, no en las features. Nadie llega con ganas de inventariar su cuatrimestre; llega con una materia en la cabeza. Fabricar momentos de extracción no cambia eso.
- **B. Pivot aditivo: mantener el planificador y sumarle el corpus de frases.** Rechazada: competir con la lapicera es lo que volvió compleja la versión anterior, y mantener dos productos divide el foco, la superficie de mantenimiento y el mensaje.
- **C. Repo nuevo desde cero.** Rechazada: el catálogo público, el backoffice ya construido (su resto sigue en backlog), identity, moderación y el sistema visual sirven directo a la tesis nueva, y la infraestructura (monolito modular, outbox, pirámide de testing) no tiene nada de la tesis vieja. Se poda, no se demuele.

## Consecuencias

### Positivas

- La tesis es falsable rápido: "¿la gente toca frases sobre la materia que la destrozó?" se contesta con una carrera y dos semanas. La anterior necesitaba corpus y cuatrimestres para medirse.
- La fricción del acto de contribuir baja de "inventariá tu cuatrimestre" a "tocá frases sobre una materia".
- La curaduría de frases concentra el riesgo de publicar cosas duras sobre gente con nombre en texto que escribimos y controlamos nosotros, no en texto libre de terceros.

### Negativas

- Se descarta inversión reciente: el BC `planning` entero y el lazo de reseñas que S12 acababa de cerrar con US-015. Las decisiones caducan; esta caducó temprano.
- El catálogo completo cargado por el equipo es costo pagado antes del primer dato.
- El corpus de reseñas texto-libre existente (de desarrollo, sin usuarios reales) no migra a nada.

### A vigilar

- **La sospecha en grupos chicos.** Los datos que la tesis promete (cuánto tarda la gente de verdad, abandono en co-cursada) son más re-identificantes que los anteriores, y el crudo descargable sin registro garantiza que terceros crucen tablas. La posición tomada ([ADR-0066](0066-derived-cards-sum-voices-and-gate-on-coverage-not-a-floor.md)) es no esconderlo detrás de un piso: no se publica quién, nunca, y ningún umbral elimina la sospecha en un grupo de siete; se le dice al que reseña antes de publicar. Lo que sí se protege es el texto (moderar lo que expone a una persona) y qué puede citar la réplica.
- **La curaduría hereda el problema del texto libre en otra forma**: texto libre no agrega, frases curadas no cubren. Sin un canal de "ninguna de estas describe lo mío" que alimente la curaduría, el producto responde "¿falló la institución?" solo con las fallas que se nos ocurrieron. ([ADR-0064](0064-phrases-with-voices-not-scores.md) lo resuelve: el comentario existe y de los comentarios de muchos se destilan las frases que faltaban.)
- **El conflicto llega antes que el corpus**: el primer docente enojado aparece con pocos toques, no con cuarenta. La réplica con sus límites, la metodología visible ("cómo se calcula este número") y la política de baja son material de lanzamiento.

## Refs

- [`docs/THESIS.md`](../THESIS.md): el texto completo de la tesis.
- [`docs/STATUS.md`](../STATUS.md): cierre de S12 y planificación de la poda.
- ADRs afectados: 0005, 0009, 0010, 0012, 0013, 0028, 0029, 0031, 0032, 0039, 0040, 0047, 0048, 0054, 0060, 0061.
