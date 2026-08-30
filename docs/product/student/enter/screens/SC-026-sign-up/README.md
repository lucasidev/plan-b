# Registro (la pantalla)

> Ficha de pantalla, dueña: la épica [Entrar](../../README.md). **Estado**: borrador escrito el 2026-08-19 con su [boceto mid-fi](sketch.html) del formulario y sus estados; revisada el 2026-08-19 ([registro](../../../../../history/reviews/2026-08-19-shared-screens.md)); hi-fi pendiente. Pública: se llega y se completa sin cuenta, y es la puerta hacia una (declarás dónde estás, no elegís de un catálogo de marketing). Slug hoy `/sign-up`. Épicas que la componen: [Que no me molesten](../../../../guarantees/README.md) (nada de lo que declarás acá se vuelve a preguntar), [Pedir una carrera](../../../request-a-career/README.md) (institución y carrera precargadas si venís de un pedido confirmado), [Reseñar](../../../write-a-review/README.md) (el año de ingreso no se pregunta acá: lo pregunta la primera reseña).

## Quién la usa

**Ana**, cuando llega desde el mail "cargamos lo que pediste" (institución y carrera ya declaradas por su pedido). **Lucía**, **Matías** y **Diego**, para poder reseñar. **Claudia**, porque necesita cuenta antes de poder probar su identidad docente en Verificar y responder.

## Qué stories resuelve

[US-142](../../../request-a-career/README.md#stories) (Pedir una carrera: si te registrás desde el pedido, institución y carrera quedan precargadas y no se preguntan de nuevo), [US-169](../../../../guarantees/README.md#stories) (Que no me molesten: ningún hecho ya declarado se vuelve a preguntar en ningún flujo), [US-190](../../../care-for-what-is-published/README.md#stories) (Cuidar lo publicado: elegir "estudiante" abre el reclamo de condición de alumno que se prueba después en Verificar, opcional) y [US-178](../../../../reviewed/reply/README.md#stories) (Responder: elegir "docente" abre el reclamo de identidad que se prueba después en Verificar, sin el cual no se puede responder). Por lo que no pide el año de ingreso: eso lo fija [Reseñar](../../../write-a-review/README.md#stories), en la primera reseña, una sola vez.

- [US-228](../../stories/US-228-create-the-account-when-the-action-asks-for-it/README.md): crear la cuenta con lo mínimo, con el consentimiento y los dos estados.

## Qué muestra

- **Mail y contraseña.**
- **Quién sos acá**: estudiante (curso o cursé) o docente. No es el `role` técnico de la cuenta, que sigue siendo `member`: "docente" abre un reclamo de identidad que después se prueba en Verificar, sin el cual no habilita nada ([US-190](../../../care-for-what-is-published/README.md#stories), [US-178](../../../../reviewed/reply/README.md#stories)). Tu situación de alumno (seguís, te recibiste, te fuiste) no se pregunta acá: se pregunta después, de a una y una sola vez, en Mi situación.
- **Institución y carrera**: precargadas y de solo lectura si venís de un pedido confirmado (US-142); si no, se declaran acá. Cómo se eligen (catálogo cerrado o texto libre) queda abierto.
- **El consentimiento informado** (Ley 25.326): una línea antes de mandar el formulario, con el aviso de privacidad público, según las Restricciones del [catálogo](../../../../README.md).

## Estados

**Estado "precargado desde el pedido"**: institución y carrera ya completas, con la nota de por qué. **Estado "te mandamos un mail"**: el mismo, exista o no la cuenta. No hay estado que distinga un mail libre de uno ya registrado: eso lo resuelve el mail y no la pantalla ([ADR-0076](../../../../../decisions/0076-the-three-doors-answer-the-same-whether-the-account-exists-or-not.md)).

## Lo que no muestra nunca

El año de ingreso (US-155: lo pregunta la primera reseña); ninguna pregunta de trayectoria (seguís, te recibiste, te fuiste: eso es Mi situación, y aparece después, de a una); institución o carrera repetidas si ya vinieron de un pedido confirmado (US-169).

## Adónde va

Llega desde: Ingresar ("¿no tenés cuenta?"), el mail "cargamos lo que pediste" de [Avisos](../../../../notices/README.md), y el mismo gate en la acción que trae a Ingresar. Al crear la cuenta, vuelve a la acción que disparó el gate si había una, o sigue directo a leer o a reseñar: no hay paso intermedio ([ADR-0086](../../../../../decisions/0086-the-product-informs-it-does-not-track-your-degree.md), US-170).

## Decisiones que aplica

[THESIS.md](../../../../../THESIS.md) (decisión 3: producir pide cuenta), [Que no me molesten](../../../../guarantees/README.md) (US-169), [Pedir una carrera](../../../request-a-career/README.md) (US-142), [Reseñar](../../../write-a-review/README.md) (US-155), Restricciones del [catálogo](../../../../README.md) (consentimiento informado, Ley 25.326).

## Lo que esta ficha deja abierto

- **Si la situación declarada se puede cambiar después** de registrarse (de "curso" a "me recibí", por ejemplo).
- **Verificación del mail al registrarse**: [D03](../../../../../history/reviews/2026-08-17-catalog-propagation.md) confirma el mail para pedidos y reportes; ninguna fuente dice si el registro mismo lo pide.
- **Cómo se eligen institución y carrera** cuando no vienen precargadas: catálogo cerrado o texto libre, la misma ambigüedad que [Pedir](../../../request-a-career/screens/SC-010-request/README.md).
