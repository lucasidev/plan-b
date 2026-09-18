# US-209: Revisar el campo libre que el filtro retuvo

> Los casos de [US-209](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que una reseña tiene respuestas cerradas y el campo libre dice "El profesor Juan Pérez vive en calle San Martín 123", y el filtro lo retuvo por un dato personal de un tercero.
Cuando Nahuel abre ese elemento en Reportes.
Entonces ve el campo libre y el fragmento que disparó el filtro, sin el nombre, mail ni ningún otro dato de la cuenta que escribió la reseña.

**E2.** Dado que el filtro retuvo "Nunca publica los criterios antes de corregir y eso cambia entre comisiones", aunque no contiene una agresión dirigida ni un dato personal.
Cuando Nahuel lo libera.
Entonces el campo libre pasa a la cola normal de curaduría y la decisión queda registrada con la categoría, Nahuel como responsable y la fecha.

## Negativos

**N1.** Dado que el filtro retuvo "La ayudante es una inútil y vive en calle San Martín 123" por agresión dirigida y dato personal de un tercero.
Cuando Nahuel lo descarta.
Entonces el campo libre no pasa a curaduría, nunca se publica y la decisión queda registrada sin exponer quién escribió la reseña.

**N2.** Dado que una persona sin el rol de moderación intenta abrir un campo libre retenido.
Cuando pide verlo o resolverlo.
Entonces no accede al texto ni a la acción de liberarlo o descartarlo.

## Edge cases

**B1.** Dado que un campo libre retenido lleva siete días sin revisión.
Cuando vence ese plazo.
Entonces permanece pendiente: no se libera ni se descarta por el paso del tiempo.

**B2.** Dado que una reseña respondió tres preguntas cerradas y su campo libre quedó retenido.
Cuando Nahuel descarta solamente ese campo libre.
Entonces las tres respuestas cerradas siguen contando como una voz en sus agregados.
