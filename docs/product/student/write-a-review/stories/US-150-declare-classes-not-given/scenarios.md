# US-150: Declarar cuántas clases no se dieron

> Los casos de [US-150](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Matías cursó la cátedra Pérez de Análisis Matemático II y en el paso 4 marca la frase F18 (Hay clases que no se dan).
Cuando avanza al paso 5.
Entonces el sistema le muestra la pregunta "¿cuántas, más o menos?" en rangos, y Matías declara "6".

**E2.** Dado que en la cátedra Pérez de Análisis Matemático II, período 2026-C1, 12 personas (entre ellas Matías, con 6) marcaron F18 y declararon cuántas clases faltaron, con mediana 4 y rango entre 2 y 8.
Cuando se visita la Ficha de cátedra.
Entonces se publica "clases sin dar: 4, entre 2 y 8, 12 voces", nunca un valor único.

## Negativos

**N1.** Dado que Lucía cursó la misma cátedra Pérez pero no marcó la frase F18 en el paso 4, Cuando avanza al paso 5, Entonces la pregunta "¿cuántas, más o menos?" no le aparece.

**N2.** Dado que en un período nadie declaró cuántas clases faltaron en una cátedra, Cuando se visita su Ficha de cátedra, Entonces la sección "clases sin dar" no se publica: ni un cero, ni un valor por defecto.

## Edge cases

- Si en el paso 5 elige "no me acuerdo / no aparece" para la cátedra, no le aparece la pregunta de clases sin dar: no hay cátedra a la que colgarla.
- Al destildar "Hay clases que no se dan" en Editar, el número declarado se borra junto con la frase (D02).
- Si las declaraciones no convergen (por ejemplo, algunas personas dicen 2 y otras 15), se publica igual el rango completo, nunca un promedio ni un valor único.
