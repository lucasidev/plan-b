# US-183: Publicar el método y la fórmula

> Los casos de [US-183](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que en la Cátedra Pérez, con 40 voces, 24 respondieron "Casi nunca" en "¿Salías de la clase entendiendo el tema?" (frase I09, capa vivencia)
Cuando Valentina entra a Método antes de citar ese número
Entonces encuentra el badge de moda tal cual se publica ("Casi nunca · 60 %"): un conteo directo sobre quienes respondieron, sin ninguna fórmula de ajuste, porque el piso de 10 reseñas ([ADR-0082](../../../../../decisions/0082-the-review-captures-the-cursada-in-three-layers.md)) ya filtró las muestras chicas.

**E2.** Dado que el catálogo tiene frases semilla agrupadas en tres capas (contexto, qué hizo la cátedra, qué te pasó a vos), cada una con su código estable y sus opciones (por ejemplo, I01 "¿Contestaba las preguntas en clase?": Siempre · A veces · Casi nunca · Nadie preguntaba)
Cuando Rocío entra a Método
Entonces ve el catálogo entero, cada frase con su capa y sus opciones a la vista, incluida la capa de vivencia al lado de la de conducta observable.

**E3.** Dado que en el período 2024, primer cuatrimestre de la Cátedra Pérez, 40 personas respondieron "¿Se dictaron las clases?": 24 "Casi todas", 12 "Faltaron algunas" y 4 "Faltaron muchas"
Cuando Método explica cómo se calcula cada distribución
Entonces declara que las tres opciones comparten el mismo denominador (las 40 voces que respondieron esa frase en esa cursada y período) y que sus conteos suman el total de quienes respondieron, nunca a un juicio aparte; y las tres viajan con sus voces y su período al lado.

**E4.** Dado que "¿Salías de la clase entendiendo el tema?" (I09), sumando todos los períodos y las dos cátedras de Análisis Matemático II (Pérez y Gómez) en UNSTA, tiene 60 voces con "Casi nunca" de 100 que respondieron
Cuando se compara ese dato con la misma frase dentro de una sola cátedra y un solo período
Entonces cada uno muestra su propio n y su propio período (60 de 100 para toda la materia; un número distinto para un solo período de una sola cátedra): son denominadores de niveles distintos, y ninguno se confunde con el otro.

## Negativos

**N1.** Dado que alguien busca una fórmula de ajuste (encogimiento, promedio bayesiano) aplicada a la moda o a la distribución que se publica en una ficha
Cuando la busca en Método
Entonces no la encuentra: lo publicado es el conteo directo de quienes respondieron, sin ajuste; el intervalo de Wilson solo corre puertas adentro, para decidir si el contraste entre cátedras hermanas se publica (ADR-0083).

**N2.** Dado que "¿Se dictaron las clases?" se publica en la Cátedra Pérez
Cuando se muestra su moda o su distribución en cualquier ficha o en el CSV
Entonces nunca aparece sin sus voces (por ejemplo, 24 de 40) ni sin su período (2024, primer cuatrimestre) al lado: no hay un número pelado.

## Edge cases

- "¿Tomó temas que no estaban en el programa?" todavía no la respondió nadie en ninguna cursada: igual aparece en el catálogo entero de Método, porque el catálogo se publica completo aunque una frase no tenga uso todavía.
