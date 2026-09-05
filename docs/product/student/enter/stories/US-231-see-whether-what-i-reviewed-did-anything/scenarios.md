# US-231: Ver si lo que reseñé sirvió de algo

> Los casos de [US-231](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Lucía reseñó cuatro cursadas en tres cátedras, y una de esas cátedras junta 12 reseñas y otra 9.
Cuando entra a Inicio.
Entonces ve las tres cátedras que reseñó: la de 12 dice "12 voces · publica" y linkea a su ficha, y la de 9 dice "9 voces · le falta una". No ve ninguna de sus respuestas.

**E2.** Dado que la carrera de Lucía tiene 51 materias en el plan y 23 tienen alguna cátedra que cruzó el piso.
Cuando entra a Inicio.
Entonces lee "23 de 51 materias" con las 28 restantes dichas como que no llegan al piso, y desde ahí llega a la ficha de su carrera.

**E3.** Dado que Matías reseñó una sola cursada, de una cátedra que junta 9 reseñas.
Cuando entra a Inicio.
Entonces la ve con "le falta una" y puede reseñar otra cursada desde ahí: la acción está donde está el motivo, no en un botón suelto arriba.

## Negativos

**N1.** Dado que Matías todavía no reseñó nada.
Cuando entra a Inicio.
Entonces no ve una lista vacía ni un cero: ve una pantalla que dice que una cátedra publica su ficha a partir de diez reseñas, con una sola acción, y la cobertura de su carrera al pie, porque leer no depende de que él reseñe.
Roto: #441

**N2.** Dado que la carrera de Ana se cargó hace dos semanas y ninguna cátedra llegó al piso.
Cuando entra a Inicio.
Entonces la cobertura dice cuántas materias tiene el plan y que ninguna publica todavía: una carrera sin reseñas no es impecable, es desconocida.

**N3.** Dado que Lucía borró la única reseña que tenía de la Cátedra Ruiz ([US-165](../../../undo/stories/US-165-edit-or-delete-what-i-said/README.md)).
Cuando vuelve a Inicio.
Entonces esa cátedra ya no aparece en su lista, y si con eso quedó bajo el piso, su ficha dejó de publicar.

**N4.** Dado que el perfil de una cuenta quedó sin carrera vigente.
Cuando entra a Inicio.
Entonces el bloque de cobertura no se dibuja, en vez de mostrar "0 de 0": no hay plan del que calcularla.

## Lo que no pasa nunca

**X1.** En ningún estado aparece un puntaje, un promedio, una racha, un porcentaje de completitud como logro de la cuenta, ni un ranking de quién aportó más ([ADR-0083](../../../../../decisions/0083-the-ficha-publishes-counts-not-scores.md)).

**X2.** En ningún estado se muestra una respuesta concreta, ni propia ni ajena: de las cátedras reseñadas se ve el conteo de voces, nunca qué se contestó.

**X3.** En ningún estado se sugieren materias para cursar, horarios ni orden de cursada ([ADR-0086](../../../../../decisions/0086-the-product-informs-it-does-not-track-your-degree.md)).
