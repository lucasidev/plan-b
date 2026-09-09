# US-133: Saber si termina en un título

> Los casos de [US-133](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.
>
> Reescritos contra el modelo de [ADR-0090](../../../../../decisions/0090-an-official-datum-is-a-dated-claim-with-value-source-and-status.md) (hallazgo E01): la versión anterior daba por hecho un "egresan por cohorte: 14 %" publicado por carrera, con fuente al pie. El [relevamiento](../../../../../history/reviews/2026-09-07-official-data-survey.md) mostró que **la SPU no publica egreso por cohorte por carrera**, solo el flujo anual por institución o por disciplina: lo que la ficha puede mostrar es la [regla del proxy](../../../../../history/reviews/2026-09-07-official-data-survey.md#la-regla-de-los-derivados) etiquetada como derivada, nunca con la forma de un dato publicado.

## Camino feliz

**E1.** Dado que la SPU no publica egreso por cohorte para la Tecnicatura de UNSTA y el equipo calculó el proxy de flujo institucional (egresados 2022 sobre nuevos inscriptos de 2019, tres años antes: 21,4 %)
Cuando Silvia mira el bloque de datos oficiales sin abrir nada
Entonces lee "Egreso por cohorte" con el número, etiquetado "Derivado", y un link a la regla en Método; nunca con la forma de un dato publicado.

**E2.** Dado que una carrera todavía no tiene el proxy de egreso calculado
Cuando se arma su Ficha de carrera
Entonces "Egreso por cohorte" se muestra "No publicado" con qué se buscó y la fecha, nunca un cero ni un cálculo propio sobre reseñas.

**E3.** Dado que "Egreso por cohorte" se muestra etiquetado como derivado
Cuando Silvia sigue el link a Método
Entonces encuentra ahí la regla del proxy y sus sesgos explicados (que no es una cohorte real, que mezcla carreras de duración distinta, que sube o baja con la matrícula), nunca en la ficha misma.

## Negativos

**N1.** Dado que una carrera todavía no tiene "egreso por cohorte" relevado ni derivado
Cuando se arma su Ficha de carrera
Entonces el dato no se completa con un cálculo propio ni con un cero: dice que ese dato todavía no está relevado.

**N2.** Dado que "Egreso por cohorte" se muestra como derivado
Cuando Silvia lo lee sin abrir nada
Entonces nunca se confunde con un dato publicado directamente por la SPU: la etiqueta "Derivado" está siempre a la vista, no escondida detrás de un clic.

## Edge cases

- Silvia compara Ingeniería en Sistemas en tres instituciones en Dónde estudiarla: cada tarjeta muestra su propio "egreso por cohorte" derivado, con la misma forma y el mismo link a Método; los sesgos del proxy se explican una sola vez, arriba, no tarjeta por tarjeta (ADR-0090).
- Cómo explicarle a Silvia qué es una "cohorte" si en algún momento se agrega el detalle metodológico detrás del número: la propia épica lo deja abierto.
- La misma carrera con dos fuentes oficiales que discrepan levemente entre sí (por ejemplo SPU y CONEAU): cuál prevalece, o si se muestran las dos, no está resuelto en esta story. **Falta decidir**.
