# Responder

> Épica del grupo **O7 · Contestar lo que se publicó (con nombre, porque es público)** del [catálogo](../../README.md). **Estado**: reescrita el 2026-08-26 al modelo de [ADR-0082](../../../decisions/0082-the-review-captures-the-cursada-in-three-layers.md) a [ADR-0085](../../../decisions/0085-three-instruments-and-official-data.md) (no existe testimonio ni réplica a un testimonio: se responde a los números agregados de la ficha); revisión adversarial pendiente antes de planificar. Sin sprint asignado.

## Qué es

La cátedra o la institución responde, con nombre (y cargo, si responde por la institución), a los **números agregados de su propia ficha**: nunca a un comentario individual, porque el texto libre no se publica nunca ([ADR-0084](../../../decisions/0084-free-text-feeds-curation-and-is-never-published.md)). Sin testimonio al que citar, la respuesta se publica apenas se manda: no hay chequeo previo ni plazo de retención, porque esos mecanismos protegían al autor de un comentario público, y acá no hay ningún comentario público del que protegerlo. Responder pide identidad verificada: para el docente, contra el equipo de la cátedra que el catálogo ya tiene cargado; para quien responde por la institución, contra un cargo normalizado de la lista corta del catálogo ([ADR-0073](../../../decisions/0073-the-team-verifies-who-replies-against-its-own-catalog.md)); las dos en una cola propia, separada de las constancias de alumno. Cuando todavía no respondió nadie, la ficha declara el estado del canal, nunca el silencio: **"Sin respuesta · avisada el [fecha]"**, nunca "no quiso responder". Publicada, la respuesta no baja ni mueve ningún conteo. Del lado de la institución, la misma lógica se lee en su ficha: la serie de sus propios conteos por período (US-177), con los cortes de versión de la frase declarados.

## Para quién

**Claudia** (da bien su materia; le conviene que se publique y le da miedo que se publique). **Prof. Paredes** (no piensa contestar: el silencio es una posición, y no se presume). **Marcela Sosa**, Secretaría Académica de UNSTA (pide que verifiquen su cargo antes de poder responder por la institución).

## Stories

Cada una en su archivo, con su criterio de aceptación; el estado y el sprint viven en [`docs/plan/`](../../../plan/README.md), que las cita por ID.

| ID | De qué trata |
|---|---|
| [US-227](stories/US-227-claim-an-institutional-position-to-reply/README.md) | Pedir que verifiquen mi cargo antes de responder |
| [US-172](stories/US-172-reply-with-a-verified-identity/README.md) | Responder con identidad verificada |
| [US-174](stories/US-174-compare-institutions-side-by-side/README.md) | ~~Comparar instituciones lado a lado~~ (concepto rebasado el 2026-08-25) |
| [US-176](stories/US-176-declare-channel-state-never-silence/README.md) | Declarar el estado del canal |
| [US-177](stories/US-177-track-change-across-periods/README.md) | Ver la serie de mis propios conteos por período |
| [US-178](stories/US-178-verify-identity-before-replying/README.md) | Verificar identidad antes de responder |

**Escenarios ejecutables**: el "listo cuando" de cada story traducido a Dado/Cuando/Entonces con valores concretos, con sus casos negativos y sus casos borde, en [`scenarios.md`](scenarios.md). Es lo que se lee antes de escribir el test.

## Decisiones que aplica

