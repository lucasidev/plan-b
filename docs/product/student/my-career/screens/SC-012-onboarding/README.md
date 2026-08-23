# Empezar (la pantalla)

> Ficha de pantalla, dueña: la épica [Mi carrera](../../README.md). **Estado**: borrador escrito el 2026-08-19 con su [boceto mid-fi](sketch.html); revisada el 2026-08-19 ([registro](../../../../../history/reviews/2026-08-19-epics-and-screens.md)); hi-fi pendiente. Con cuenta: es el paso siguiente al Registro. Slug hoy `/onboarding/*` (existe el chasis: se rehace, muere "cargá tu historial", la carga del historial de la versión anterior en `frontend/src/app/onboarding/history/`).

## Quién la usa

Cualquier cuenta recién registrada. **Matías** (le da lo mismo el producto, quiere que quede registrado: por él el onboarding es salteable y retomable), **Lucía** (marca por dónde va apenas entra). El flujo entero de esta épica: [`flow.md`](../../flow.md); las garantías que se verifican acá son de [Que no me molesten](../../../../guarantees/README.md).

## Qué stories resuelve

US-145 (marcar por dónde vas es la preferencia privada que después arma el paso siguiente, en papel: el producto no arma horarios), US-170 (salteable: todo funciona sin plan marcado, salvo lo que necesita saber qué cursás), US-169 (nada de lo que la cuenta ya declaró se vuelve a preguntar acá). La letra de cada una: [README de la épica](../../README.md) y de [Que no me molesten](../../../../guarantees/README.md#stories).

## Qué muestra

Un shell de foco, sin navegación: la carrera que declaraste al registrarte, y tu plan para marcar por dónde vas, materia por materia. Es preferencia privada, no un hecho ([ADR-0069](../../../../../decisions/0069-the-marked-plan-is-a-private-preference-not-a-fact.md)): no pregunta si ya la aprobaste (eso lo dice una reseña), solo si te falta o la estás considerando. No pregunta el año en que entraste (eso lo pregunta la primera vez que reseñás, US-155) ni ningún otro dato que la cuenta ya haya declarado (US-169).

El chasis de hoy tiene varias pantallas (`career`, `plan-import`, `history`, `done`); cuántos pasos concretos tiene la versión rehecha, más allá de marcar por dónde vas, es diseño de esta ficha.

## Estados

**Salteado**, en cualquier paso, sin bloquear el resto de la app. **Retomable**, si lo dejaste a medias, la próxima vez seguís donde quedaste.

## Lo que no muestra nunca

El año de ingreso (es de la primera reseña, no de acá); ningún dato ya declarado en el Registro; nada de "cargá tu historial" (era el import de la versión anterior, en retiro: [ADR-0063](../../../../../decisions/0063-the-product-is-a-pressure-instrument.md)); ningún horario armado; nada que se publique o se recabe con lo que marcás.

## Adónde va

A Mi carrera, con lo que marcaste ya reflejado en el plan. Llega desde el Registro, apenas se crea la cuenta.

## Decisiones que aplica

[ADR-0069](../../../../../decisions/0069-the-marked-plan-is-a-private-preference-not-a-fact.md) (lo que marcás es preferencia privada, no dato), [ADR-0063](../../../../../decisions/0063-the-product-is-a-pressure-instrument.md) (el planificador se retira: esta pantalla no lo revive). Las garantías de [Que no me molesten](../../../../guarantees/README.md) que se verifican acá: salteable y retomable (US-170), no repregunta nada ya declarado (US-169).

## Lo que esta ficha deja abierto

- **Qué pregunta además de "por dónde vas"**: la épica no lo cierra.
- **Si ofrece reseñar al terminar**: no está decidido.
