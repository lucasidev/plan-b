# US-230: Entender que se rompió sin perder lo que venía cargando

> Los casos de [US-230](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Silvia entra a la Ficha de carrera de Ingeniería en Sistemas de UNSTA y la carga falla.
Cuando cae en Error.
Entonces lee qué pasó en palabras ("no pudimos cargar esto"), sin código ni jerga a la vista, y tiene dos salidas: probar de nuevo o volver a Explorar.

**E2.** Dado que Matías venía reseñando su cursada de Análisis Matemático II, ya marcó F01 y F18, y la pantalla falla antes de que publique.
Cuando cae en Error.
Entonces lo que ya contestó quedó guardado solo y hay un link para retomarlo desde donde estaba (US-161): no vuelve a empezar.

## Negativos

**N1.** Dado que la falla fue un 500 del backend con su stack trace.
Cuando Matías cae en Error.
Entonces nada de eso aparece en pantalla: ni el código, ni el mensaje interno, ni el nombre del servicio que falló.

## Edge cases

- La falla ocurre justo al publicar la reseña: si se publicó o no, y qué dice la pantalla.
- Cae en Error sin nada a medias que retomar: la tercera línea no aparece.
- Vuelve a fallar al tocar "probar de nuevo".
- Falla estando sin sesión, leyendo algo público.

**Falta decidir**: si el copy distingue 404 de 500, abierto en la ficha de Error.
