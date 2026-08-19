# Que no me molesten

> Épica del grupo **O6 · Que no me molesten (garantía: el contrapeso, nadie quiere más funciones)** del [catálogo](../../domain/user-stories.md). **Estado**: garantía vigente, sin pantallas propias; se verifica en cada ficha de pantalla y en el Definition of Done. No se planifica.

## Qué es

El contrapeso de todas las demás épicas: cuatro garantías que ninguna persona pide en primera persona y que, aun así, tienen que cumplirse en toda pantalla nueva. No se construyen (no hay una US que las cierre): se verifican, pantalla por pantalla, contra un checklist. Son la decisión 3 de la tesis dicha como lista de chequeo (leer no pide cuenta), más que nada ya declarado se vuelva a preguntar, que el producto funcione sin un plan marcado, y que nada esté destacado ni patrocinado. Se les suma la garantía que antes era O5-3: recuperar la contraseña, con la cuenta y todo lo que tiene adentro, vuelve con un link al mail.

## Para quién

**Quien lee** (Valentina, Silvia, Rocío, y cualquiera sin cuenta), **quien vuelve** (cualquier cuenta, cuando vuelve a leer o a corregir), y **Matías**: por él el gate llega en la acción y no en la puerta, y el onboarding es saltable.

## Stories

Las de esta épica, con su letra completa: es la única copia de cada una (el [catálogo](../../domain/user-stories.md) es el índice por ID). Al entrar a sprint, la ficha `US-NNN` amplía la fila, no la reemplaza.

> Garantías, como O5. O6-1 es la decisión 3 de la tesis dicha como checklist.

| ID | Story | Listo cuando | Notas |
|---|---|---|---|
| O6-1 | Como quien lee, quiero que no me pidan cuenta para nada, porque vine a mirar, no a participar. | Ninguna pantalla de lectura tiene login. |  |
| O6-2 | Como quien vuelve, quiero que no me vuelvan a preguntar lo que ya dije, porque lo dije una vez y lo demás viene con lo que reseño. | 1. Ningún hecho ya declarado se vuelve a preguntar en ningún flujo: entré se pregunta una sola vez; cursé y cómo terminó vienen con la reseña.<br>2. Lo único que puede volver a ofrecerse es el hecho que nunca respondí (el reenganche por mail, una vez al año), y responderlo lo apaga para siempre. |  |
| O6-3 | Como quien vuelve, quiero poder saltearlo y usar la app igual, porque no vine a hacer trámites. | Todo funciona sin plan cargado, salvo lo que necesita saber qué cursás. |  |
| O6-4 | Como quien lee, quiero que no me vendan nada, porque desconfío de cualquier cosa que parezca promocionada. | No hay institución destacada, patrocinada ni ordenada por conveniencia. |  |

## Decisiones que aplica

[THESIS.md](../../THESIS.md) (decisión 3: leer no pide cuenta, producir sí; el gate está en la acción, no en la puerta), [ADR-0067](../../decisions/0067-trajectory-from-declared-facts-by-closed-cohort-and-side-by-side-comparison.md) (el reenganche por mail una vez al año, una sola pregunta; entré se pregunta una sola vez), [ADR-0069](../../decisions/0069-the-marked-plan-is-a-private-preference-not-a-fact.md) (marcar el plan es preferencia privada y opcional: sin ella, todo lo demás sigue funcionando), [ADR-0063](../../decisions/0063-the-product-is-a-pressure-instrument.md) (rankings y acuerdos con instituciones quedan fuera por tesis: no hay lugar para destacar ni patrocinar), [Definition of Done](../../domain/definition-of-done.md), sección 7 "Restricciones del producto" (que a su vez cita las restricciones del [catálogo](../../domain/user-stories.md#restricciones-no-son-stories-se-verifican-en-el-dod): accesibilidad, datos personales, política de moderación pública, rendimiento).

## Pantallas

Esta épica no tiene pantallas propias: es la garantía que se verifica en cada pantalla de las demás. Las que cita para verificarse viven en [`docs/design/screens/`](../../design/screens/README.md) y en sus épicas dueñas: todas las públicas del [mapa](../../design/product-map.md) (O6-1, O6-4), [Reseñar](../write-a-review/README.md) y [Empezar](../my-career/README.md) (O6-2, O6-3), **Ingresar**, **Registro** y **Recuperar** (el umbral: el gate en la acción, vuelta a donde ibas).

## Cómo se verifica

Cada [ficha de pantalla](../../design/screens/README.md) nueva responde estas cuatro preguntas antes de darse por revisada, y la respuesta queda escrita en su propia ficha y en el checklist del [Definition of Done](../../domain/definition-of-done.md):

- **¿Esta pantalla exige cuenta para leer?** Tiene que ser no, salvo que sea una acción (votar, corregir, reseñar, responder) y nunca una lectura (O6-1).
- **¿Le vuelve a preguntar algo que la cuenta ya declaró?** Tiene que ser no; lo único que puede reaparecer es el hecho que nunca contestó, y una sola vez al año, por mail (O6-2).
- **¿Deja de funcionar si no hay plan marcado?** Tiene que ser no, salvo la pantalla que necesita saber qué cursás (O6-3).
- **¿Destaca, patrocina u ordena algo por conveniencia?** Tiene que ser no, en ningún listado (O6-4).

La [Ficha de cátedra](../../design/screens/chair/README.md), la única escrita hasta ahora, ya las responde: se lee sin cuenta, no repite ninguna pregunta, no depende de ningún plan marcado, y ordena los testimonios por votos, nunca por conveniencia.

## Lo que esta épica todavía no resuelve

- **Cómo se audita O6-4 en Explorar** cuando haya que elegir un orden de verdad (alfabético, por voces, por cobertura): cualquiera que no sea neutro puede leerse como conveniencia.
- **Si una pantalla de lectura puede tener una acción con cuenta adentro** (votar, corregir) sin violar O6-1: hoy la respuesta es sí, porque el gate está en la acción y no en la pantalla, pero el límite exacto entre "pantalla de lectura con una acción" y "pantalla que pide cuenta" no está escrito.
