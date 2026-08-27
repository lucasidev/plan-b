# US-139: Saber si el vacío es de ustedes

> Los casos de [US-139](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que "Contador Público, Siglo 21" tiene 34 pedidos confirmados en la cola pero Sofía todavía no la cargó al catálogo,
Cuando Ana la busca en Buscar o la mira en Explorar,
Entonces el resultado dice "no la cargamos todavía" (nunca "sin resultados" a secas ni un espacio en blanco), con el link a Pedir al lado.

**E2.** Dado que "Licenciatura en Psicología, UNSTA" se cargó la semana pasada y todavía ninguna cursada la reseñó,
Cuando Ana entra a su Ficha de carrera,
Entonces la ficha dice que arranca vacía y muestra el piso de publicación (10 reseñas por cátedra, [ADR-0082](../../../../../decisions/0082-the-review-captures-the-cursada-in-three-layers.md)): nunca "0%" ni una sección en blanco sin explicación.

**E3.** Dado que "Ingeniería en Sistemas, UNSTA" está cargada y tiene voces en 22 de sus 40 materias canónicas (menos de la mitad),
Cuando Ana entra a su Ficha de carrera,
Entonces la cabecera dice "todavía no derivamos" con "22 de 40 materias con voces" a la vista, y deja leer materia por materia en vez de esconder lo que sí hay.

## Negativos

**N1.** Dado que "Licenciatura en Psicología, UNSTA" está cargada y sin voces, cuando se renderiza su Ficha de carrera, entonces NO muestra ninguna proporción en 0% ni una cabecera vacía sin texto: tiene que decir explícitamente que arranca vacía.

**N2.** Dado que "Contador Público, Siglo 21" todavía no está cargada (está en la cola, no en el catálogo), cuando Ana la busca, entonces el resultado NO dice "cargada, sin llegar al piso" (eso implicaría que ya existe en el catálogo): dice "no la cargamos todavía", con el link a Pedir.

## Edge cases

- La transición de "cargada, sin llegar al piso" a "cargada, con voces, todavía no derivamos" ocurre cuando la cátedra llega al piso de 10 reseñas: no hay un cuarto estado intermedio entre los tres que la ficha distingue.
- Buscar devuelve una carrera cargada sin voces o sin cabecera como un resultado normal, con su propio estado a la vista, nunca como "sin resultados": eso queda reservado para cuando de verdad no hay nada con ese nombre.
