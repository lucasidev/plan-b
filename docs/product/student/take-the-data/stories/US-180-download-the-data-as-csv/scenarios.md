# US-180: Descargar el crudo sin registrarse

> Los casos de [US-180](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que en el período 2024, primer cuatrimestre, 40 personas reseñaron o votaron la cursada de la Cátedra Pérez (Análisis Matemático II, UNSTA), y de esas 40, 12 marcan o sostienen "Hay clases que no se dan" (F18, sujeto cátedra, eje gestión); entre esas 12 está Matías, que no reseñó esa cursada sino que votó "a mí también me pasó" en la reseña de Lucía, que sí la había marcado
Cuando Rocío entra a Método sin haber iniciado sesión y descarga el CSV
Entonces la tabla 1 trae una fila con frase F18 ("Hay clases que no se dan"), sujeto Cátedra Pérez (Análisis Matemático II, UNSTA), período 2024, primer cuatrimestre, voces 12 de 40 y eje gestión: el voto de Matías ya está sumado en esas 12, sin una fila aparte para él.

**E2.** Dado que 300 personas entraron a Ingeniería en Sistemas (UNSTA) entre 2012 y 2016 y reseñaron algo de esa carrera, de las cuales 45% se recibió, 30% se fue y 25% no dijo o sigue; y que en el período 2024, segundo cuatrimestre, 40 personas llevaron juntas Análisis Matemático II y Programación I, de las cuales 12 dejaron una de las dos
Cuando Rocío descarga el CSV
Entonces la tabla 2 trae una fila con esos agregados por carrera-institución y cohorte (Ingeniería en Sistemas, UNSTA, cohorte 2012-2016), una fila por materia y período con su aprobación y su abandono de cursada (Análisis Matemático II, 2024, primer cuatrimestre), y una fila por par y período con la co-cursada (Análisis Matemático II más Programación I, 2024, segundo cuatrimestre: 40 juntas, 12 dejaron una).

**E3.** Dado que Matías escribió, además de sus votos, una reseña propia de la Cátedra Pérez con un comentario en sus palabras
Cuando Rocío descarga el CSV
Entonces ninguna de las dos tablas trae el nombre de Matías, su cuenta, su perfil ni el texto de su comentario: la fila de F18 solo trae frase, sujeto, período, voces y eje, igual que lo que ya se lee en la Ficha de cátedra.

## Negativos

**N1.** Dado que Matías vota "a mí también me pasó" en tres reseñas distintas de la Cátedra Pérez, todas del período 2024, primer cuatrimestre
Cuando se recalculan las voces que va a traer el CSV para esa cursada en ese período
Entonces Matías cuenta una sola voz en el denominador (las 40), nunca tres: votar varias reseñas de la misma cursada no multiplica su voz (ADR-0075, punto 3).

**N2.** Dado que Lucía marcó frases al reseñar la Cátedra Pérez y en su comentario contó una anécdota puntual
Cuando Rocío busca esa anécdota palabra por palabra dentro del CSV descargado
Entonces no la encuentra en ninguna columna: el CSV nunca exporta testimonios en bloque, se hayan retirado o no.

## Edge cases

- Una cátedra con una sola voz (Cátedra Gómez, la otra cátedra de Análisis Matemático II en UNSTA, período 2025, primer cuatrimestre, 1 de 1 marcó "Explican bien", F12, cátedra, gestión) aparece igual en el CSV desde la primera voz, con su proporción encogida a 20,7%: no hay piso que la deje afuera del archivo (ADR-0066).
- Una institución recién cargada sin ninguna cursada reseñada todavía no aporta ninguna fila a ninguna de las dos tablas: no existe una fila con "voces: 0", porque una métrica sin sustento viaja null, nunca cero (ADR-0054).
- El primer día del producto, sin ninguna reseña todavía, el CSV se descarga igual, sin cuenta, con las dos tablas en cero filas.
- Se corta la conexión de Rocío a mitad de la descarga: puede reintentar el botón "Descargar el CSV" en Método sin fricción, porque no hay sesión ni estado de descarga que retomar (el archivo es estático y sin cuenta).
- Una institución con coma en su nombre (por ejemplo, "UTN, Facultad Regional Tucumán") aparece como sujeto de una fila sin correr las columnas del CSV. **Falta decidir**: el separador, el escapado y la codificación exactos del CSV.
- En el período 2025, primer cuatrimestre nadie declaró cuántas clases no se dieron en la Cátedra Pérez: ese campo viaja vacío, nunca en cero, porque nadie lo midió.

**Falta decidir**: el formato exacto del CSV (columnas, codificación, si trae el encogimiento ya calculado o solo k y n) y con qué periodicidad se regenera el crudo.
