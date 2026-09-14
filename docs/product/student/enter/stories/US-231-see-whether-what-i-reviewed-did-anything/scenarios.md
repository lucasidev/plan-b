# US-231: Ver si lo que reseñé sirvió de algo

> Los casos de [US-231](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Lucía reseñó cuatro cursadas en tres cátedras, y una de esas cátedras junta 12 reseñas y otra 9.
Cuando entra a Mis aportes.
Entonces ve sus reseñas, cada una con su cátedra: la de 12 dice "junta 12 reseñas" y linkea a su ficha, y la de 9 dice "junta 9 reseñas". No ve ninguna de sus respuestas.

**E2.** Dado que la carrera de Lucía tiene 51 materias en el plan y 23 tienen alguna cátedra que cruzó el piso.
Cuando entra a Mis aportes.
Entonces lee "23 de 51 materias" con las 28 restantes dichas como que todavía no juntan reseñas suficientes, y desde ahí llega a la ficha de su carrera.

**E3.** Dado que Matías reseñó una sola cursada, y en su carrera la Cátedra Bravo, que él no reseñó, junta 9 reseñas.
Cuando entra a Mis aportes.
Entonces ve la suya con "junta N reseñas" y, en "Tu reseña la publica", a Bravo con "junta 9 reseñas: con la tuya se publica" y Reseñar al lado: la acción está donde está el motivo, no en un botón suelto arriba.

## Negativos

**N1.** Dado que Matías todavía no reseñó nada.
Cuando entra a Mis aportes.
Entonces no ve una lista vacía ni un cero: en lugar de la lista lee que una cátedra publica su ficha a partir de diez reseñas, con una sola acción, y los bloques de su carrera se muestran igual, porque leer no depende de que él reseñe.

**N2.** Dado que la carrera de Ana se cargó hace dos semanas y ninguna cátedra llegó al piso.
Cuando entra a Mis aportes.
Entonces la cobertura dice cuántas materias tiene el plan y que ninguna publica todavía: una carrera sin reseñas no es impecable, es desconocida.

**N3.** Dado que Lucía borró la única reseña que tenía de la Cátedra Ruiz ([US-165](../../../undo/stories/US-165-edit-or-delete-what-i-said/README.md)).
Cuando vuelve a Mis aportes.
Entonces esa reseña ya no aparece en su lista, y si con eso la cátedra quedó bajo el piso, su ficha dejó de publicar.

**N4.** Dado que el perfil de una cuenta quedó sin carrera vigente.
Cuando entra a Mis aportes.
Entonces los bloques de la carrera no se dibujan, en vez de mostrar "0 de 0": no hay plan del que calcularlos.

## Lo que no pasa nunca

**X1.** En ningún estado aparece un puntaje, un promedio, una racha, un porcentaje de completitud como logro de la cuenta, ni un ranking de quién aportó más ([ADR-0083](../../../../../decisions/0083-the-ficha-publishes-counts-not-scores.md)).

**X2.** En ningún estado se muestra una respuesta concreta, ni propia ni ajena: de las cátedras reseñadas se ve el conteo de voces, nunca qué se contestó.

**X3.** En ningún estado se sugieren materias para cursar, horarios ni orden de cursada ([ADR-0086](../../../../../decisions/0086-the-product-informs-it-does-not-track-your-degree.md)).
