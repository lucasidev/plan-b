# Garantías

> Nivel producto: valen en toda pantalla, de cualquier recorrido. Nacieron como la épica **Que no me molesten** (grupo O6 del mapa) y subieron acá cuando el producto se organizó por recorridos: no son un tramo que se recorre, son lo que vale mientras se recorre cualquiera. **Estado**: vigentes; se verifican en cada ficha de pantalla y en el Definition of Done. No se planifican.

## Qué es

El contrapeso de todos los tramos: cinco garantías que ninguna persona pide en primera persona y que, aun así, tienen que cumplirse en toda pantalla nueva. No se construyen (no hay una US que las cierre): se verifican, pantalla por pantalla, contra un checklist. Son la decisión 3 de la tesis dicha como lista de chequeo (leer no pide cuenta), más que nada ya declarado se vuelva a preguntar, que el producto funcione sin un plan marcado, y que nada esté destacado ni patrocinado. Recuperar la contraseña estaba acá como una quinta garantía y salió el 2026-08-20: no es transversal, es una acción con su pantalla, así que vive como story propia de Entrar ([US-220](../student/enter/stories/US-220-recover-the-password-by-mail/README.md)).

## Para quién

**Quien lee** (Valentina, Silvia, Rocío, y cualquiera sin cuenta), **quien vuelve** (cualquier cuenta, cuando vuelve a leer o a corregir), y **Matías**: por él el gate llega en la acción y no en la puerta, y el onboarding es saltable.

## Las garantías

Las cinco del producto. Cada una en su carpeta, con su criterio de aceptación y sus escenarios; el estado y el sprint viven en [`docs/plan/`](../../plan/README.md), que las cita por ID.

> Garantías, como O5. US-168 es la decisión 3 de la tesis dicha como checklist.

| ID | De qué trata |
|---|---|
| [US-168](US-168-read-without-an-account/README.md) | Leer sin necesitar cuenta |
| [US-169](US-169-never-asked-twice/README.md) | No repetir lo que ya dije |
| [US-170](US-170-skip-onboarding-and-still-use-it/README.md) | Saltear el onboarding y usar la app |
| [US-171](US-171-nothing-sponsored-or-featured/README.md) | Que no me vendan nada |
| [US-167](US-167-report-content-without-an-account/README.md) | Reportar contenido publicado sin registrarse |


**Escenarios ejecutables**: el "listo cuando" de cada story traducido a Dado/Cuando/Entonces con valores concretos, con sus casos negativos y sus casos borde, en [`scenarios.md`](scenarios.md). Es lo que se lee antes de escribir el test.

## Decisiones que aplica

[THESIS.md](../../THESIS.md) (decisión 3: leer no pide cuenta, producir sí; el gate está en la acción, no en la puerta), [ADR-0069](../../decisions/0069-the-marked-plan-is-a-private-preference-not-a-fact.md) (marcar el plan es preferencia privada y opcional: sin ella, todo lo demás sigue funcionando), [ADR-0063](../../decisions/0063-the-product-is-a-pressure-instrument.md) (rankings y acuerdos con instituciones quedan fuera por tesis: no hay lugar para destacar ni patrocinar), [Definition of Done](../../plan/definition-of-done.md), sección 7 "Restricciones del producto" (que a su vez cita las restricciones del [catálogo](../README.md): accesibilidad, datos personales, política de moderación pública, rendimiento). Que el reenganche por mail sea una vez al año y con una sola pregunta, y que "entré" se pregunte una sola vez, son reglas del producto que hoy no fija ningún ADR vigente.

## Pantallas

Esta épica no tiene pantallas propias: es la garantía que se verifica en cada pantalla de las demás. Las que cita para verificarse viven en sus épicas dueñas: todas las públicas del [mapa](../map.md) (US-168, US-171), [Reseñar](../student/write-a-review/README.md) y [Empezar](../student/my-career/README.md) (US-169, US-170), [**Ingresar**](../student/enter/screens/SC-025-sign-in/README.md), [**Registro**](../student/enter/screens/SC-026-sign-up/README.md) y [**Recuperar**](../student/enter/screens/SC-024-forgot-password/README.md) (el umbral: el gate en la acción, vuelta a donde ibas).

## Cómo se verifica

Cada [ficha de pantalla](README.md) nueva responde estas cuatro preguntas antes de darse por revisada, y la respuesta queda escrita en su propia ficha y en el checklist del [Definition of Done](../../plan/definition-of-done.md):

- **¿Esta pantalla exige cuenta para leer?** Tiene que ser no, salvo que sea una acción (corregir, reseñar, responder) y nunca una lectura (US-168).
- **¿Le vuelve a preguntar algo que la cuenta ya declaró?** Tiene que ser no; lo único que puede reaparecer es el hecho que nunca contestó, y una sola vez al año, por mail (US-169).
- **¿Deja de funcionar si no hay plan marcado?** Tiene que ser no, salvo la pantalla que necesita saber qué cursás (US-170).
- **¿Destaca, patrocina u ordena algo por conveniencia?** Tiene que ser no, en ningún listado (US-171).
- **¿Reportar lo que esta pantalla publica exige cuenta?** Tiene que ser no: donde algo está publicado, se puede reportar sin registrarse (US-167).

La [Ficha de cátedra](../student/choose-where-to-study/screens/SC-002-chair/README.md) ya las responde: se lee sin cuenta, no repite ninguna pregunta, no depende de ningún plan marcado y ordena por voces, nunca por conveniencia. Las fichas escritas el 2026-08-19 tienen esta verificación pendiente: es parte de su revisión adversarial.

## Lo que esta épica todavía no resuelve

- **Cómo se audita US-171 en Explorar** cuando haya que elegir un orden de verdad (alfabético, por voces, por cobertura): cualquiera que no sea neutro puede leerse como conveniencia.
- **Si una pantalla de lectura puede tener una acción con cuenta adentro** (corregir, reseñar) sin violar US-168: hoy la respuesta es sí, porque el gate está en la acción y no en la pantalla, pero el límite exacto entre "pantalla de lectura con una acción" y "pantalla que pide cuenta" no está escrito.
