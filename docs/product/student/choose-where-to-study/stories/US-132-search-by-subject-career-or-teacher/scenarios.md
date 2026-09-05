# US-132: Buscar por materia, carrera o docente

> Los casos de [US-132](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que alguien escribe "Análisis Matemático II" en Buscar
Cuando se ejecuta la búsqueda
Entonces los resultados mezclan los cuatro tipos de sujeto que coinciden: la materia Análisis Matemático II, la Cátedra Pérez y la Cátedra Gómez que la dictan, la carrera Ingeniería en Sistemas de UNSTA que la incluye, y UNSTA como institución, cada resultado con su tipo a la vista.
No construido: el buscador devuelve materias, cátedras y docentes (`SearchResultItem`); carreras e instituciones no entran todavía

**E2.** Dado que alguien escribe "Claudia Fernández" en Buscar
Cuando se ejecuta la búsqueda
Entonces el resultado la lleva a la pantalla de Claudia, que no publica ningún conteo sobre ella: lista las cátedras que integra, la Cátedra Pérez entre ellas, y desde ahí se entra a los conteos de cada una.

## Negativos

**N1.** Dado ese mismo resultado
Cuando se arma la pantalla de la docente
Entonces no aparece ningún porcentaje, moda, conteo ni puntaje atribuido a la persona: lo publicado es de cada cátedra y vive en su ficha.

## Edge cases

- Alguien busca "Química General" (la materia de Cátedra Suárez, cuyo equipo docente todavía no está cargado en el catálogo): la materia aparece en los resultados igual, aunque Cátedra Suárez todavía no exista como entidad completamente buscable.
- Alguien busca "Universidad Inventada", que no existe en el catálogo: la búsqueda no devuelve ningún resultado, y explica que es o bien porque no la cargamos todavía (con link a Pedir) o un error de tipeo, nunca un resultado vacío sin explicación.
- Alguien busca "Ingeniería en Sistemas" sin especificar institución: la búsqueda devuelve las distintas ofertas por institución (UNSTA, UTN) como resultados separados, cada una su propia carrera en su institución.
