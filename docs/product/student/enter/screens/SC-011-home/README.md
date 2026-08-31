# Inicio (la pantalla)

> Ficha de pantalla, dueña: la épica [Entrar](../../README.md). **Estado**: escrita el 2026-08-30 junto con [US-231](../../stories/US-231-see-whether-what-i-reviewed-did-anything/README.md), que faltaba, y construida el mismo día, con sus dos bloques y datos reales. El conteo de voces por cátedra sale de `GET /api/reviews/chairs/mine`, que las devuelve todas en una consulta; si ese read degrada, la fila se dibuja igual con el conteo ausente en vez de con un cero. Pide cuenta. Slug `/home`.

Vive en Entrar por el mismo motivo que la pantalla de [Error](../SC-023-error/README.md): es chasis, no un paso de ningún recorrido. Nadie se propone "ir a Inicio"; se cae acá al cruzar el umbral.

**No es la landing.** La landing es [La entrada](../../../choose-where-to-study/screens/SC-004-entrance/README.md), en `/`, y se lee sin cuenta: le explica a alguien que llegó de un link qué es esto, mostrándole una ficha real. Inicio no explica qué es el producto: quien está acá ya tiene cuenta y ya declaró su carrera.

## Quién la usa

**Matías** (reclamó solo y no sirvió de nada: vuelve a ver si esta vez sí, y si la respuesta es no se va) y **Lucía** (tiene más para decir que nadie y menos tiempo que nadie: lo que la pantalla le ponga adelante es lo que va a hacer, y lo que no, no lo hace nunca).

Leer no pide cuenta, así que nadie vuelve acá a leer. Se vuelve a producir, o a ver qué pasó con lo producido.

## Qué stories resuelve

[US-231](../../stories/US-231-see-whether-what-i-reviewed-did-anything/README.md): ver si lo que reseñé sirvió de algo.

