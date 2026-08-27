# US-153: No ser tratado como un fracaso

> Los casos de [US-153](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que en la cátedra Pérez de Análisis Matemático II, período 2019-C1, el ítem "¿Se dictaron las clases?" tenía la opción "Faltaron muchas" con 2 de 9 voces.
Cuando Diego reseña esa cursada respondiendo "la dejé" en cómo terminó y "Faltaron muchas" en ese ítem.
Entonces esa opción pasa a 3 de 10 voces (10,8 %, límite inferior de Wilson con z = 1.96), exactamente como si la voz fuera de alguien que la aprobó, y en ningún lugar público se distingue que esa voz "la dejó".

## Negativos

**N1.** Dado que el ítem "¿Se dictaron las clases?" en esa cátedra y período tiene ahora 3 de 10 voces en "Faltaron muchas" (una de Diego, que la dejó, y dos de personas que la aprobaron), Cuando se publica esa proporción, Entonces no hay ningún desglose ni filtro que separe "voces de quienes dejaron" de "voces de quienes aprobaron": las tres cuentan igual.

## Edge cases

- Ninguna ficha ni el CSV ofrecen un filtro público por "cómo terminó" la cursada de cada voz.
