# Cuidar lo publicado

> Épica del grupo **T1 · Cuidar lo publicado (curación, no opinión)** del [catálogo](../../README.md). **Estado**: borrador escrito el 2026-08-19 (README y [flujo](flow.md)), sin pantallas propias; revisión adversarial pendiente antes de planificar. Sin sprint asignado.

## Qué es

Lo que pasa después de publicar, sin que nadie tenga que escribir de nuevo: arreglar un dato duro que quedó mal cargado, y pesar más si probás tu condición de alumno. Las dos son acciones inline, adentro de la ficha, y ninguna es opinión sobre lo publicado: son curación. Corregir no discute un juicio, arregla un dato; verificarse no habilita nada, solo suma una señal que viaja con lo ya contado. Es lo que hace que una ficha no siga mintiendo sobre un dato duro solo porque nadie volvió a mirarlo.

## Para quién

Quien vuelve con cuenta y encuentra un dato duro mal cargado (no hace falta haber aportado antes: D07), y quien ya aportó y quiere que lo suyo pese más probando su condición de alumno, sin que eso sea la puerta de entrada para hablar.

Es un tramo propio y no parte de [Deshacer](../undo/README.md) porque el objeto es otro: Deshacer vuelve sobre **lo propio** (editar o borrar lo que conté); esto vuelve sobre **lo común** (la voz de otro, el dato de la ficha). Mismo actor, otro objeto ([ADR-0077](../../../decisions/0077-the-product-docs-read-as-journeys.md), duda cerrada el 2026-08-23).

## Stories

Las 2 de esta épica. Cada una en su archivo, con su criterio de aceptación; el estado y el sprint viven en [`docs/plan/`](../../../plan/README.md), que las cita por ID.

| ID | De qué trata |
|---|---|
| [US-189](stories/US-189-correct-a-hard-fact-inline/README.md) | Corregir un dato duro ahí mismo |
| [US-190](stories/US-190-verify-my-student-status/README.md) | Verificarme sin que sea obligatorio |


**Escenarios ejecutables**: el "listo cuando" de cada story traducido a Dado/Cuando/Entonces con valores concretos, con sus casos negativos y sus casos borde, en [`scenarios.md`](scenarios.md). Es lo que se lee antes de escribir el test.

## Decisiones que aplica

D07 ([registro del 17](../../../history/reviews/2026-08-17-catalog-propagation.md): corregir pide cuenta, no aporte previo, y queda registrado quién), [ADR-0048](../../../decisions/0048-standing-is-opt-in-and-decoupled-from-email.md) (aceptado y extendido por [ADR-0063](../../../decisions/0063-the-product-is-a-pressure-instrument.md): verificarse es señal, no permiso).

## Pantallas

Tiene una pantalla propia, [**Verificar**](screens/SC-022-verify/README.md), donde el alumno sube su constancia: verificarse suma una señal y nunca es condición para hablar (US-190). Del otro lado del mostrador la resuelve [Verificaciones](../../team/moderate-without-breaking-the-product/screens/SC-032-verifications/README.md), que es de Moderar y opera otro rol: verificación y moderación no pueden convivir en la misma persona ([US-217](../../team/cut-the-access/README.md#stories)).

Su otra acción (Corregir) pasa adentro de pantallas ajenas, a las que esta épica le aporta: [**Mi perfil**](../undo/screens/SC-019-my-profile/README.md) (la señal de verificado se ve ahí, US-190), la acción inline **Corregir** (adentro de la ficha, sin cambiar de pantalla), la [Ficha de cátedra](../choose-where-to-study/screens/SC-002-chair/README.md) y la [Ficha de materia](../choose-where-to-study/screens/SC-007-subject/README.md); en el backoffice, [**Correcciones**](../../team/sustain-the-catalog/screens/SC-028-corrections/README.md) (dueña [Sostener el catálogo](../../team/sustain-the-catalog/README.md)) y [**Verificaciones**](../../team/moderate-without-breaking-the-product/screens/SC-032-verifications/README.md) (dueña [Moderar sin romper el producto](../../team/moderate-without-breaking-the-product/README.md)).

## Lo que esta épica todavía no resuelve

- **Cómo se ve la señal de verificado en la ficha sin identificar a nadie**: qué muestra ("12 de 20 voces verificadas"? un ícono al lado de la ficha?) es una pregunta, no una decisión.
- **Qué datos duros son editables inline y cuáles no** (correlativas, duración nominal, nombre de cátedra), y cuáles quedan reservados al catálogo.
