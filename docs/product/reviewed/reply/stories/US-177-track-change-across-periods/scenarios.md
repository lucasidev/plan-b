# US-177: Ver la serie por período

> Los casos de [US-177](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que el ítem "Podían preguntar sin quedar mal" sobre Cátedra Pérez tiene, período por período: 2021 primer cuatrimestre 4 de 4 voces (moda "No" · 100 %), 2023 primer cuatrimestre 12 de 40 voces (moda "No" · 30 %) y 2024 primer cuatrimestre 25 de 38 voces (moda "No" · 66 %), todos según ADR-0083
Cuando se mira la serie de ese ítem en la Ficha de Cátedra Pérez
Entonces cada período se ve por separado, con sus propias voces y su propia moda, sin promediar ni interpolar entre ellos, aunque la proporción baje de 100 % a 30 % y después suba a 66 %.

**E2.** Dado que en 2024 primer cuatrimestre se publicó por primera vez la ficha de Cátedra Pérez y en 2024 segundo cuatrimestre Claudia Fernández respondió
Cuando se mira la serie
Entonces esos dos períodos quedan marcados en la línea de tiempo como "publicado" y "respuesta", respectivamente.

**E3.** Dado que el instrumento administrativo cambió de versión entre 2022 y 2023 porque un ítem sobre trámites cambió de significado y recibió código nuevo
Cuando se mira la serie de ese ítem
Entonces la serie declara el corte entre 2022 y 2023, y ningún período de antes del corte se compara contra uno de después.

## Negativos

**N1.** Dado la serie de un ítem con varios períodos
Cuando se muestra
Entonces ningún período se suaviza ni se rellena con un promedio de los vecinos: un hueco sin voces se ve como hueco, no como una interpolación.

## Edge cases

- Un período sin ninguna voz sobre ese ítem: aparece como hueco en la serie, no se inventa un punto.
- La cursada cambia de período (por ejemplo, la cátedra pasa de dictarse en el primer cuatrimestre a dictarse en el segundo): qué pasa con la serie y su denominador por período. **Falta decidir** (ADR-0082 lo deja abierto en sus consecuencias).