[ADR-0084](../../../decisions/0084-free-text-feeds-curation-and-is-never-published.md) (el texto libre no se publica nunca: no hay testimonio ni comentario individual al que responder, y por eso la respuesta no pasa por ningún chequeo previo ni plazo de retención), [ADR-0083](../../../decisions/0083-the-ficha-publishes-counts-not-scores.md) (los números concretos de la ficha a los que se responde: moda y distribución por frase, convergencia, tasa de finalización, comparación entre cátedras hermanas), [ADR-0082](../../../decisions/0082-the-review-captures-the-cursada-in-three-layers.md) (la cursada es lo único que se reseña; la serie va por el período en que pasó, no por cuándo se cargó la reseña), [ADR-0073](../../../decisions/0073-the-team-verifies-who-replies-against-its-own-catalog.md) (identidad docente y cargo institucional verificados contra el catálogo del equipo, nunca por auto-servicio; revalidación anual sin retirar lo publicado; toda respuesta la firma una persona con nombre y cargo, nunca la institución sola), [ADR-0085](../../../decisions/0085-three-instruments-and-official-data.md) (por qué no hay comparación de señales de reseña entre instituciones: van cada una en su caja, y por eso se retira US-174), D06 ([registro del 17](../../../history/reviews/2026-08-17-catalog-propagation.md): el estado del canal, "sin respuesta" y "docente sin identidad verificada", nunca "no quiso responder"), [ADR-0009](../../../decisions/0009-review-anonymity-is-a-presentation-rule.md) (el anonimato de quien reseña sigue siendo regla de presentación; quien responde, en cambio, lo hace siempre con nombre).

## Pantallas

Las dos que existen por esta épica viven acá, con su ficha y su boceto:

- [**Ficha de institución**](screens/SC-005-institution/README.md) (pública, sin cuenta): donde la institución se ve a sí misma, con la navegación de sus carreras con datos, su transparencia relevada, las notas de curaduría y su cobertura ([ADR-0085](../../../decisions/0085-three-instruments-and-official-data.md)); su propia respuesta y su serie por período (US-172, US-177) quedan como hueco declarado, ver "Lo que esta épica todavía no resuelve".

- [**Responder**](screens/SC-020-respond/README.md) (con identidad verificada): responde a los números agregados de la ficha, se publica directo al mandarla (sin chequeo ni plazo) y así queda: con nombre, rol y fecha, sin mover ningún conteo.

Las que comparte con otras épicas: [**Verificar**](../../student/care-for-what-is-published/screens/SC-022-verify/README.md) (identidad docente o cargo institucional, el permiso para responder), la [Ficha de cátedra](../../student/choose-where-to-study/screens/SC-002-chair/README.md) (el bloque "Qué respondió la cátedra", con "Sin respuesta · avisada el [fecha]" cuando no hay nada) y **Verificaciones** ([Moderar sin romper el producto](../../team/moderate-without-breaking-the-product/README.md)), la cola donde se aprueba o rechaza la identidad antes de habilitar Responder. Los mails de [Avisos](../../notices/README.md) traen hasta acá, aunque qué dispara ese aviso queda abierto (ver abajo).

## Lo que esta épica todavía no resuelve

- **Qué dispara el aviso que deja la fecha en "avisada el [fecha]"**: la story que lo explicaba (el resumen periódico al docente) se retiró con el viraje a este modelo; falta decidir qué evento o mail genera esa fecha.
- **Dónde se ve, en la Ficha de institución, el bloque de conteos al que responde la institución**: [ADR-0073](../../../decisions/0073-the-team-verifies-who-replies-against-its-own-catalog.md) ya fija que la institución responde "sobre lo que se dice de ella como sujeto (trámites, título, trato)", que es el instrumento administrativo de [ADR-0085](../../../decisions/0085-three-instruments-and-official-data.md); pero el boceto de la Ficha de institución (2026-08-25) todavía no dibuja ese bloque de conteos propios, solo su transparencia relevada, sus notas de curaduría y sus carreras con datos. Sin ese bloque dibujado, [US-227](stories/US-227-claim-an-institutional-position-to-reply/README.md) no tiene todavía dónde mostrarse publicada.
- **Qué pasa con una respuesta publicada cuando la verificación de su autor vence** y no la renueva: [ADR-0073](../../../decisions/0073-the-team-verifies-who-replies-against-its-own-catalog.md) fija que se revalida al año y que lo publicado no se retira, pero no dice si el canal vuelve a declararse vacío ni si el cargo se muestra con la fecha en que se verificó.
- **Qué estado muestra el canal si Prof. Paredes deja la cátedra** (se retira o lo reemplazan) sin que nadie asuma su lugar todavía: ninguna story de esta épica lo cubre.
