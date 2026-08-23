# US-135: Leer los testimonios debajo de las frases

> Los casos de [US-135](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado el testimonio de Matías sobre Cátedra Pérez (2024, primer cuatrimestre), con su comentario y las frases F18 "Hay clases que no se dan" y F05 "El final toma cosas que no se dieron" marcadas
Cuando se mira la Ficha de Cátedra Pérez
Entonces ese comentario aparece debajo de las listas de frases por eje, nunca arriba ni como cuerpo de la ficha, con su período (2024, primer cuatrimestre), la cátedra (Cátedra Pérez) y las dos frases que marcó a la vista.

**E2.** Dado ese mismo testimonio
Cuando se muestra
Entonces no trae cuenta, ni nombre, ni cómo terminó la cursada de Matías, tiene como máximo un párrafo, y no suma ni resta a ningún conteo de frases.

**E3.** Dado que el testimonio de Matías tiene 12 votos de "a mí también me pasó" y otro testimonio de Cátedra Pérez tiene 3
Cuando se ordenan los testimonios
Entonces el de Matías aparece antes que el de 3 votos, sin que el equipo lo haya elegido a mano como destacado.

## Negativos

**N1.** Dado el conjunto de testimonios de Cátedra Pérez
Cuando se calcula cualquier proporción de frase (por ejemplo F18 en 15 de 41 voces, 24%)
Entonces leer o no leer un testimonio no cambia ese número: el testimonio se lee aparte de los conteos, que ya vienen de la reseña y sus votos.

**N2.** Dado el listado completo de testimonios de Cátedra Pérez
Cuando se arma el orden
Entonces ningún testimonio aparece marcado como "destacado" ni "elegido por el equipo": el único criterio de orden son los votos.

## Edge cases

- Un testimonio sin ningún voto todavía: aparece igual, al final si el orden es descendente por votos, no se oculta por tener cero votos.
- Una reseña que marcó frases pero no escribió comentario: no aparece como testimonio (no hay texto que mostrar), pero sus frases siguen sumando a los conteos igual.
- Dos testimonios con exactamente el mismo número de votos (empate): el criterio de desempate no está definido en la story. **Falta decidir**.
