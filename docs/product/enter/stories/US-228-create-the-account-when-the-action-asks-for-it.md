# US-228: Crear la cuenta recién cuando la acción me la pide

**Épica**: [Entrar](../README.md)
**Del mapa**: ninguno (sale de la revisión de pantallas sin story dueña, 2026-08-21)

## Historia

Como quien acaba de leer una ficha y quiere aportar, quiero crear la cuenta ahí mismo y con lo mínimo, porque si me piden media vida antes de dejarme contar algo me voy y no vuelvo.

## Listo cuando

- Se crea con mail y contraseña, diciendo si curso o doy clases, y con el consentimiento informado a la vista antes de mandar (Ley 25.326).
- Institución y carrera vienen precargadas y de solo lectura si llegué desde un pedido confirmado ([US-142](../../request-a-career/stories/US-142-get-notified-when-its-loaded.md)); si no, se declaran acá.
- La pantalla responde lo mismo exista o no la cuenta ("te mandamos un mail"), y es el mail el que resuelve: si estaba libre trae el link para terminar, y si ya tenía cuenta avisa e invita a Ingresar o Recuperar, sin crear nada ([ADR-0076](../../../decisions/0076-the-three-doors-answer-the-same-whether-the-account-exists-or-not.md)).

## Dónde se resuelve

- [Registro](../screens/SC-026-sign-up/README.md): el formulario entero, sus dos estados y el consentimiento.
- [Avisos](../../notices/screens/SC-034-mail/README.md): el mail que resuelve la diferencia entre una dirección libre y una que ya tiene cuenta, que es lo único que la pantalla no dice.

## Notas

Esta story faltaba. Registro era una de las tres pantallas del producto que ninguna story pedía, y el README de la épica sostenía que "no tiene requisitos propios". Ese criterio ya se había falsado con [US-220](US-220-recover-the-password-by-mail.md), que volvió como story porque no es una garantía transversal sino una acción concreta con su pantalla y su criterio. Registrarse es exactamente eso.

Lo que sí son garantías de otras épicas y no stories de acá: que leer no pida cuenta ([US-168](../../do-not-bother-me/stories/US-168-read-without-an-account.md)) y que el gate esté en la acción y no en la puerta.

Al escribirla apareció una contradicción: Registro avisaba "ese mail ya está registrado" y con eso confirmaba que la cuenta existe, mientras [US-220](US-220-recover-the-password-by-mail.md) hace lo contrario a propósito. La resolvió [ADR-0076](../../../decisions/0076-the-three-doors-answer-the-same-whether-the-account-exists-or-not.md): las tres puertas responden igual, porque acá tener cuenta significa haber aportado, y esa asimetría hacía que ocultarlo en las otras dos no sirviera de nada.
