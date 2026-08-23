# Verificar (la pantalla)

> Ficha de pantalla, dueña: la épica [Cuidar lo publicado](../../README.md). **Estado**: borrador escrito el 2026-08-19 con su [boceto mid-fi](sketch.html) de los dos caminos originales y sus estados, pendiente de sumar el tercero (cargo institucional) que suma esta revisión ([ADR-0073](../../../../../decisions/0073-the-team-verifies-who-replies-against-its-own-catalog.md)); revisada el 2026-08-19 ([registro](../../../../../history/reviews/2026-08-19-shared-screens.md)); hi-fi pendiente. Con cuenta: los tres caminos piden haber iniciado sesión antes de empezar. Slug hoy `/verify-teacher` (hoy solo docente; ni la constancia de alumno ni el cargo institucional tienen pantalla todavía). Épicas que la componen: [Cuidar lo publicado](../../README.md) (la constancia de alumno: señal, opcional y tardía), [Replicar](../../../../reviewed/reply/README.md) (la identidad docente y el cargo institucional: permiso para responder).

## Quién la usa

**Matías**, **Lucía** y **Diego**, si quieren que lo suyo pese más probando su condición de alumno (opcional, nunca obligatorio). **Claudia**, antes de poder responder por su cátedra. **Quien tiene un cargo en la institución**, antes de poder responder por ella ([ADR-0073](../../../../../decisions/0073-the-team-verifies-who-replies-against-its-own-catalog.md)). Del otro lado, en el backoffice, **Camila** trabaja las colas desde [Verificaciones](../../../../team/moderate-without-breaking-the-product/screens/SC-032-verifications/README.md), no desde esta pantalla.

## Qué stories resuelve

[US-190](../../README.md#stories) (para el alumno, verificarse suma una señal, nunca una condición para hablar) y [US-178](../../../../reviewed/reply/README.md#stories) (para el docente, verificar es el permiso de responder, no una señal). Del otro lado del mostrador, resueltas por [Verificaciones](../../../../team/moderate-without-breaking-the-product/screens/SC-032-verifications/README.md): [US-207](../../../../team/moderate-without-breaking-the-product/README.md#stories) (se ve lo mínimo, se compara contra lo declarado, el documento se destruye al resolver), [US-208](../../../../team/moderate-without-breaking-the-product/README.md#stories) (nunca hay camino de la constancia a tus aportes), [US-211](../../../../team/moderate-without-breaking-the-product/README.md#stories) (un rechazo pide motivo y no te marca: podés volver a intentar), [US-210](../../../../team/moderate-without-breaking-the-product/README.md#stories) (la identidad docente se compara contra el equipo docente que el catálogo tiene cargado de esa cátedra, en su propia cola) y [US-225](../../../../team/moderate-without-breaking-the-product/README.md#stories) (el cargo institucional se compara contra los cargos que el catálogo tiene cargados de esa institución, en su propia cola; si el catálogo todavía no lo tiene, el pedido pasa a cargarse antes de resolverse).


[US-227](../../../../reviewed/reply/stories/US-227-claim-an-institutional-position-to-reply/README.md) (el camino del cargo institucional: se pide acá y se elige de la lista corta del catálogo).
## Qué muestra

1. **Elegir el camino**: tres tarjetas separadas, porque son cosas distintas. "Sos alumno" (una señal, opcional y tardía), "Sos docente" (un permiso, sin el cual no hay réplica) o "Tenés un cargo en la institución" (el mismo permiso, para responder por ella).
2. **Constancia de alumno**: subís tu certificado de alumno regular, el documento que toda universidad emite y que conseguís solo, sin que nadie sepa de plan-b ([ADR-0073](../../../../../decisions/0073-the-team-verifies-who-replies-against-its-own-catalog.md), punto 6). El aviso dice que alguien del equipo lo va a mirar una vez y que el documento se destruye al resolver (US-207), y que esto nunca abre un camino hacia tus aportes (US-208).
3. **Identidad docente**: decís qué cátedra tenés (la materia y la cátedra del catálogo). El aviso dice que se compara contra lo que el catálogo ya sabe de esa cátedra (US-210), y que sin esto no se publica ninguna réplica (US-178).
4. **Cargo institucional**: decís qué cargo tenés y en qué institución (de la lista de cargos y la institución del catálogo). El aviso dice que se compara contra lo que el catálogo ya sabe de esa institución (US-225), y que sin esto no se publica ninguna réplica institucional.

## Estados

**Estado "pendiente de revisión"**: para cualquiera de los tres caminos, mientras nadie lo miró todavía. **Estado "aprobada"**: para el alumno, la señal viaja con lo que aportás (cómo se muestra en la ficha sin identificarte es la pregunta abierta de US-190); para el docente o quien tiene un cargo institucional, Responder queda habilitado, cada uno para lo suyo (US-210, US-225). **Estado "rechazada"**: para el alumno, el motivo a la vista y la posibilidad de volver a intentar sin quedar marcado (US-211); para el docente o quien tiene un cargo institucional, el rechazo no habilita la réplica y no marca a nadie (US-210, US-225).

## Lo que no muestra nunca

Ningún camino, directo o por link, de la constancia de alumno a tus reseñas o tus votos (US-208); el documento, una vez resuelto (se destruyó, US-207); que verificarte como alumno habilite algo (es señal, US-190), ni que la identidad docente o el cargo institucional sean solo una señal (son permiso, US-178, US-225); las tres colas mezcladas en el mismo recorrido: cada camino se resuelve por separado.

## Adónde va

Llega desde Mi perfil (la constancia, opcional) y desde Responder o la Ficha de cátedra, cuando el docente todavía no tiene identidad verificada; también desde Responder o la Ficha de institución, cuando quien tiene un cargo institucional todavía no la tiene. Va a: si aprueban la constancia, Mi perfil, con la señal ya puesta; si aprueban la identidad docente o el cargo institucional, [Responder](../../../../reviewed/reply/screens/SC-020-respond/README.md), cada uno para lo suyo.

## Decisiones que aplica

[ADR-0048](../../../../../decisions/0048-standing-is-opt-in-and-decoupled-from-email.md) (para el alumno, verificarse es opcional y self-initiated: pesa, no habilita), [ADR-0068](../../../../../decisions/0068-comment-publishes-as-testimony-below-the-phrases.md) (punto 5: identidad docente o institucional verificada como condición de la réplica), [ADR-0073](../../../../../decisions/0073-the-team-verifies-who-replies-against-its-own-catalog.md) (el alumno se verifica con el certificado de alumno regular; el docente y quien tiene un cargo institucional se verifican contra el catálogo que carga el equipo, nunca contra la entidad, y esa verificación se revalida al año), [Cuidar lo publicado](../../README.md), [Moderar sin romper el producto](../../../../team/moderate-without-breaking-the-product/README.md), [Replicar](../../../../reviewed/reply/README.md).

## Lo que esta ficha deja abierto

- **Qué evidencia sube el docente para probar su cátedra**, que sigue sin definir formato ([ADR-0048](../../../../../decisions/0048-standing-is-opt-in-and-decoupled-from-email.md) dice "aporta evidencia", sin fijar cuál). Del alumno ya no queda abierto: es el certificado de alumno regular ([ADR-0073](../../../../../decisions/0073-the-team-verifies-who-replies-against-its-own-catalog.md), punto 6).
- **Cómo se muestra la señal de verificación en la ficha del sujeto, sin identificar a nadie** (US-190).
