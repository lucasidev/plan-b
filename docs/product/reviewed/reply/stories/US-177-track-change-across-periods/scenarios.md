# US-177: Ver la serie por período

> Los casos de [US-177](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que F18 "Hay clases que no se dan" sobre Cátedra Pérez tiene, período por período: 2021 primer cuatrimestre 4 de 4 voces (51,0%), 2023 primer cuatrimestre 12 de 40 voces (18,1%) y 2024 primer cuatrimestre 60 de 120 voces (41,2%), todos según ADR-0075
Cuando se mira la serie de esa frase en la Ficha de Cátedra Pérez
Entonces cada período se ve por separado, con sus propias voces y su propio encogimiento, sin promediar ni interpolar entre ellos, aunque la proporción baje de 51,0% a 18,1% y después suba a 41,2%.

**E2.** Dado que en 2024 primer cuatrimestre se publicó por primera vez la ficha de Cátedra Pérez y en 2024 segundo cuatrimestre Claudia Fernández respondió con su réplica
Cuando se mira la serie
Entonces esos dos períodos quedan marcados en la línea de tiempo como "publicado" y "réplica", respectivamente.

**E3.** Dado que F42 "Cada trámite es una pelea" sobre UNSTA como institución tiene 2022 con 4 de 4 voces (51,0%), 2023 con 37 de 100 voces (28,2%) y 2024 con 60 de 120 voces (41,2%)
Cuando Marcela Sosa entra a ver la serie de UNSTA desde la Ficha de institución
Entonces ve los mismos tres períodos separados y sin suavizar, que es lo que le dice si mejoró desde que se publicó.

## Negativos

**N1.** Dado la serie de una frase con varios períodos
Cuando se muestra
Entonces ningún período se suaviza ni se rellena con un promedio de los vecinos: un hueco sin voces se ve como hueco, no como una interpolación.

## Edge cases

- Un período sin ninguna voz sobre esa frase: aparece como hueco en la serie, no se inventa un punto.
- La cursada cambia de período (por ejemplo, la cátedra pasa de dictarse en el primer cuatrimestre a dictarse en el segundo): qué pasa con la serie y su denominador por período. **Falta decidir** (ADR-0075 lo deja abierto en sus consecuencias).
