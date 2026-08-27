# US-127: Ver cuánto tarda de verdad la carrera

> Los casos de [US-127](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Ingeniería en Sistemas en UNT dura 5 años en el papel y, según la serie del Ministerio de Educación (SPU, 2015-2024), 8,4 años en la realidad
Cuando se mira el bloque de datos oficiales en la Ficha de carrera
Entonces se muestran los dos números uno al lado del otro, "Dura en el papel: 5 años" y "Dura en la realidad: 8,4 años", con "Fuente: Ministerio de Educación (SPU) · serie 2015-2024" al pie del bloque.

**E2.** Dado que Ingeniería en Sistemas en UTN todavía no tiene ninguna cursada reseñada
Cuando se mira su Ficha de carrera
Entonces el bloque de datos oficiales se muestra igual, porque no depende de reseñas: solo "qué frena la cursada" y la cobertura dicen que la carrera arranca vacía.

**E3.** Dado que la Ficha de carrera muestra "Dura en la realidad: 8,4 años"
Cuando se lee ese dato
Entonces nunca aparece sin su fuente y su período al lado: ningún dato oficial se publica sin decir de dónde sale.

## Negativos

**N1.** Dado que una carrera todavía no tiene relevamiento oficial cargado
Cuando se arma su Ficha de carrera
Entonces el bloque no inventa un número ni lo calcula a partir de reseñas propias: dice que ese dato todavía no está relevado.

## Edge cases

- La misma carrera en tres instituciones (US-128) tiene su propia duración real cada una, con su propia fuente: UNT 8,4 años, UTN 7,1 años, UNSTA 6,2 años (Dónde estudiarla); no existe una duración real compartida entre las tres.
- Un plan reformado, con dos planes coexistiendo: a cuál de los dos corresponde "dura en el papel" cuando los dos están vigentes queda abierto (US-204).
