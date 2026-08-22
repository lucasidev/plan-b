# US-228: Crear la cuenta recién cuando la acción me la pide

**Épica**: [Entrar](../README.md)
**Del mapa**: ninguno (sale de la revisión de pantallas sin story dueña, 2026-08-21)

## Historia

Como quien acaba de leer una ficha y quiere aportar, quiero crear la cuenta ahí mismo y con lo mínimo, porque si me piden media vida antes de dejarme contar algo me voy y no vuelvo.

## Listo cuando

- Se crea con mail y contraseña, diciendo si curso o doy clases, y con el consentimiento informado a la vista antes de mandar (Ley 25.326).
- Institución y carrera vienen precargadas y de solo lectura si llegué desde un pedido confirmado ([US-142](../../request-a-career/stories/US-142-get-notified-when-its-loaded.md)); si no, se declaran acá.
- Un mail ya registrado no crea una segunda cuenta: avisa en la misma pantalla y ofrece Ingresar, sin perder lo que ya escribí.

## Dónde se resuelve

- [Registro](../screens/SC-026-sign-up/README.md): el formulario entero, sus dos estados y el consentimiento.
- [Ingresar](../screens/SC-025-sign-in/README.md): a donde lleva el aviso de mail ya registrado.

## Notas

Esta story faltaba. Registro era una de las tres pantallas del producto que ninguna story pedía, y el README de la épica sostenía que "no tiene requisitos propios". Ese criterio ya se había falsado con [US-220](US-220-recover-the-password-by-mail.md), que volvió como story porque no es una garantía transversal sino una acción concreta con su pantalla y su criterio. Registrarse es exactamente eso.

Lo que sí son garantías de otras épicas y no stories de acá: que leer no pida cuenta ([US-168](../../do-not-bother-me/stories/US-168-read-without-an-account.md)) y que el gate esté en la acción y no en la puerta.

**Queda abierto**: decir "ese mail ya está registrado" revela que la cuenta existe, y [US-220](US-220-recover-the-password-by-mail.md) protege lo contrario en Recuperar ("sin decir nada más de la cuenta"). Las dos pantallas tratan el mismo dato con criterios opuestos y nadie lo decidió; la ficha de Registro declara ese estado, así que acá se escribe como está y la contradicción queda anotada.
