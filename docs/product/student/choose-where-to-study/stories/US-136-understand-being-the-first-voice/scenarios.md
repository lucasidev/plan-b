# US-136: Entender la ficha vacía cuando llego primero

> Los casos de [US-136](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Ana busca su facultad y llega a la Ficha de Cátedra Ibáñez (Física II, UNT), que todavía no tiene ninguna reseña
Cuando entra a esa ficha
Entonces no ve 0 % ni "0 de 0": la ficha dice que arranca vacía y que puede ser la primera persona en reseñarla.

**E2.** Dado que Cátedra Molina (Álgebra I, UNT) tiene 3 reseñas, por debajo del piso de 10
Cuando alguien entra a esa ficha
Entonces ve "junta 3 reseñas: con 7 más se publica", sin ningún adelanto de moda ni de distribución.

**E3.** Dado que Ingeniería en Sistemas en Siglo 21 está cargada en el catálogo pero ninguna de sus cátedras pasó el piso todavía
Cuando alguien entra a su Ficha de carrera
Entonces dice que arranca vacía, nunca un 0 %.

## Negativos

**N1.** Dado cualquiera de estas fichas, vacía o bajo el piso
Cuando se muestra
Entonces en ningún caso aparece un botón de "desbloquear con más voces" ni una barra de progreso hacia un mínimo distinto de 10: el único número que hace falta cruzar es el piso, y siempre se dice cuál es.

## Edge cases

- Llega la reseña número 10 a Cátedra Ibáñez: la ficha deja de mostrar el conteo hacia el piso y publica sus ítems con moda y distribución de una sola vez, no de a poco.
- Que Cátedra Ibáñez esté vacía o bajo el piso es un estado distinto del estado del canal de su titular: que Prof. Paredes nunca haya verificado su identidad ni respondido no hace que la ficha esté "vacía"; son dos cosas separadas (US-176).
