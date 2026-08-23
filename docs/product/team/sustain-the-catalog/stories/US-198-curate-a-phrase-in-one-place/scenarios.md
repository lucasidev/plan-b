# US-198: Editar la frase en un solo lugar

> Los casos de [US-198](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que el catálogo de frases tiene 46 filas, entre ellas F18 "Hay clases que no se dan" (sujeto cátedra, eje gestión, sentido negativo).
Cuando quien cura las frases edita la redacción, el sujeto o el eje de F18 desde Frases.
Entonces el cambio se guarda en ese único lugar, sin una segunda copia editable en ninguna otra pantalla, con el registro "último cambio: quien cura las frases, 21 ago 2026".

**E2.** Dado que F18 "Hay clases que no se dan" tiene eje gestión, y hoy está marcada en 3 cátedras, 2 materias, 2 carreras y una institución.
Cuando quien cura las frases cambia su eje de gestión a exigencia.
Entonces el sistema avisa, antes de confirmar, que se van a reprocesar esas 3 cátedras, 2 materias, 2 carreras y una institución, y recién al confirmar esas 8 fichas se reprocesan con F18 del lado de exigencia.

**E3.** Dado que, antes del cambio, F18 tenía 37 de 100 voces en la Ficha de cátedra de "Análisis Matemático I, R. Domínguez" (UTN): 37% en crudo, publicado con su encogimiento en 28,2%; y en otra de las tres cátedras afectadas, más chica, tenía 4 de 4 voces (100% en crudo, encogido a 51,0%).
Cuando se confirma el cambio de eje de F18, de gestión a exigencia, y esas fichas se reprocesan.
Entonces las dos siguen mostrando la misma proporción de F18 (28,2% y 51,0% respectivamente), pero ahora en la lista de exigencia en vez de la de gestión: el número de voces no cambia, cambia dónde se atribuye.

**E4.** Dado que el catálogo de frases tiene sus 46 filas con redacción, sujeto y eje ya curados.
Cuando alguien abre Método.
Entonces la lista que Método publica es exactamente esas 46 filas, sin ninguna frase de más ni de menos.

## Negativos

**N1.** Dado que quien cura las frases empieza a editar el eje de F18 de gestión a exigencia, y ve el aviso de que esto va a reprocesar 3 cátedras, 2 materias, 2 carreras y una institución. Cuando cancela la edición en vez de confirmar. Entonces F18 sigue con eje gestión en las 8 fichas afectadas, y ninguna se reprocesa.

## Edge cases

- Corregir la redacción de una frase sin tocar su eje no dispara el aviso de reproceso de atribución, porque el eje no cambió.
- Dos personas del equipo editando la misma frase al mismo tiempo: qué pasa si los dos cambios chocan no está definido (Falta decidir).
- Una frase recién creada, con cero fichas donde está marcada: cambiar su eje no reprocesa ninguna ficha, pero el catálogo igual guarda el cambio con autor y fecha.
- El límite de longitud de una redacción nueva o corregida no está definido (Falta decidir).
