# Registro (la pantalla)

> Ficha de pantalla compartida ([inventario](../README.md)). **Estado**: borrador escrito el 2026-08-19 con su [boceto mid-fi](sketch.html) del formulario y sus estados; revisión adversarial pendiente antes del hi-fi. Pública: se llega y se completa sin cuenta, y es la puerta hacia una (declarás dónde estás, no elegís de un catálogo de marketing). Slug hoy `/sign-up` (del inventario). Épicas que la componen: [Que no me molesten](../../../epics/do-not-bother-me/README.md) (nada de lo que declarás acá se vuelve a preguntar), [Pedir una carrera](../../../epics/request-a-career/README.md) (institución y carrera precargadas si venís de un pedido confirmado), [Reseñar](../../../epics/write-a-review/README.md) (el año de ingreso no se pregunta acá: lo pregunta la primera reseña).

## Quién la usa

**Ana**, cuando llega desde el mail "cargamos lo que pediste" (institución y carrera ya declaradas por su pedido). **Lucía**, **Matías** y **Diego**, para poder reseñar. **Claudia**, porque necesita cuenta antes de poder probar su identidad docente en Verificar y responder.

## Qué stories resuelve

[O2-4](../../../epics/request-a-career/README.md#stories) (Pedir una carrera: si te registrás desde el pedido, institución y carrera quedan precargadas y no se preguntan de nuevo), [O6-2](../../../epics/do-not-bother-me/README.md#stories) (Que no me molesten: ningún hecho ya declarado se vuelve a preguntar en ningún flujo). Por lo que **no** pide: [O4-11](../../../epics/write-a-review/README.md#stories) (Reseñar) fija que el año de ingreso se pregunta en la primera reseña, una sola vez, no acá.

## Qué muestra

- **Mail y contraseña.**
- **La situación declarada**: curso, cursé y dejé, me recibí, docente. No es el `role` técnico de la cuenta, que sigue siendo `member`: las tres primeras arman una situación de alumno; "docente" abre un reclamo de identidad que después se prueba en Verificar, sin el cual no habilita nada ([T1-3](../../../epics/care-for-what-is-published/README.md#stories), [O7-8](../../../epics/reply/README.md#stories)).
- **Institución y carrera**: precargadas y de solo lectura si venís de un pedido confirmado (O2-4); si no, se declaran acá. Cómo se eligen (catálogo cerrado o texto libre) queda abierto.
- **El consentimiento informado** (Ley 25.326): una línea antes de mandar el formulario, con el aviso de privacidad público, según las Restricciones del [catálogo](../../../domain/user-stories.md#restricciones-no-son-stories-se-verifican-en-el-dod).

**Estado "precargado desde el pedido"**: institución y carrera ya completas, con la nota de por qué. **Estado "mail ya registrado"**: aviso inline con link a Ingresar y a Recuperar.

## Lo que no muestra nunca

El año de ingreso (O4-11: lo pregunta la primera reseña); ninguna pregunta de trayectoria (seguís, te recibiste, te fuiste: eso es Mi situación, y aparece después, de a una); institución o carrera repetidas si ya vinieron de un pedido confirmado (O6-2).

## Adónde va

Llega desde: Ingresar ("¿no tenés cuenta?"), el mail "cargamos lo que pediste" de [Avisos](../../../epics/notices/README.md), y el mismo gate en la acción que trae a Ingresar. Al crear la cuenta, vuelve a la acción que disparó el gate si había una, o sigue a Empezar (el onboarding, saltable: O6-3).

## Decisiones que aplica

[THESIS.md](../../../THESIS.md) (decisión 3: producir pide cuenta), [Que no me molesten](../../../epics/do-not-bother-me/README.md) (O6-2), [Pedir una carrera](../../../epics/request-a-career/README.md) (O2-4), [Reseñar](../../../epics/write-a-review/README.md) (O4-11), Restricciones del [catálogo](../../../domain/user-stories.md#restricciones-no-son-stories-se-verifican-en-el-dod) (consentimiento informado, Ley 25.326).

## Lo que esta ficha deja abierto

- **Si la situación declarada se puede cambiar después** de registrarse (de "curso" a "me recibí", por ejemplo).
- **Verificación del mail al registrarse**: [D03](../../../reviews/2026-08-17-catalog-propagation.md) confirma el mail para pedidos y reportes; ninguna fuente dice si el registro mismo lo pide.
- **Cómo se eligen institución y carrera** cuando no vienen precargadas: catálogo cerrado o texto libre, la misma ambigüedad que [Pedir](../../../epics/request-a-career/screens/request/README.md).
