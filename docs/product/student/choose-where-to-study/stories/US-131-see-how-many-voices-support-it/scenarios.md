# US-131: Ver sobre cuántas voces se calcula

> Los casos de [US-131](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que "¿Se dictaron las clases?" en Cátedra Pérez tiene moda "Faltaron muchas · 41 %" sobre 37 voces
Cuando se muestra esa frase en la Ficha de Cátedra Pérez
Entonces al lado de la moda se lee "de 37", y la distribución completa (casi todas 27 %, faltaron algunas 32 %, faltaron muchas 41 %) trae el mismo denominador.

**E2.** Dado que Cátedra Molina (Álgebra I, UNT) recién pasó el piso, con "¿Salías de la clase entendiendo?" en moda "Casi nunca" sobre sus 10 primeras voces
Cuando se muestra esa frase
Entonces se publica igual, con "de 10" al lado, sin esperar a que existan más voces que las que hacen falta para pasar el piso.

## Negativos

**N1.** Dado que una frase de "qué hizo la cátedra" tiene distinto número de voces que otra de "qué les pasó a los que cursaron", en la misma Ficha de Cátedra Pérez, porque no todos contestan todo
Cuando se muestran las dos
Entonces cada una lleva su propio "de N": el denominador de una frase no se completa con las voces de otra frase de la misma cursada.

**N2.** Dado cualquier frase publicada en cualquier ficha
Cuando se muestra su moda
Entonces nunca aparece un porcentaje solo, sin su "de N" al lado.

## Edge cases

- Una cátedra recién pasó el piso, con exactamente 10 voces en total: sus frases se publican con el mismo formato que una cátedra con cientos, sin destacarse como "reciente" ni advertirse como "poco confiable" más allá de mostrar el número real.
- Dos frases distintas de la misma ficha, una con 37 voces y otra con 34 porque no todos contestan todo: cada una muestra su propio "de N", nunca el total de voces de la cursada entera.
