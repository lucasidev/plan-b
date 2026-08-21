# ADR-0054: Una métrica sin sustento viaja null, nunca cero

- **Estado**: aceptado
- **Fecha**: 2026-07-27 (registra una decisión ya vigente desde S8)

## Contexto

Casi todo lo que planb muestra es una medición derivada de datos que aporta la comunidad: el porcentaje de aprobación de una materia, su dificultad promedio, cuántos choques tiene una combinación, cuántos alumnos cursaron ese combo antes. Todas esas métricas tienen un estado inicial en el que **todavía no hay con qué calcularlas**.

La regla que resuelve ese estado existe y se venía aplicando, pero estaba registrada como una fila de la tabla de desambiguación del glosario. Eso alcanza para que alguien que busca "sin datos" la encuentre; no alcanza para que alguien que está agregando una métrica nueva se tope con ella. La revisión de modelos de 2026-07-26 encontró la regla violada en dos lugares distintos, los dos escritos después de que la regla existiera:

- El detalle de moderación fabricaba `0 reseñas escritas`, `0 reportes recibidos` y `no baneado` cuando el autor no se podía resolver. El moderador leía tres afirmaciones inventadas como señal de que la cuenta era inofensiva.
- La evaluación del simulador devolvía una cohorte con `sampleSize: 0` cuando la combinación estaba bloqueada y la consulta **nunca había corrido**, sobre un contrato cuyo propio docstring declaraba que ese campo siempre trae su valor real.

Los dos son el mismo error: un valor que significa "no lo medimos" viajando disfrazado de medición.

## Decisión

**Una métrica que no se pudo calcular viaja `null`. Nunca su valor neutro.**

Tres consecuencias que forman parte de la decisión:

1. **`0` queda reservado para el cero medido.** Si la consulta corrió y el resultado fue cero, eso es un dato y viaja como `0`. La diferencia entre "no sabemos" y "medimos cero" tiene que sobrevivir el viaje hasta la UI, porque son cosas distintas para el que lee.
2. **El tipo lo expresa.** Los DTOs usan `int?`, `double?`, `bool?` o el objeto entero nullable. No se resuelve con un flag aparte ni con un valor centinela: si el tipo permite el valor neutro, alguien lo va a mandar.
3. **La UI lo dice.** El texto canónico es `NO_DATA_YET` (`sin datos`, en `lib/copy.ts`), nunca la abreviatura `s/d`, que la app no define en ningún lado.

### Dónde aplica hoy

Pass rate de una materia (con el piso anti-reidentificación de [ADR-0047](0047-pass-rate-publico-desde-historial-privado.md)), dificultad y demás insights de materia y docente, choques del planificador cuando no hay ninguna comisión elegida, cohorte de combinación del simulador, y el contexto del autor en el detalle de moderación.

## Alternativas consideradas

### A. Mostrar el valor neutro (`0`, `0.0/5`, `0%`)

Rechazada, y es la que motivó la regla. `0.0/5` se lee "facilísima" y `0%` se lee "no la recomienda nadie": son mediciones, no ausencia de dato. En un producto cuyo activo es la confianza en números aportados por otros alumnos, mostrar una medición inventada es peor que no mostrar nada, porque el lector no tiene forma de distinguirla de una real.

### B. Ocultar la métrica cuando no hay dato

Rechazada. La ausencia es ambigua: el lector no sabe si la métrica no aplica, si está rota o si todavía no hay datos. Además el layout salta según qué materia esté mirando. Decir "sin datos" **es** información, y es la que corresponde.

### C. Usar una abreviatura tipo `s/d`

Rechazada explícitamente en el glosario: es una abreviatura que la app nunca define, así que traslada al lector el trabajo de adivinar.

### D. Mostrar el cero con un disclaimer al lado

Rechazada: el número se lee primero y el disclaimer después, si es que se lee. No arregla la lectura equivocada, solo se cubre.

## Consecuencias

**Positivas**

- La distinción "no medido" contra "medido cero" sobrevive hasta la UI, que es donde importa.
- El tipo nullable hace que el caso se tenga que manejar: no se puede olvidar sin que el compilador o el linter lo marquen.

**Negativas**

- Los DTOs se llenan de nullables, y cada consumidor paga un branch. Es el costo de que el caso no se pueda ignorar.
- Un `bool` no se arregla solo: en SQL, `(columna IS NOT NULL)` sobre un LEFT JOIN fallido devuelve `false`, no `NULL`. Hay que forzarlo con un `CASE` explícito. Es exactamente lo que hacía que el detalle de moderación afirmara "no baneado" sobre un autor que no existía.
- Hay que resistir la tentación de rellenar en el camino bloqueado de un handler, que es donde la regla se rompió las dos veces: el atajo de devolver el objeto completo con ceros para no lidiar con el null.

**A vigilar**

- Cuando una métrica **sí** es computable aunque el camino principal falle, corresponde computarla y no anularla. Ejemplo: las horas semanales de una combinación bloqueada son una suma del catálogo, no una consulta, así que se saben igual. Anular por reflejo también miente, solo que en la otra dirección.

## Refs

- [`docs/domain/ubiquitous-language.md`](../product/language.md), fila "sin datos" de la tabla de desambiguación: el registro original de esta regla, que este ADR promueve a decisión.
- [ADR-0047](0047-pass-rate-publico-desde-historial-privado.md): el piso anti-reidentificación, que es un caso donde la métrica **existe** pero se oculta por privacidad. Es otro motivo para el null y conviene no confundirlos.
