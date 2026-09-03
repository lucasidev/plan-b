# US-180: Descargar el crudo sin registrarse

> Los casos de [US-180](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que en el período 2024, primer cuatrimestre, 40 personas reseñaron la cursada de la Cátedra Pérez (Análisis Matemático II, UNSTA), y de esas 40, 12 respondieron "Faltaron muchas" en "¿Se dictaron las clases?" (frase I07, capa conducta observable)
Cuando Rocío entra a Método sin haber iniciado sesión y descarga el CSV
Entonces la tabla 1 trae una fila con frase I07 ("¿Se dictaron las clases?"), opción "Faltaron muchas", sujeto Cátedra Pérez (Análisis Matemático II, UNSTA), período 2024, primer cuatrimestre y voces 12 de 40.

**E2.** Dado que en el período 2024, segundo cuatrimestre, 40 personas reseñaron Análisis Matemático II en la Cátedra Pérez, de las cuales 32 la aprobaron o la regularizaron; y que en ese mismo período 40 personas llevaron juntas Análisis Matemático II y Programación I, de las cuales 12 dejaron una de las dos
Cuando Rocío descarga el CSV
Entonces la tabla 2 trae una fila por materia y período con su tasa de finalización (Análisis Matemático II, 2024, segundo cuatrimestre: 32 de 40), y una fila por par y período con la co-cursada (Análisis Matemático II más Programación I, 2024, segundo cuatrimestre: 40 juntas, 12 dejaron una).

**E3.** Dado que Matías reseñó la Cátedra Pérez y escribió algo en el campo libre
Cuando Rocío descarga el CSV
Entonces ninguna de las dos tablas trae el nombre de Matías, su cuenta, su perfil ni el texto de su campo libre: la fila de I07 solo trae frase, opción, sujeto, período y voces, igual que lo que ya se lee en la Ficha de cátedra.

## Negativos

**N1.** Dado que Matías reseñó la cursada de la Cátedra Pérez del período 2024, primer cuatrimestre, una sola vez (una reseña por cuenta y cursada)
Cuando se recalculan las voces que va a traer el CSV para esa cursada en ese período
Entonces Matías cuenta una sola voz en el denominador (las 40): no hay forma de que la misma cuenta sume más de una voz a la misma cursada.

**N2.** Dado que Lucía reseñó la Cátedra Pérez y en su campo libre contó una anécdota puntual
Cuando Rocío busca esa anécdota palabra por palabra dentro del CSV descargado
Entonces no la encuentra en ninguna columna: el CSV nunca exporta el campo libre, porque nunca se publica.

## Edge cases

- Una cátedra que todavía no llega al piso de 10 reseñas (Cátedra Gómez, la otra cátedra de Análisis Matemático II en UNSTA, período 2025, primer cuatrimestre, 4 reseñas) no aporta filas de conteos por frase al CSV todavía: el piso de privacidad ([ADR-0082](../../../../../decisions/0082-the-review-captures-the-cursada-in-three-layers.md)) aplica igual en la descarga que en la ficha.
- Una institución recién cargada sin ninguna cursada reseñada todavía no aporta ninguna fila a ninguna de las dos tablas: no existe una fila con "voces: 0", porque una métrica sin sustento viaja null, nunca cero (ADR-0054).
- El primer día del producto, sin ninguna reseña todavía, el CSV se descarga igual, sin cuenta, con las dos tablas en cero filas.
- Se corta la conexión de Rocío a mitad de la descarga: puede reintentar el botón "Descargar el CSV" en Método sin fricción, porque no hay sesión ni estado de descarga que retomar (el archivo es estático y sin cuenta).
- Una institución con coma en su nombre (por ejemplo, "UTN, Facultad Regional Tucumán") aparece como sujeto de una fila sin correr las columnas del CSV. **Falta decidir**: el separador, el escapado y la codificación exactos del CSV.
- En el período 2025, primer cuatrimestre nadie respondió "¿Avisó la fecha del parcial con anticipación?" en la Cátedra Pérez: esa frase viaja vacía para ese período, nunca en cero, porque nadie la respondió (saltear siempre vale).

**Falta decidir**: el formato exacto del CSV (columnas, codificación, si trae la proporción por opción ya calculada o solo el conteo crudo) y con qué periodicidad se regenera el crudo.
