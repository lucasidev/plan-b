# US-198: Editar el ítem en un solo lugar

> Los casos de [US-198](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que el catálogo de ítems tiene 46 filas, entre ellas el ítem "¿Se dictaron las clases?" (capa "qué hizo la cátedra", código I07, opciones "Casi todas · Faltaron algunas · Faltaron muchas").
Cuando quien cura los ítems edita el texto o las opciones de I07 desde Frases.
Entonces el cambio se guarda en ese único lugar, sin una segunda copia editable en ninguna otra pantalla, con el registro "último cambio: quien cura los ítems, 21 ago 2026".

**E2.** Dado que el ítem I07 tiene código estable y hoy está publicado en 3 cátedras.
Cuando quien cura los ítems cambia el significado de I07 (por ejemplo, agrega una opción que cambia lo que se pregunta).
Entonces el sistema avisa, antes de confirmar, que esto abre un código nuevo (I07-b) y corta la serie; recién al confirmar, I07 deja de ofrecerse y I07-b arranca su propia serie desde cero.

**E3.** Dado que, antes del cambio, I07 tenía 37 de 100 voces con moda "Faltaron algunas · 37 %" en la Ficha de cátedra de "Análisis Matemático I, R. Domínguez" (UTN).
Cuando se confirma el código nuevo I07-b y esa cátedra sigue respondiendo el ítem nuevo en el período siguiente.
Entonces la serie de esa cátedra muestra el corte: lo de antes queda bajo I07, lo de después bajo I07-b, y no se comparan entre sí.

**E4.** Dado que el catálogo de ítems tiene sus 46 filas con texto, opciones y capa ya curados.
Cuando alguien abre Método.
Entonces la lista que Método publica es exactamente esas 46 filas, sin ningún ítem de más ni de menos.

## Negativos

**N1.** Dado que quien cura los ítems empieza a editar I07 cambiando su significado, y ve el aviso de que esto va a abrir un código nuevo y cortar la serie.
Cuando cancela la edición en vez de confirmar.
Entonces I07 sigue igual, con su mismo código, y no se crea ningún código nuevo.

## Edge cases

- Corregir el texto de un ítem sin cambiar las opciones ni lo que pregunta no dispara el aviso de código nuevo, porque el significado no cambió.
- Dos personas del equipo editando el mismo ítem al mismo tiempo: qué pasa si los dos cambios chocan no está definido (Falta decidir).
- Un ítem recién creado, sin ninguna voz todavía: cambiar su significado abre igual un código nuevo, pero como no había serie previa, no hay nada que cortar.
- El límite de longitud de un texto nuevo o corregido no está definido (Falta decidir).
