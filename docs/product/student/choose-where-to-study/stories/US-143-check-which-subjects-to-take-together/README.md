# US-143: Saber qué materias se pueden llevar juntas

**Épica**: [Elegir dónde estudiar](../../README.md)
**Del mapa**: O3-1

## Historia

Como quien está cursando, quiero saber qué materias se pueden llevar juntas, para no repetir la combinación que ya me tumbó.

## Listo cuando

- La ficha publica, por par de materias y período, cuántas cuentas reseñaron las dos y cuántas dejaron una; sale solo de las reseñas, que ya traen materia y período.
- Se publica con el mismo piso que cualquier conteo agregado, **10 por par de materias y período**: con menos, el número diría más de quién se acordó de reseñar que de la combinación.
- No se filtra a nadie: es un conteo sobre dos materias, y el producto no sabe por dónde va tu carrera ([ADR-0086](../../../../../decisions/0086-the-product-informs-it-does-not-track-your-degree.md)).

## Dónde se resuelve

- [Ficha de carrera](../../screens/SC-001-career/README.md): la co-cursada de las materias del plan, por par y período.
- [Ficha de materia](../../screens/SC-007-subject/README.md): con qué otras materias se llevó esta, y cómo les fue a los que las llevaron juntas.

## Notas

Es el dato que la lapicera no puede calcular: armar el horario lo resuelve cualquiera en quince minutos, saber que 18 de 40 dejaron una de las dos no lo resuelve nadie solo ([THESIS.md](../../../../../THESIS.md), "Qué no hace").

Dependía de US-154 ("decir cómo terminó la cursada"), **ya construida** desde R1: es el ítem `COURSE_OUTCOME` del que sale quién dejó una. Hallazgo C04 de la [revisión del 2026-08-29](../../../../../history/reviews/2026-08-29-my-career-epic.md).

Vivía en la épica Mi carrera, que se cerró con [ADR-0086](../../../../../decisions/0086-the-product-informs-it-does-not-track-your-degree.md): el producto informa sobre materias y cátedras, no hace seguimiento de tu carrera. Con la épica se fueron US-144 (filtrar la co-cursada a tu plan) y US-145 (marcar lo que vas a cursar), que existían para eso. Esta story sobrevivió porque su dato no necesita saber nada de quien lo lee.
