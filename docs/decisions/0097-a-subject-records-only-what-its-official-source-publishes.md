# ADR-0097: A subject records only what its official source publishes

- **Estado**: aceptado
- **Fecha**: 2026-09-15

## Contexto

El catálogo carga cada carrera con su plan entero. Las universidades publican sus planes con distinto detalle: la FACET de la UNT da código, cuatrimestre y horas semanales de cada materia; la UNSE da nombre y cuatrimestre; la UNSTA y la UTN dan nombre y año. Una materia exigía código, cadencia, cuatrimestre, carga horaria semanal y carga horaria total, así que solo entraba al catálogo un plan publicado con todo ese detalle.

## Decisión

1. **Una materia exige nombre, año del plan y plan.** Código, cadencia, cuatrimestre, carga horaria semanal y carga horaria total se cargan solo si la fuente oficial los publica.
2. **Lo que está se valida.** El código tiene hasta 40 caracteres, la carga horaria semanal va de 0 a 40, la total es positiva y no menor que la semanal, y el cuatrimestre va de 1 a 6. Sin cadencia no hay cuatrimestre, una materia anual no lleva cuatrimestre y cualquier otra cadencia lo exige.
3. **Nada se deduce ni se completa.** Si el plan no publica la carga horaria total, no se calcula desde la semanal; si no publica códigos, las materias no se numeran.
4. **La pantalla muestra lo que hay.** Una materia sin código se nombra solo por su nombre, y una sin cadencia no se ubica en un cuatrimestre.

## Alternativas consideradas

- **A. Cargar solo los planes publicados con todo el detalle.** Descartada: deja afuera a casi todas las universidades de la provincia.
- **B. Completar lo que falta con valores deducidos**, como la carga horaria total por semanas de cursada o códigos por posición. Descartada: presenta como parte del plan un dato que el plan no dice.

## Consecuencias

- En la tabla de materias, código, cadencia, carga horaria semanal y carga horaria total admiten nulo. El índice único por plan y código se mantiene: los nulos no chocan entre sí.
- El backoffice da de alta y edita materias sin esos datos.
- Las listas de materias ordenan por año, cuatrimestre, código y nombre, con los datos faltantes al final.
- Las respuestas que incluyen el código de una materia lo devuelven nulo cuando la materia no tiene.
- El glosario define la carga horaria y la cadencia como datos del plan que pueden faltar.
