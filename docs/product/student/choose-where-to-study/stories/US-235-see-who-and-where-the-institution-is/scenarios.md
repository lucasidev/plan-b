# US-235: Ver quién es y dónde queda la institución

> Los casos de [US-235](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que UNSTA tiene logo, URL oficial y una unidad académica en San Miguel de Tucumán, Cuando Valentina abre su Ficha de institución sin cuenta, Entonces reconoce esos datos en la cabecera y puede abrir la URL oficial.

**E2.** Dado que una universidad ofrece la misma carrera en dos sedes de localidades distintas, Cuando Valentina abre cada Ficha de carrera, Entonces cada oferta muestra su sede y localidad correspondiente y no la dirección general de la universidad.

## Negativos

**N1.** Dado que una oferta no tiene unidad académica vinculada, Cuando se arma su Ficha de carrera, Entonces no hereda la ubicación de otra oferta ni de la primera unidad de la institución.

**N2.** Dado que la URL oficial guardada dejó de responder, Cuando Valentina abre la ficha, Entonces el producto conserva el dato relevado con su fuente; no reemplaza el enlace por una búsqueda ni por una URL inferida.

## Edge cases

- Una institución sin logo muestra su nombre y el estado «Logo todavía no cargado», sin imagen genérica que pueda confundirse con identidad oficial.
- Una institución con una sola unidad académica sigue mostrando la localidad de esa unidad; no la resume como si toda la institución funcionara ahí.