Aplican además las garantías de otras épicas, como en toda pantalla: [US-169](../../../../guarantees/README.md#stories) (no repreguntar lo que la cuenta ya contestó) y [US-171](../../../../guarantees/README.md#stories) (nada destacado ni ordenado por conveniencia).

## Qué muestra

Dos bloques, y esa poda es la mitad del valor de esta ficha: un boceto previo tenía cuatro, y al preguntar qué requisito servía cada uno sobrevivieron dos.

1. **Las cátedras que reseñaste, con su estado.** Una fila por cátedra, ordenadas por la cursada más reciente: la materia, el período, cuántas voces junta y si publica o cuánto le falta. Es una sola lista y no dos, porque "lo que aporté" y "lo que le falta al piso" son el mismo dato mirado desde dos lados. Contesta "¿sirvió?" y pide la próxima reseña sin pedirla, con la acción en la fila que la motiva.
2. **La cobertura de tu carrera.** Cuántas materias del plan tienen alguna cátedra publicando y cuántas no llegan al piso. Es el contexto que sostiene al bloque de arriba cuando tus dos reseñas parecen nada. Mismo cálculo que [US-134](../../../choose-where-to-study/stories/US-134-check-the-coverage-behind-the-card/README.md) publica en la ficha de la carrera, leído para la carrera declarada de esta cuenta: es la misma cobertura, mirada desde adentro.

Y la acción principal, reseñar una cursada.

## Estados

- **Con reseñas**: los dos bloques.
- **Sin ninguna reseña todavía**: no es el mismo layout con menos cosas ni una lista vacía. Es una pantalla entera centrada que dice qué hace falta para que una cátedra publique, ofrece una sola acción, y cierra con la cobertura de la carrera, porque **leer no depende de que reseñes**.
- **Carrera sin ninguna cátedra publicando**: la cobertura dice cuántas materias tiene el plan y que ninguna llegó al piso. Una carrera sin reseñas no es impecable, es desconocida.
- **Perfil sin carrera vigente**: el bloque de cobertura no se dibuja, en vez de mostrar "0 de 0". No debería ocurrir: toda cuenta declara su carrera al registrarse ([ADR-0086](../../../../../decisions/0086-the-product-informs-it-does-not-track-your-degree.md)) y el perfil nace al verificar el mail.

## Lo que no muestra nunca

- **Ningún puntaje, promedio, racha ni progreso personal.** Ni "llevás 4 de 10", ni la cobertura presentada como logro tuyo: es del plan, no un marcador de la cuenta ([ADR-0083](../../../../../decisions/0083-the-ficha-publishes-counts-not-scores.md)).
- **Ningún ranking de quién aportó más.**
- **Ninguna respuesta concreta**, ni propia ni ajena: de cada cátedra reseñada se ve el conteo de voces, nunca qué se contestó.
- **Materias sugeridas para cursar, horarios ni orden de cursada.** El producto informa, no arma tu cuatrimestre ([ADR-0086](../../../../../decisions/0086-the-product-informs-it-does-not-track-your-degree.md)).
- **Nada destacado ni patrocinado.**

Mostrar "le falta una" de una cátedra bajo el piso sí está permitido y no adelanta nada: ese número ya es público en la ficha de la cátedra, que dice "junta 3 reseñas: con 7 más se publica".

## Adónde va

- A la [ficha de una cátedra](../../../choose-where-to-study/screens/SC-002-chair/README.md), desde cualquier fila que ya publique.
- A [Reseñar una cursada](../../../write-a-review/screens/SC-015-write-review/README.md), desde la acción principal y desde cada fila a la que le falta una.
- A la [ficha de la carrera](../../../choose-where-to-study/screens/SC-001-career/README.md) declarada, desde la cobertura.
- A [Mis aportes](../../../undo/screens/SC-018-my-contributions/README.md), para corregir o borrar, desde el menú.

## Decisiones que aplica

- [ADR-0086](../../../../../decisions/0086-the-product-informs-it-does-not-track-your-degree.md): el producto informa y no lleva tu carrera. Por eso no hay plan marcado, ni materias en curso, ni nada que se parezca a un avance.
- [ADR-0083](../../../../../decisions/0083-the-ficha-publishes-counts-not-scores.md): conteos, nunca puntajes. Vale también llevado a la cuenta, y es lo que descartó el bloque de "cuánto aportaste".
- [ADR-0082](../../../../../decisions/0082-the-review-captures-the-cursada-in-three-layers.md): el piso de 10 y su razón, que es la privacidad de quien reseña.
- [ADR-0071](../../../../../decisions/0071-the-visual-language-is-a-bulletin.md): el bloque de acción destaca por contraste y no por tinte, porque el contrato visual tiene un solo color y es la alarma.

## Lo que esta ficha deja abierto

Nada. Las tres preguntas que quedaban se cerraron el 2026-08-31 y están arriba, en Qué muestra y en Estados. Se anotan acá sus razones porque las tres se pueden revisitar con evidencia, no por gusto:

- **La lista va por la cursada más reciente**, no alfabética ni por cercanía al piso. La story pregunta qué pasó con lo que dijiste, en pasado, y lo reciente es el orden en que la persona lo tiene en la cabeza. Ordenar por cuánto le falta a cada cátedra contesta otra pregunta (qué te conviene hacer ahora) y vuelve Inicio una cola de tareas. La acción vive en la fila que la motiva, así que no necesita estar primera.
- **La cobertura se cuenta en el momento**, sin caché. Es una consulta con índice y no gatilla ninguna regla: a diferencia del piso, un valor viejo acá no publica nada que no debiera, así que cachearla más adelante es seguro. Se revisita cuando haya tráfico y `pg_stat_user_tables` diga que duele, no antes ([ADR-0034](../../../../../decisions/0034-redis-as-cache-and-ephemeral-state.md)).
- **La lista no se corta.** Un tope con salida a Mis aportes sería la forma, pero esconder filas es esconder justo lo que la pantalla existe para contestar. Se revisita si alguien llega a tantas cátedras que la pantalla deje de leerse; hoy nadie pasa de un puñado.
