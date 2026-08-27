# US-130: Ver cómo se calcula cada número

> Los casos de [US-130](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Rocío quiere citar en una reunión el ítem "¿Se dictaron las clases?" de Cátedra Pérez, con moda "Faltaron muchas · 41 %" sobre 37 voces
Cuando entra a Método
Entonces encuentra cómo se arma ese número: la moda es la opción literal más marcada, la distribución completa que la sostiene (casi todas 27 %, faltaron algunas 32 %, faltaron muchas 41 %) es el resto del dato, y puede reproducirlo ella misma sin pedirle nada al equipo.

**E2.** Dado que Método explica la fama por convergencia
Cuando se lee ese bloque
Entonces muestra que un hecho como "Acá no se aprende preguntando" sale de que varios ítems distintos (salir entendiendo, poder preguntar, que le contesten) apuntan al mismo lado, y que el sustento publicado al lado es la lista de esos ítems con sus porcentajes, nunca un número que los promedie.

**E3.** Dado que Método explica la comparación entre cátedras hermanas
Cuando se lee ese bloque
Entonces dice que se calcula con intervalos de Wilson sobre cada proporción, y que la diferencia se publica solo cuando los intervalos de las dos cátedras no se tocan; si se tocan, o si la cátedra es la única de su materia, la comparación no se publica.

**E4.** Dado que el catálogo tiene sus ítems de contexto, de conducta observable y de vivencia
Cuando se abre el bloque del catálogo en Método
Entonces cada ítem se lista con sus opciones y la capa a la que pertenece, y hay forma de ver el catálogo entero, no solo una muestra sin salida.

**E5.** Dado los sesgos declarados
Cuando se lee Método
Entonces dice explícitamente que todo dato de reseñas es de quienes reseñaron, y que los datos oficiales (duración real, egreso por cohorte) citan su fuente y su período, no un promedio de lo que declaró nadie.

## Negativos

**N1.** Dado que alguien busca la fórmula completa de una comparación entre cátedras en cualquier ficha
Cuando la busca ahí
Entonces no la encuentra completa: la ficha lleva a Método con "¿Cómo calculamos esto?", no repite la fórmula entera en cada una.

## Edge cases

- El catálogo todavía no tiene ningún ítem destilado del campo libre (solo los semilla): Método publica igual los semilla completos, con la marca "destilado" reservada para cuando exista el primero.
- Alguien lee Método sin cuenta: la moda, la distribución, el catálogo y los sesgos se leen igual, sin login (US-168).
