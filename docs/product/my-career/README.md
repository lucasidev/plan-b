# Mi carrera

> Épica del grupo **O3 · Armar el cuatrimestre (lo que la lapicera no calcula sola)** del [catálogo](../README.md). **Estado**: borrador escrito el 2026-08-19 (README y [flujo](flow.md)) y sus pantallas propias con ficha y boceto mid-fi (Mi carrera, Empezar); revisión adversarial pendiente antes de planificar. Sin sprint asignado.

## Qué es

Tu plan de estudios con las correlativas resueltas: las materias, lo que ya reseñaste con cómo terminó (que viene marcado solo, porque es un hecho) y lo que marcás aparte como que te falta o considerás (una preferencia privada que no se recaba ni se publica, [ADR-0069](../../decisions/0069-the-marked-plan-is-a-private-preference-not-a-fact.md)). Con esas dos cosas se filtra la pestaña de co-cursada: por par de materias y período, cuántas personas las llevaron juntas y cuántas dejaron una, siempre desde reseñas y nunca desde lo que alguien marcó para sí ([ADR-0067](../../decisions/0067-trajectory-from-declared-facts-by-closed-cohort-and-side-by-side-comparison.md)). Incluye el onboarding (Empezar), donde marcás por dónde vas la primera vez. El producto no arma horarios: entrega los números, y volver a marcar en el plan lo que vas a cursar es el paso siguiente, en papel ([ADR-0063](../../decisions/0063-the-product-is-a-pressure-instrument.md): el planificador propio se retira, y esta épica no lo revive).

## Para quién

**Lucía** (se anotó en cinco y dejó dos: no quiere repetir el error). **Matías** y **Diego** no la usan: no marcan ningún plan, y el producto funciona igual para ellos (US-170).

## Stories

Las 3 de esta épica. Cada una en su archivo, con su criterio de aceptación; el estado y el sprint viven en [`docs/plan/`](../../plan/README.md), que las cita por ID.

| ID | De qué trata |
|---|---|
| [US-143](stories/US-143-check-which-subjects-to-take-together.md) | Ver qué materias se pueden cursar juntas |
| [US-144](stories/US-144-filter-pairings-by-my-own-plan.md) | Filtrar esas combinaciones contra lo que todavía falta cursar |
| [US-145](stories/US-145-plan-on-paper-mark-it-yourself.md) | Armar el cuatrimestre en papel, sin planificador propio |

## Decisiones que aplica

[ADR-0069](../../decisions/0069-the-marked-plan-is-a-private-preference-not-a-fact.md) (lo que marcás es preferencia privada, no dato), [ADR-0067](../../decisions/0067-trajectory-from-declared-facts-by-closed-cohort-and-side-by-side-comparison.md) (la co-cursada: solo desde reseñas, por par y período; el sesgo declarado en Método), [ADR-0066](../../decisions/0066-derived-cards-sum-voices-and-gate-on-coverage-not-a-floor.md) (sin piso: se publica desde la primera voz con sus voces), [ADR-0063](../../decisions/0063-the-product-is-a-pressure-instrument.md) (el planificador se retira: esta épica no lo revive, US-145).

## Pantallas

Las dos que existen solo para esta épica viven acá, con su ficha y su boceto:

- [**Mi carrera**](screens/SC-011-my-career/README.md) (con cuenta): el plan con correlativas, lo reseñado marcado como hecho, la preferencia privada de lo que falta o se considera, la co-cursada filtrada a tu caso; [boceto mid-fi](screens/SC-011-my-career/sketch.html).
- [**Empezar**](screens/SC-012-onboarding/README.md) (con cuenta): el onboarding, marcás por dónde vas la primera vez, salteable y retomable; [boceto mid-fi](screens/SC-012-onboarding/sketch.html).

Las que comparte con otras épicas: la [**Ficha de carrera**](../choose-where-to-study/screens/SC-001-career/README.md) (la pestaña de co-cursada pública, por par y período) y la [**Ficha de materia**](../choose-where-to-study/screens/SC-007-subject/README.md) (correlativas: qué pide y qué abre).

## Lo que esta épica todavía no resuelve

- **Cómo se ve la pestaña de co-cursada con muchos pares** de materias: qué se prioriza en pantalla y qué queda abajo.
- **Si Empezar pregunta algo más que "por dónde vas"**: el año de ingreso lo pregunta la primera reseña (US-155), no Empezar.
- **Qué pasa con la preferencia marcada cuando el plan se reforma**: los dos planes coexisten con su año (US-204), pero no está dicho si la preferencia privada sobrevive a la reforma o se pierde.
