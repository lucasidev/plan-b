# Verificar (la pantalla)

> Ficha de pantalla compartida ([inventario](../README.md)). **Estado**: borrador escrito el 2026-08-19 con su [boceto mid-fi](sketch.html) de los dos caminos y sus estados; revisada el 2026-08-19 ([registro](../../../reviews/2026-08-19-shared-screens.md)); hi-fi pendiente. Con cuenta: los dos caminos piden haber iniciado sesión antes de empezar. Slug hoy `/verify-teacher` (hoy solo docente; la constancia de alumno no tiene pantalla, del inventario). Épicas que la componen: [Cuidar lo publicado](../../../epics/care-for-what-is-published/README.md) (la constancia de alumno: señal, opcional y tardía), [Replicar](../../../epics/reply/README.md) (la identidad docente: permiso para responder).

## Quién la usa

**Matías**, **Lucía** y **Diego**, si quieren que lo suyo pese más probando su condición de alumno (opcional, nunca obligatorio). **Claudia**, antes de poder responder por su cátedra. Del otro lado, en el backoffice, **Camila** trabaja las dos colas desde [Verificaciones](../../../epics/moderate-without-breaking-the-product/screens/verifications/README.md), no desde esta pantalla.

## Qué stories resuelve

[T1-3](../../../epics/care-for-what-is-published/README.md#stories) (para el alumno, verificarse suma una señal, nunca una condición para hablar) y [O7-8](../../../epics/reply/README.md#stories) (para el docente, verificar es el permiso de responder, no una señal). Del otro lado del mostrador, resueltas por [Verificaciones](../../../epics/moderate-without-breaking-the-product/screens/verifications/README.md): [BO2-3](../../../epics/moderate-without-breaking-the-product/README.md#stories) (se ve lo mínimo, se compara contra lo declarado, el documento se destruye al resolver), [BO2-4](../../../epics/moderate-without-breaking-the-product/README.md#stories) (nunca hay camino de la constancia a tus aportes), [BO4-4](../../../epics/moderate-without-breaking-the-product/README.md#stories) (un rechazo pide motivo y no te marca: podés volver a intentar) y [BO2-6](../../../epics/moderate-without-breaking-the-product/README.md#stories) (la identidad docente se prueba contra la cátedra que decís tener, en su propia cola).

## Qué muestra, paso por paso

1. **Elegir el camino**: dos tarjetas separadas, porque son cosas distintas. "Sos alumno" (una señal, opcional y tardía) o "Sos docente" (un permiso, sin el cual no hay réplica).
2. **Constancia de alumno**: subís lo mínimo que pruebe tu condición (qué documento sirve exactamente queda abierto). El aviso dice que alguien del equipo lo va a mirar una vez y que el documento se destruye al resolver (BO2-3), y que esto nunca abre un camino hacia tus aportes (BO2-4).
3. **Identidad docente**: decís qué cátedra tenés (la materia y la cátedra del catálogo). El aviso dice que se compara contra lo que el catálogo ya sabe de esa cátedra (BO2-6), y que sin esto no se publica ninguna réplica (O7-8).

**Estado "pendiente de revisión"**: para cualquiera de los dos caminos, mientras nadie lo miró todavía. **Estado "aprobada"**: para el alumno, la señal viaja con lo que aportás (cómo se muestra en la ficha sin identificarte es la pregunta abierta de T1-3); para el docente, Responder queda habilitado. **Estado "rechazada"**: para el alumno, el motivo a la vista y la posibilidad de volver a intentar sin quedar marcado (BO4-4); para el docente, el rechazo no habilita la réplica y no marca a nadie (BO2-6).

## Lo que no muestra nunca

Ningún camino, directo o por link, de la constancia de alumno a tus reseñas o tus votos (BO2-4); el documento, una vez resuelto (se destruyó, BO2-3); que verificarte como alumno habilite algo (es señal, T1-3), ni que la identidad docente sea solo una señal (es permiso, O7-8); las dos colas mezcladas en el mismo recorrido: cada camino se resuelve por separado.

## Adónde va

Llega desde Mi perfil (la constancia, opcional) y desde Responder o la Ficha de cátedra, cuando el docente todavía no tiene identidad verificada. Va a: si aprueban la constancia, Mi perfil, con la señal ya puesta; si aprueban la identidad docente, [Responder](../../../epics/reply/screens/respond/README.md).

## Decisiones que aplica

[ADR-0048](../../../decisions/0048-oficializacion-de-condicion-opt-in.md) (para el alumno, verificarse es opcional y self-initiated: pesa, no habilita), [ADR-0068](../../../decisions/0068-comment-publishes-as-testimony-below-the-phrases.md) (punto 5: identidad docente o institucional verificada como condición de la réplica), [Cuidar lo publicado](../../../epics/care-for-what-is-published/README.md), [Moderar sin romper el producto](../../../epics/moderate-without-breaking-the-product/README.md), [Replicar](../../../epics/reply/README.md).

## Lo que esta ficha deja abierto

- **Qué documento sirve como constancia**, para el alumno y para el docente.
- **Cómo se muestra la señal de verificación en la ficha del sujeto, sin identificar a nadie** (T1-3).
