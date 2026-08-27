# US-184: Nunca afirmar una causa

> Los casos de [US-184](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que la Cátedra Pérez tiene "Faltaron muchas" en 12 de 40 voces en "¿Se dictaron las clases?"
Cuando alguien lee el bloque de conducta observable de esa ficha
Entonces ve el ítem con su moda y su distribución, sin ningún texto adicional que explique por qué pasa.

**E2.** Dado que arriba de la ficha de la Cátedra Pérez aparece un hecho de convergencia ("no salían entendiendo" + "no podían preguntar" + "no contestaba", tres ítems distintos apuntando al mismo lado)
Cuando alguien lo lee
Entonces lo lee como la lectura agregada de varios ítems que apuntan al mismo lado, nunca como un puntaje ni como un juicio aparte de los conteos que lo sostienen.

**E3.** Dado que "Varios" sale con moda alta en "¿Tomó temas que no estaban en el programa?" en Análisis Matemático II
Cuando ese dato se publica en la Ficha de cátedra
Entonces se muestra el ítem con su moda y su distribución, sin ningún texto que explique por qué pasa ni quién es responsable: eso es lo que el producto no sabe y no afirma (THESIS, "Qué no hace").

## Negativos

**N1.** Dado que "No había forma" sale con moda alta en "¿Respondía consultas fuera de clase?" y "Me quedé atrás" sale con moda alta en "¿Pudiste seguir el ritmo?", los dos en la Cátedra Pérez
Cuando se arma cualquier texto de esa ficha
Entonces no aparece un texto que conecte los dos ítems como causa y efecto (por ejemplo, "te quedás atrás porque no responde consultas"): son dos hechos separados, cada uno con su propio n, y ninguno explica al otro.

## Edge cases

- Claudia responde, en la respuesta del reseñado, que en mayo de 2024 tuvo licencia médica sin reemplazo: esa es la explicación de Claudia, citada con su nombre y su cargo, y no se confunde con una causa que el producto afirme por cuenta propia.
- La capa de un ítem (qué hizo la cátedra o qué te pasó a vos) separa quién actuó de quién lo vivió, pero no es una causa: dice de qué lado del aula sale el hecho, nunca por qué pasa ni quién tiene la culpa (ADR-0082, ADR-0083).
