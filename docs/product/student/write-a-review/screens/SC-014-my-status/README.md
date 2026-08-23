# Mi situación (la pantalla)

> Ficha de pantalla, dueña: la épica [Reseñar](../../README.md). **Estado**: borrador escrito el 2026-08-19 con su [boceto mid-fi](sketch.html); revisada el 2026-08-19 ([registro](../../../../../history/reviews/2026-08-19-epics-and-screens.md)); hi-fi pendiente. Con cuenta. Sin slug todavía (el mapa la tenía como "diseñada, sin construir"): se fija en inglés al entrar a sprint.

## Quién la usa

**Diego** (dejó en tercero y nadie le preguntó por qué: acá dice cuándo se fue), **los egresados** (me recibí, en…), y cualquier cuenta que quiera contestarlo sin estar reseñando.

## Qué stories resuelve

US-152 (la pregunta por cuatro caminos: esta pantalla es uno; los otros son el paso 2 de [Reseñar](../SC-015-write-review/README.md) con período viejo, la app cuando pasó entré más la duración nominal, y el mail anual de [Avisos](../../../../notices/README.md)). La letra: [README de la épica](../../README.md#stories).

## Qué muestra

La pregunta de trayectoria de a uno, sin plan marcado: ¿seguís cursando la carrera? Sigo / me recibí, en… / me fui, en… / ahora no. Es una sola pregunta con un año, y se contesta una sola vez: respondida, se apaga para siempre (US-169). Sin esto no sabemos dónde se cae la mayoría ni cuánto tarda la gente de verdad, y el silencio no se infiere ([ADR-0067](../../../../../decisions/0067-trajectory-from-declared-facts-by-closed-cohort-and-side-by-side-comparison.md)).

Una sola tarjeta: la pregunta, cuatro salidas (sigo / me recibí, en… / me fui, en… / ahora no), el año cuando hace falta, y una línea que dice qué se hace con eso (cuántos se reciben, cuántos se van y cuándo, de cohortes cerradas, sin tu nombre) y que no se va a volver a preguntar.

## Estados

**Ya contestada**: muestra lo que dijiste y cómo corregirlo si te equivocaste (corregir un hecho propio es editar un aporte: [Deshacer](../../../undo/README.md)). **"Ahora no"**: la cierra sin contestar; queda como "no dijo" hasta que la cuenta vuelva o le llegue el mail anual.

## Lo que no muestra nunca

Sin decidir todavía: este borrador no especifica qué queda afuera de esta pantalla.

## Adónde va

A Mi perfil (desde donde se abre) o a la pantalla desde la que vino. Aparece embebida en el paso 2 de Reseñar cuando el período es viejo.

## Decisiones que aplica

[ADR-0067](../../../../../decisions/0067-trajectory-from-declared-facts-by-closed-cohort-and-side-by-side-comparison.md) (sin esto no se sabe dónde se cae la mayoría ni cuánto tarda la gente de verdad: el silencio no se infiere).

## Lo que esta ficha deja abierto

- **Desde dónde se abre** además de Mi perfil: si la app la ofrece sola cuando pasó entré más la duración nominal (ADR-0067 lo nombra como camino) y cómo.
- **Si "me fui" pide el año o el período**, y qué pasa con quien se fue y volvió (dos hechos, no uno).
