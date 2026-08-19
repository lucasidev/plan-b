# Mi carrera

> Épica del grupo **O3 · Armar el cuatrimestre (lo que la lapicera no calcula sola)** del [catálogo](../../domain/user-stories.md). **Estado**: borrador escrito el 2026-08-19 (README y [flujo](flow.md)); revisión adversarial pendiente antes de planificar. Sin sprint asignado.

## Qué es

Tu plan de estudios con las correlativas resueltas: las materias, lo que ya reseñaste con cómo terminó (que viene marcado solo, porque es un hecho) y lo que marcás aparte como que te falta o considerás (una preferencia privada que no se recaba ni se publica, [ADR-0069](../../decisions/0069-the-marked-plan-is-a-private-preference-not-a-fact.md)). Con esas dos cosas se filtra la pestaña de co-cursada: por par de materias y período, cuántas personas las llevaron juntas y cuántas dejaron una, siempre desde reseñas y nunca desde lo que alguien marcó para sí ([ADR-0067](../../decisions/0067-trajectory-from-declared-facts-by-closed-cohort-and-side-by-side-comparison.md)). Incluye el onboarding (Empezar), donde marcás por dónde vas la primera vez. El producto no arma horarios: entrega los números, y volver a marcar en el plan lo que vas a cursar es el paso siguiente, en papel ([ADR-0063](../../decisions/0063-the-product-is-a-pressure-instrument.md): el planificador propio se retira, y esta épica no lo revive).

## Para quién

**Lucía** (se anotó en cinco y dejó dos: no quiere repetir el error). **Matías** y **Diego** no la usan: no marcan ningún plan, y el producto funciona igual para ellos (O6-3).

## Stories

Las de esta épica, con su letra completa: es la única copia de cada una (el [catálogo](../../domain/user-stories.md) es el índice por ID). Al entrar a sprint, la ficha `US-NNN` amplía la fila, no la reemplaza.

| ID | Story | Listo cuando | Notas |
|---|---|---|---|
| O3-1 | Como quien está cursando, quiero saber qué materias se pueden llevar juntas, para no repetir la combinación que ya me tumbó. | La ficha del plan muestra, por par de materias y período, cuántas personas las reseñaron juntas y cuántas dejaron una; solo desde reseñas, nunca desde el plan marcado. | depende de O4-10 |
| O3-2 | Como quien está cursando, quiero ver esas combinaciones contra lo que me falta, porque el promedio de todos no es mi caso. | 1. Entrando con cuenta, la co-cursada se filtra a las materias que todavía puedo cursar: lo que reseñé con cómo terminó cuenta como hecho, y lo que marqué en mi plan como que me falta o considero es preferencia privada que no se recaba ni se publica ([ADR-0069](../../decisions/0069-the-marked-plan-is-a-private-preference-not-a-fact.md)).<br>2. Resolver correlativas contra el plan es lo que hoy hace `SubjectAvailabilityEvaluator` en `planning`: se rescata a `academic` antes de podar, no se reescribe. | depende de O4-10 |
| O3-3 | Como quien está cursando, quiero armarlo en papel y volver a marcar lo que curso, porque el planificador propio era el error de la versión anterior. | El producto no arma horarios: entrega los números y el paso siguiente vuelve a marcar en el plan lo que vas a cursar, que es preferencia privada, no dato ([ADR-0069](../../decisions/0069-the-marked-plan-is-a-private-preference-not-a-fact.md)). |  |

## Decisiones que aplica

[ADR-0069](../../decisions/0069-the-marked-plan-is-a-private-preference-not-a-fact.md) (lo que marcás es preferencia privada, no dato), [ADR-0067](../../decisions/0067-trajectory-from-declared-facts-by-closed-cohort-and-side-by-side-comparison.md) (la co-cursada: solo desde reseñas, por par y período; el sesgo declarado en Método), [ADR-0066](../../decisions/0066-derived-cards-sum-voices-and-gate-on-coverage-not-a-floor.md) (sin piso: se publica desde la primera voz con sus voces), [ADR-0063](../../decisions/0063-the-product-is-a-pressure-instrument.md) (el planificador se retira: esta épica no lo revive, O3-3).

## Pantallas que compone

- **Mi carrera** (con cuenta): el plan con correlativas, lo reseñado marcado como hecho, la preferencia privada de lo que falta o se considera, y la co-cursada filtrada a tu caso.
- **Empezar** (onboarding, con cuenta): marcás por dónde vas la primera vez; salteable y retomable.
- Llega desde y vuelve a: Ficha de carrera (la pestaña de co-cursada pública, por par y período), Ficha de materia (correlativas: qué pide y qué abre).

## Bocetos

Por dibujar: Mi carrera (cómo se distingue en pantalla lo reseñado, que es hecho, de lo marcado, que es preferencia; la pestaña de co-cursada con muchos pares), Empezar (qué pregunta la primera vez, más allá de por dónde vas).

## Lo que esta épica todavía no resuelve

- **Cómo se ve la pestaña de co-cursada con muchos pares** de materias: qué se prioriza en pantalla y qué queda abajo.
- **Si Empezar pregunta algo más que "por dónde vas"**: el año de ingreso lo pregunta la primera reseña (O4-11), no Empezar.
- **Qué pasa con la preferencia marcada cuando el plan se reforma**: los dos planes coexisten con su año (BO5-1), pero no está dicho si la preferencia privada sobrevive a la reforma o se pierde.
