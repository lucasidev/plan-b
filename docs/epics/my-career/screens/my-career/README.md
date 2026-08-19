# Mi carrera (la pantalla)

> Ficha de pantalla, dueña: la épica [Mi carrera](../../README.md). **Estado**: borrador escrito el 2026-08-19 con su [boceto mid-fi](sketch.html); revisión adversarial pendiente antes del hi-fi. Con cuenta: sin cuenta no se llega, aunque la co-cursada pública de la Ficha de carrera sí se lee sin cuenta (el gate está en la acción, no en la lectura). Slug hoy `/my-career` (existe el chasis; el contenido se rehace).

## Quién la usa

**Lucía** (se anotó en cinco y dejó dos: no quiere repetir el error). **Matías** y **Diego** no la usan: no marcan ningún plan, y el producto funciona igual para ellos (O6-3). El flujo entero: [`flow.md`](../../flow.md).

## Qué stories resuelve

O3-1 (por par de materias y período, cuántas personas las reseñaron juntas y cuántas dejaron una), O3-2 (la co-cursada filtrada a lo que todavía podés cursar, con lo reseñado como hecho y lo marcado como preferencia), O3-3 (el producto no arma horarios: entrega los números; volver a marcar en el plan lo que vas a cursar es preferencia, no dato), O6-3 (todo funciona sin plan marcado, salvo esta pantalla, que necesita saber qué cursás). La letra de cada una: [README de la épica](../../README.md#stories).

## Qué muestra

1. **El plan de la carrera declarada**, con sus correlativas (qué pide cada materia para cursarla).
2. **Lo que ya reseñaste, con cómo terminó**: viene marcado solo, porque es un hecho ([ADR-0067](../../../../decisions/0067-trajectory-from-declared-facts-by-closed-cohort-and-side-by-side-comparison.md)); no se toca a mano.
3. **Lo que marcás aparte, materia por materia, como que te falta o considerás**: preferencia privada, y la pantalla lo dice con esas palabras, no se recaba, no se publica, no entra a ningún agregado ([ADR-0069](../../../../decisions/0069-the-marked-plan-is-a-private-preference-not-a-fact.md)).
4. **La pestaña de co-cursada**: por par de materias y período, cuántas personas las llevaron juntas y cuántas dejaron una, solo desde reseñas, nunca desde el plan marcado (ADR-0067); filtrada a las materias que todavía podés cursar, cruzando lo reseñado y lo marcado (O3-2). Sin piso: se publica desde la primera voz ([ADR-0066](../../../../decisions/0066-derived-cards-sum-voices-and-gate-on-coverage-not-a-floor.md)).

**Estados**: sin nada marcado ni reseñado, el plan se ve igual, vacío de marcas, y sigue siendo útil; la facultad reformó el plan, los dos planes coexisten con su año, y cada reseña queda pegada al período y a la materia canónica, no a la fila de un plan en particular (BO5-1: cómo se ve en pantalla es pregunta abierta).

## Lo que no muestra nunca

Ningún horario armado (el producto no arma horarios, [ADR-0063](../../../../decisions/0063-the-product-is-a-pressure-instrument.md)); lo que marcaste como preferencia en ningún lado público ni en el CSV; ninguna combinación de materias como recomendación, solo los números, de a par.

## Adónde va

A la Ficha de materia (correlativas: qué pide y qué abre) y a Reseñar. Llega desde la Ficha de carrera (la pestaña de co-cursada pública, por par y período) y desde Empezar, la primera vez.

## Decisiones que aplica

[ADR-0069](../../../../decisions/0069-the-marked-plan-is-a-private-preference-not-a-fact.md) (lo marcado es preferencia privada, no dato), [ADR-0067](../../../../decisions/0067-trajectory-from-declared-facts-by-closed-cohort-and-side-by-side-comparison.md) (la co-cursada: solo desde reseñas, por par y período), [ADR-0066](../../../../decisions/0066-derived-cards-sum-voices-and-gate-on-coverage-not-a-floor.md) (sin piso: se publica desde la primera voz), [ADR-0063](../../../../decisions/0063-the-product-is-a-pressure-instrument.md) (el planificador se retira: esta pantalla no arma horarios, solo entrega los números).

## Lo que esta ficha deja abierto

- **Cómo se distingue visualmente lo reseñado (hecho) de lo marcado (preferencia)** dentro del mismo plan.
- **Cómo se ve la pestaña de co-cursada con muchos pares** de materias: qué se prioriza en pantalla y qué queda abajo.
- **Qué pasa con la preferencia marcada cuando el plan se reforma**: si sobrevive a la reforma o se pierde.
