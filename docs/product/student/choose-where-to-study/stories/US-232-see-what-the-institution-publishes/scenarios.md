# US-232: Ver qué publica cada institución y qué no

> Los casos de [US-232](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.
>
> Cada fila del checklist es una afirmación fechada del modelo de [ADR-0090](../../../../../decisions/0090-an-official-datum-is-a-dated-claim-with-value-source-and-status.md), con sujeto institución. Los valores de abajo salen del [relevamiento de fuentes](../../../../../history/reviews/2026-09-07-official-data-sources.md).

## Camino feliz

**E1.** Dado que UNT publica su nómina docente, su presupuesto y su boletín oficial, y que las tres afirmaciones están relevadas con fecha
Cuando Valentina abre la Ficha de institución de UNT sin cuenta
Entonces lee una fila por campo, cada una con lo que publica y la fecha en que se buscó, y "Ver fuentes" le lista las URL.

**E2.** Dado que UNSTA es privada y no publica actas, presupuesto ni nómina, y que eso se buscó el 2026-09-07
Cuando Valentina abre su Ficha de institución
Entonces esas tres filas dicen "No publicado" con esa fecha, y siguen visibles con el mismo peso que las que sí tienen dato.

**E3.** Dado que San Pablo-T no informó a la SPU en los anuarios 2020 a 2022
Cuando Valentina lee su cabecera de identidad
Entonces la cantidad de estudiantes dice "No informado" con su fecha, y nunca un cero.

## Negativos

**N1.** Dado que una institución no publica un campo del checklist
Cuando se arma su Ficha de institución
Entonces la fila no se oculta, no se deja en blanco y no se rellena con el valor de otra institución ni de otro período.

**N2.** Dado que un campo del checklist no tiene todavía ninguna afirmación relevada
Cuando se arma la ficha
Entonces la fila dice que ese dato no está relevado, y no se confunde con "la institución no lo publica": son dos cosas distintas.

**N3.** Dado que la nómina que publica UNT trae CUIL y DNI de cada docente
Cuando la ficha muestra el campo de nómina
Entonces publica el link y el hecho de que la nómina existe, nunca los datos personales que esa nómina contiene.

## Bordes

**B1.** Dado que un campo del checklist no le aplica a una institución
Cuando se arma su ficha
Entonces la fila lo dice con su razón, y se distingue a simple vista de "no publicado".

**B2.** Dado que la misma institución tiene dos afirmaciones para el mismo campo, relevadas en fechas distintas
Cuando se arma la ficha
Entonces muestra la más reciente, y la anterior sigue existiendo para Método.
