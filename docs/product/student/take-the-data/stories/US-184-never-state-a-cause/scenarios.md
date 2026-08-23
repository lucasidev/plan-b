# US-184: Nunca afirmar una causa

> Los casos de [US-184](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que la Cátedra Pérez tiene "Hay clases que no se dan" (F18) en 12 de 40 voces (18,1%)
Cuando alguien lee la lista de frases de gestión de esa ficha
Entonces ve la frase con su proporción de voces, sin ningún texto adicional que explique por qué pasa.

**E2.** Dado que la cabecera de la Cátedra Pérez muestra sus dos proporciones (exigencia y gestión, con el mismo denominador)
Cuando alguien las lee
Entonces las lee como la lectura agregada de los dos ejes (cuánta gente dice que es dura, cuánta gente marcó alguien fallando), nunca como un puntaje ni como un juicio aparte de la lista de frases.

**E3.** Dado que "Contenido de hace diez años" (F07, materia, gestión) sale alta en Análisis Matemático II
Cuando ese dato se publica en la Ficha de materia
Entonces se muestra la frase con su proporción de voces, sin ningún texto que explique por qué el contenido no se actualiza ni quién es responsable: eso es lo que el producto no sabe y no afirma (THESIS, "Qué no hace").

## Negativos

**N1.** Dado que "Te la estudiás solo" (F16, cátedra, gestión) sale alta en la Cátedra Pérez y "Es dura de verdad" (F01, materia, exigencia) también sale alta
Cuando se arma cualquier texto de esa ficha
Entonces no aparece una frase que conecte las dos como causa y efecto (por ejemplo, "es dura porque te la estudiás solo"): son dos hechos separados, con su propio sujeto y su propio n, y ninguno explica al otro.

## Edge cases

- Claudia responde en su réplica que en mayo de 2024 tuvo licencia médica sin reemplazo: esa es la explicación de Claudia, citada con su nombre y su rol, y no se confunde con una causa que el producto afirme por cuenta propia.
- El eje de una frase (exigencia o gestión) es una atribución publicada, no una causa: dice de qué lado cae el hecho (la carrera siendo dura, alguien fallando), nunca por qué pasa ni quién tiene la culpa (ADR-0065).
