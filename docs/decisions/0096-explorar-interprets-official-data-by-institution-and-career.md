# ADR-0096: Explorar interprets official data by institution and career

- **Estado**: aceptado
- **Fecha**: 2026-09-13

## Contexto

Quien entra a Explorar está eligiendo dónde estudiar: investiga universidades y carreras, no cátedras. Hasta hoy la tesis le daba a ese nivel solo listados y cobertura, y guardaba toda interpretación para la ficha de cátedra (la fama, la comparación entre hermanas). El resultado, visto en el rediseño del catálogo del 2026-09-13, es una pantalla que muestra datos y no dice nada: "1 carrera con reseñas", "sin reseñas todavía".

Los datos oficiales que el producto ya releva permiten decir cosas a ese nivel sin inventar un número: cuántos eligen cada institución y cuántos egresan (anuario SPU), cuántos avanzan dos materias o más por año (anuario SPU), qué carrera egresa más (egreso por cohorte, derivado), qué institución acreditó la entidad auditora (CONEAU), cuál publica su transparencia.

## Decisión

1. **Explorar interpreta lo oficial por institución y por carrera**, con nombre propio: la universidad más elegida, la carrera con mejor tiempo de salida, la universidad donde más alumnos avanzan, la que la entidad auditora acreditó, la carrera más ofrecida. Cada afirmación sale de **un solo dato**, oficial o de conteo, y viaja con su fuente y su fecha.
2. **No hay número compuesto.** Nada suma varios datos en uno, ni ordena instituciones por una mezcla. Se dice quién va primero en cada dato; no se declara un ganador.
3. **Las señales de reseñas siguen sin cruzarse entre instituciones.** Lo que se compara entre instituciones y carreras es lo oficial; los conteos de reseñas se comparan solo entre cátedras hermanas, como antes.
4. **Donde la fuente no llega, no se dice nada.** Si el anuario no abre la matrícula por carrera, no existe "la carrera más elegida": existe "la carrera más ofrecida", que la Guía SIU sí sostiene.

La tesis cambia en la decisión 1 y en "Qué publicamos" 3 y 8 para decir esto.

## Alternativas consideradas

- **A. Mantener la prohibición y mostrar solo cobertura y listados.** Era el texto anterior de la tesis. Descartada: para quien elige, la pantalla no informa, y "la universidad con más estudiantes según el anuario" no es un ranking sino un dato leído.
- **B. Un índice por institución que resuma varios datos.** Descartada: es el número compuesto que ADR-0083 mató para las cátedras, con el mismo problema (se discute el peso de cada parte, no el hecho).
- **C. "La mejor universidad" y "la mejor carrera" a partir de las reseñas.** Descartada: cruza señales de reseñas entre instituciones, donde el sesgo de quién reseña no se cancela.

## Consecuencias

- Explorar lleva una columna "Lo que los datos dicen" con esas afirmaciones, cada una con su link a la ficha y su fuente en mono.
- La ficha de institución dice cuántos la eligen, cuántos egresan y cuántos avanzan, con el anuario como fuente, además de su transparencia.
- Las afirmaciones se recalculan del relevamiento: cuando entren más instituciones (R8), el "más" cambia solo y la fuente lo respalda.
- El copy de la entrada ("nunca un puntaje ni un ranking") sigue siendo cierto: no hay puntaje ni orden compuesto.

## Refs

- [THESIS.md](../THESIS.md), decisión 1 y "Qué publicamos" 3 y 8
- [ADR-0083](0083-the-ficha-publishes-counts-not-scores.md) (los conteos y por qué no hay número compuesto)
- [ADR-0085](0085-three-instruments-and-official-data.md) y [ADR-0090](0090-an-official-datum-is-a-dated-claim-with-value-source-and-status.md) (los datos oficiales con fuente, fecha y estado)
